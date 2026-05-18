import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppRoutes } from "./AppRoutes";
import { AppShell } from "../components/shell/AppShell";
import { useToastNotifications } from "../components/notifications/useToastNotifications";
import { BootPage } from "../pages/boot/BootPage";
import { LoginPage } from "../pages/login/LoginPage";
import { ProfileSetupModal } from "../components/profile/ProfileSetupModal";
import { WorkoutAddModal } from "../components/workout/WorkoutAddModal";
import { defaultSelectedDate, flexibleScheduleMode } from "./config";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { MenuProvider } from "../context/MenuContext";
import { NotificationProvider } from "../context/NotificationContext";
import { TimerProvider } from "../context/TimerContext";
import { importedProgram } from "../data/programData";
import { deleteUserWorkout, loadCustomWorkouts, loadPrograms, loadProgramsForUser, loadUserWorkouts, saveUserActiveProgram, saveUserWorkout, syncPendingUserWorkouts } from "../db";
import { activateWaitingServiceWorker, registerAppServiceWorker } from "../services/pwa";
import { appRouteUrl, applyActiveProgramDates, buildWorkoutDatesForProgram, calendarSections, flexibleProgramWorkoutGroups, groupByDate, groupWorkouts, isDevUser, loadWorkoutDraft, loadWorkoutScheduleOverrides, moveWorkoutDraft, readAppRoute, saveWorkoutDraft, saveWorkoutScheduleOverrides, shiftDate, workoutDateMapKey, workoutGroupKey, workoutLogKey } from "../utils/appHelpers";

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const initialRoute = useMemo(() => readAppRoute(), []);
  const {
    checking,
    handleLogout: logoutUser,
    handleProfileSaved,
    handleProfileSetupComplete,
    hydrateUser,
    isTrainer,
    showProfileSetup,
    syncUserMaxes,
    user,
  } = useAuth();
  const [workouts, setWorkouts] = useState({});
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [athleteProgressWorkouts, setAthleteProgressWorkouts] = useState({});
  const [customWorkouts, setCustomWorkouts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [programWorkouts, setProgramWorkouts] = useState([]);
  const [workoutScheduleOverrides, setWorkoutScheduleOverrides] = useState({});
  const [selectedDate, setSelectedDate] = useState(initialRoute.selectedDate);
  const [selectedWorkoutKey, setSelectedWorkoutKey] = useState(initialRoute.selectedWorkoutKey);
  const [view, setView] = useState(initialRoute.view);
  const [daySwipeStart, setDaySwipeStart] = useState(null);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState(null);
  const [updateRegistration, setUpdateRegistration] = useState(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [isMobileViewport, setIsMobileViewport] = useState(() => (
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 760px)").matches
  ));
  const [visibleCalendarMonths, setVisibleCalendarMonths] = useState(3);
  const [quickAddWorkoutDate, setQuickAddWorkoutDate] = useState("");
  const routeWritePending = useRef(false);
  const { handleWorkoutSaveStatus, notificationMessage, saveMessage } = useToastNotifications(user);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const syncMobileViewport = () => setIsMobileViewport(mobileQuery.matches);
    syncMobileViewport();
    mobileQuery.addEventListener("change", syncMobileViewport);
    return () => mobileQuery.removeEventListener("change", syncMobileViewport);
  }, []);

  function clearAppData() {
    setWorkouts({});
    setIsLoadingWorkouts(false);
    setAthleteProgressWorkouts({});
    setCustomWorkouts([]);
    setPrograms([]);
    setProgramWorkouts([]);
    setWorkoutScheduleOverrides({});
  }

  function getScheduledWorkouts(userWorkouts) {
    return Object.entries(userWorkouts)
      .filter(([, workout]) => (
        workout?.scheduledPlaceholder
        && workout?.date
        && workout.status !== "deleted"
        && workout.status !== "moved"
      ))
      .flatMap(([id, workout]) => {
        if (Array.isArray(workout.items) && workout.items.length) {
          return workout.items.map((item, index) => ({
            ...item,
            date: workout.date,
            id: item.id || `${id}:${index}`,
            scheduledPlaceholder: true,
            userWorkoutId: id,
          }));
        }
        return [{ ...workout, id: workout.id || id, userWorkoutId: id }];
      });
  }

  async function loadAuthenticatedUserData(currentUser, userIsTrainer) {
    const [nextLogs, nextPrograms] = await Promise.all([
      loadUserWorkouts(currentUser.uid),
      userIsTrainer || isDevUser(currentUser.uid) ? loadPrograms() : loadProgramsForUser(currentUser),
    ]);
    const programWorkoutState = await loadProgramWorkoutState(currentUser, nextPrograms, userIsTrainer);
    return {
      workouts: nextLogs,
      athleteProgressWorkouts: userIsTrainer ? await loadUserWorkouts("dev-athlete") : nextLogs,
      customWorkouts: getScheduledWorkouts(nextLogs),
      programs: programWorkoutState.programs,
      programWorkouts: programWorkoutState.workouts,
      workoutScheduleOverrides: loadWorkoutScheduleOverrides(currentUser.uid),
    };
  }

  async function loadProgramWorkoutState(currentUser, nextPrograms, userIsTrainer = isTrainer) {
    const programWorkoutLists = await Promise.all(nextPrograms.map(async (program) => (
      (await loadCustomWorkouts(program.id)).map((workout) => ({
        ...workout,
        programId: workout.programId || program.id,
      }))
    )));
    const rawWorkouts = programWorkoutLists.flat();
    if (userIsTrainer || isDevUser(currentUser?.uid)) {
      return { programs: nextPrograms, workouts: rawWorkouts };
    }

    const programsWithSchedules = await Promise.all(nextPrograms.map(async (program) => {
      const activeProgram = program.activeProgram;
      if (!activeProgram?.scheduled) return program;
      const programItems = rawWorkouts.filter((workout) => !workout.scheduledPlaceholder && (workout.programId || "default") === program.id);
      const expectedDates = buildWorkoutDatesForProgram(programItems, activeProgram.startDate || program.startDate);
      const staleDates = Object.entries(expectedDates).some(([key, date]) => activeProgram.workoutDates?.[key] !== date);
      if (!staleDates) return program;
      const nextActiveProgram = {
        ...activeProgram,
        workoutDates: {
          ...(activeProgram.workoutDates || {}),
          ...expectedDates,
        },
      };
      await saveUserActiveProgram(currentUser.uid, nextActiveProgram);
      return { ...program, activeProgram: nextActiveProgram };
    }));

    return {
      programs: programsWithSchedules,
      workouts: applyActiveProgramDates(rawWorkouts, programsWithSchedules),
    };
  }

  async function refreshCustomWorkouts() {
    const nextLogs = user?.uid ? await loadUserWorkouts(user.uid) : {};
    const nextPrograms = isTrainer || isDevUser(user?.uid) ? await loadPrograms() : user ? await loadProgramsForUser(user) : [];
    const programWorkoutState = await loadProgramWorkoutState(user, nextPrograms);
    setWorkouts(nextLogs);
    setAthleteProgressWorkouts(isTrainer ? await loadUserWorkouts("dev-athlete") : nextLogs);
    setCustomWorkouts(getScheduledWorkouts(nextLogs));
    setPrograms(programWorkoutState.programs);
    setProgramWorkouts(programWorkoutState.workouts);
  }

  async function handleProgramWorkoutCreated(workoutDate) {
    await refreshCustomWorkouts();
    if (workoutDate) {
      openWorkoutList(workoutDate);
    }
  }

  useEffect(() => {
    if (checking) return undefined;
    if (!user) {
      clearAppData();
      return undefined;
    }
    let active = true;
    setIsLoadingWorkouts(true);
    loadAuthenticatedUserData(user, isTrainer).then((nextData) => {
      if (!active) return;
      setWorkouts(nextData.workouts);
      setAthleteProgressWorkouts(nextData.athleteProgressWorkouts);
      setCustomWorkouts(nextData.customWorkouts);
      setWorkoutScheduleOverrides(nextData.workoutScheduleOverrides);
      setPrograms(nextData.programs);
      setProgramWorkouts(nextData.programWorkouts);
      setIsLoadingWorkouts(false);
    }).catch((error) => {
      console.warn("Failed to load authenticated user data.", error);
      if (active) setIsLoadingWorkouts(false);
    });
    return () => {
      active = false;
    };
  }, [checking, isTrainer, user?.uid]);

  useEffect(() => {
    function applyBrowserRoute() {
      const nextRoute = readAppRoute();
      routeWritePending.current = true;
      setSelectedDate(nextRoute.selectedDate);
      setSelectedWorkoutKey(nextRoute.selectedWorkoutKey);
      setView(nextRoute.view);
    }

    window.addEventListener("popstate", applyBrowserRoute);
    return () => window.removeEventListener("popstate", applyBrowserRoute);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (routeWritePending.current) {
      routeWritePending.current = false;
      return;
    }
    const nextUrl = appRouteUrl({ view, selectedDate, selectedWorkoutKey });
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) {
      window.history.pushState({}, "", nextUrl);
    }
  }, [selectedDate, selectedWorkoutKey, view]);

  useEffect(() => {
    registerAppServiceWorker(setUpdateRegistration)
      .then(setServiceWorkerRegistration)
      .catch((error) => console.warn("Service worker registration failed.", error));
  }, []);

  useEffect(() => {
    async function updateOnlineStatus() {
      const nextIsOnline = navigator.onLine;
      setIsOnline(nextIsOnline);
      if (nextIsOnline && user?.uid) {
        await syncPendingUserWorkouts(user.uid);
      }
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, [user?.uid]);

  useEffect(() => {
    if (isMobileViewport && view === "program-builder") {
      setView("client");
    }
  }, [isMobileViewport, view]);

  useEffect(() => {
    if (!user?.uid || !isOnline) return;
    void syncPendingUserWorkouts(user.uid);
  }, [isOnline, user?.uid]);

  const hasDefaultProgramAccess = useMemo(() => programs.some((program) => program.id === "default"), [programs]);
  const activeProgramIds = useMemo(() => new Set(programs
    .filter((program) => program.activeProgram)
    .map((program) => program.id)), [programs]);
  const hasActiveDefaultProgram = activeProgramIds.has("default");
  const activeFlexibleProgramIds = useMemo(() => new Set(programs
    .filter((program) => program.activeProgram?.scheduled === false)
    .map((program) => program.id)), [programs]);
  const defaultProgram = useMemo(() => programs.find((program) => program.id === "default"), [programs]);
  const starterProgramWorkouts = useMemo(() => {
    if (!hasActiveDefaultProgram || activeFlexibleProgramIds.has("default")) return [];
    const sourceWorkouts = importedProgram.map((item) => (
      workoutScheduleOverrides[item.id] ? { ...item, date: workoutScheduleOverrides[item.id] } : item
    ));
    const activeProgram = defaultProgram?.activeProgram;
    if (!activeProgram?.scheduled) return sourceWorkouts;
    const workoutDates = {
      ...(activeProgram.workoutDates || {}),
      ...buildWorkoutDatesForProgram(sourceWorkouts, activeProgram.startDate || defaultProgram.startDate),
    };
    return applyActiveProgramDates(sourceWorkouts, [{
      ...defaultProgram,
      activeProgram: {
        ...activeProgram,
        workoutDates,
      },
    }]);
  }, [activeFlexibleProgramIds, defaultProgram, hasActiveDefaultProgram, workoutScheduleOverrides]);
  const allProgramSourceWorkouts = useMemo(() => [
    ...(hasDefaultProgramAccess ? importedProgram : []),
    ...programWorkouts,
  ], [hasDefaultProgramAccess, programWorkouts]);
  const scheduledWorkouts = useMemo(() => [
    ...starterProgramWorkouts,
    ...customWorkouts,
    ...programWorkouts.filter((item) => {
      const programId = item.programId || "default";
      return activeProgramIds.has(programId) && !activeFlexibleProgramIds.has(programId);
    }),
  ].filter((item) => {
    const status = workouts[workoutLogKey(item.date, workoutGroupKey(item))]?.status;
    return status !== "deleted" && status !== "moved";
  }), [activeFlexibleProgramIds, activeProgramIds, customWorkouts, workouts, programWorkouts, starterProgramWorkouts]);
  const flexibleWorkoutGroupsForSelectedDate = useMemo(() => (
    flexibleProgramWorkoutGroups(selectedDate, programs, allProgramSourceWorkouts, workouts)
  ), [allProgramSourceWorkouts, workouts, programs, selectedDate]);
  const workoutsByDate = useMemo(() => groupByDate(scheduledWorkouts), [scheduledWorkouts]);
  const programLedWorkoutDates = useMemo(() => (
    scheduledWorkouts
      .map((item) => item.date)
      .filter(Boolean)
      .sort()
  ), [scheduledWorkouts]);
  const calendarMonths = useMemo(() => calendarSections(programLedWorkoutDates, new Date(), visibleCalendarMonths), [programLedWorkoutDates, visibleCalendarMonths]);
  const dates = useMemo(() => calendarMonths.flatMap((section) => section.dates), [calendarMonths]);
  const selectedWorkoutGroups = useMemo(() => [
    ...groupWorkouts(workoutsByDate[selectedDate] || []),
    ...flexibleWorkoutGroupsForSelectedDate,
  ], [flexibleWorkoutGroupsForSelectedDate, selectedDate, workoutsByDate]);
  const selectedWorkout = selectedWorkoutKey === "blank"
    ? []
    : (selectedWorkoutGroups.find((group) => group.key === selectedWorkoutKey)?.items || selectedWorkoutGroups[0]?.items || [])
      .filter((item) => !item.scheduledPlaceholder || (item.workoutType && item.workoutType !== "strength"));
  const activeWorkoutKey = selectedWorkoutKey || selectedWorkoutGroups[0]?.key || "blank";
  const activeWorkoutGroup = selectedWorkoutKey === "blank"
    ? null
    : selectedWorkoutGroups.find((group) => group.key === activeWorkoutKey) || selectedWorkoutGroups[0] || null;
  const today = new Date().toISOString().slice(0, 10);
  const todayTarget = workoutsByDate[today] ? today : dates.find((date) => date >= today) || dates[0] || today;

  function openWorkoutList(date) {
    setSelectedDate(date);
    setSelectedWorkoutKey("");
    setView("workout-list");
  }

  function startDaySwipe(event) {
    if (view !== "workout-list" || event.pointerType === "mouse") return;
    if (event.target.closest(".top-nav, .bottom-nav, .modal-backdrop, .modal-panel")) return;
    setDaySwipeStart({ x: event.clientX, y: event.clientY });
  }

  function finishDaySwipe(event) {
    if (view !== "workout-list" || !daySwipeStart || event.pointerType === "mouse") return;
    const deltaX = event.clientX - daySwipeStart.x;
    const deltaY = event.clientY - daySwipeStart.y;
    setDaySwipeStart(null);
    if (Math.abs(deltaX) < 54 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    openWorkoutList(shiftDate(selectedDate, deltaX < 0 ? 1 : -1));
  }

  async function openWorkout(key, options = {}) {
    if (options.start && user?.uid) {
      const draft = loadWorkoutDraft(user.uid, selectedDate, key);
      saveWorkoutDraft(user.uid, selectedDate, key, { ...draft, started: true });
    }
    setSelectedWorkoutKey(key);
    setView("workout");
  }

  function openStoredWorkout(date, key) {
    setSelectedDate(date);
    setSelectedWorkoutKey(key);
    setView("workout");
  }

  function openTodayWorkoutModal() {
    setQuickAddWorkoutDate(today);
  }

  async function openBlankWorkout(workoutType = "strength", workoutDate = selectedDate) {
    const workoutTypeLabels = {
      strength: "Strength Workout",
      running: "Running",
      swimming: "Swimming",
      biking: "Biking",
      rowing: "Rowing",
      walking: "Walking",
      sport: "Sport",
    };
    const workoutTitle = workoutTypeLabels[workoutType] || "Workout";
    const scheduledWorkout = {
      id: `scheduled-${workoutDate}-${Date.now()}`,
      date: workoutDate,
      focus: workoutTitle,
      exercise: "",
      prescription: "",
      intensity: "",
      notes: "",
      programId: "default",
      workoutType,
      day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${workoutDate}T12:00:00`)),
      phase: workoutTitle,
      week: "Custom",
      scheduledPlaceholder: true,
      createdAt: new Date().toISOString(),
    };
    const nextWorkoutKey = workoutGroupKey(scheduledWorkout);
    const logKey = workoutLogKey(workoutDate, nextWorkoutKey);
    const isFutureWorkout = workoutDate > today;
    const nextWorkoutLog = {
      ...scheduledWorkout,
      status: "scheduled",
      completed: false,
    };
    setCustomWorkouts((current) => [...current.filter((item) => item.id !== scheduledWorkout.id), scheduledWorkout]);
    setWorkouts((current) => ({
      ...current,
      [logKey]: {
        ...(current[logKey] || {}),
        ...nextWorkoutLog,
      },
    }));
    if (!isFutureWorkout && user?.uid) {
      saveWorkoutDraft(user.uid, workoutDate, nextWorkoutKey, { started: true });
    }
    setSelectedDate(workoutDate);
    setSelectedWorkoutKey(nextWorkoutKey);
    setView("workout");
    await saveUserWorkout(user.uid, logKey, nextWorkoutLog);
    setSelectedWorkoutKey(nextWorkoutKey);
  }

  async function handleAppLogout() {
    await logoutUser();
    setView("client");
    setWorkouts({});
    setAthleteProgressWorkouts({});
    setCustomWorkouts([]);
    setPrograms([]);
    setProgramWorkouts([]);
    setWorkoutScheduleOverrides({});
  }

  async function moveSelectedWorkout(nextDate, workoutKey = activeWorkoutKey) {
    if (!user || !activeWorkoutGroup || !nextDate || nextDate === selectedDate) return;
    const workoutGroup = selectedWorkoutGroups.find((group) => group.key === workoutKey) || activeWorkoutGroup;
    const originalLogKey = workoutLogKey(selectedDate, workoutKey);
    const movedItems = workoutGroup.items.map((item) => ({
      ...item,
      date: nextDate,
      day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${nextDate}T12:00:00`)),
      scheduledPlaceholder: true,
    }));
    const movedIds = new Set(movedItems.map((item) => item.id));
    const nextWorkoutKey = workoutGroupKey(movedItems[0]);
    const movedLogKey = workoutLogKey(nextDate, nextWorkoutKey);
    const nextOverrides = { ...workoutScheduleOverrides };

    movedItems.forEach((item) => {
      if (String(item.id || "").startsWith("mock-")) {
        nextOverrides[item.id] = nextDate;
      }
    });

    setWorkoutScheduleOverrides(nextOverrides);
    saveWorkoutScheduleOverrides(user.uid, nextOverrides);

    const movedWorkout = {
      ...(workouts[originalLogKey] || {}),
      date: nextDate,
      status: "scheduled",
      completed: false,
      scheduledPlaceholder: true,
      movedFrom: {
        date: selectedDate,
        workoutKey,
      },
      items: movedItems,
      updatedAt: new Date().toISOString(),
    };
    const movedOriginalWorkout = {
      ...(workouts[originalLogKey] || {}),
      date: selectedDate,
      status: "moved",
      completed: false,
      movedTo: {
        date: nextDate,
        workoutKey: nextWorkoutKey,
      },
      updatedAt: new Date().toISOString(),
    };

    setCustomWorkouts((current) => [
      ...current.filter((item) => !movedIds.has(item.id)),
      ...movedItems,
    ]);
    setWorkouts((current) => ({
      ...current,
      [originalLogKey]: movedOriginalWorkout,
      [movedLogKey]: movedWorkout,
    }));
    await Promise.all([
      saveUserWorkout(user.uid, originalLogKey, movedOriginalWorkout),
      saveUserWorkout(user.uid, movedLogKey, movedWorkout),
    ]);

    moveWorkoutDraft(user.uid, selectedDate, workoutKey, nextDate, nextWorkoutKey);
    setSelectedDate(nextDate);
    setSelectedWorkoutKey(nextWorkoutKey);
    setView("workout");
    handleWorkoutSaveStatus({ synced: true });
  }

  async function deleteScheduledWorkout(workoutKey) {
    if (!user || !workoutKey) return;
    const workoutGroup = selectedWorkoutGroups.find((group) => group.key === workoutKey);
    if (!workoutGroup) return;
    const logKey = workoutLogKey(selectedDate, workoutKey);
    const itemIds = new Set(workoutGroup.items.map((item) => item.id));
    const isUserScheduledWorkout = workoutGroup.items.some((item) => item.scheduledPlaceholder);

    setCustomWorkouts((current) => current.filter((item) => !itemIds.has(item.id)));

    if (isUserScheduledWorkout) {
      setWorkouts((current) => {
        const next = { ...current };
        delete next[logKey];
        return next;
      });
      await deleteUserWorkout(user.uid, logKey);
    } else {
      const deletedWorkout = {
        ...(workouts[logKey] || {}),
        date: selectedDate,
        status: "deleted",
        completed: false,
        deletedAt: new Date().toISOString(),
      };
      setWorkouts((current) => ({ ...current, [logKey]: deletedWorkout }));
      await saveUserWorkout(user.uid, logKey, deletedWorkout);
    }

    if (selectedWorkoutKey === workoutKey) {
      setSelectedWorkoutKey("");
    }
    handleWorkoutSaveStatus({ synced: true });
  }

  function applyAppUpdate() {
    activateWaitingServiceWorker(updateRegistration);
  }

  if (checking) return <BootPage />;
  if (!user) return <LoginPage onAuthed={hydrateUser} />;

  return (
      <NotificationProvider user={user}>
        <MenuProvider isMobileViewport={isMobileViewport} isTrainer={isTrainer} onOpenView={setView}>
          <TimerProvider>
          <AppShell
            view={view}
            onStartDaySwipe={startDaySwipe}
            onFinishDaySwipe={finishDaySwipe}
            onStopDaySwipe={() => setDaySwipeStart(null)}
            onAddWorkoutClick={openTodayWorkoutModal}
            onBrandClick={() => setView("client")}
            onOpenView={setView}
            onProfileClick={() => setView("profile")}
            isOnline={isOnline}
            saveMessage={saveMessage}
            notificationMessage={notificationMessage}
          >
            {showProfileSetup && (
              <ProfileSetupModal user={user} onComplete={handleProfileSetupComplete} />
            )}

            {quickAddWorkoutDate && (
              <WorkoutAddModal
                date={quickAddWorkoutDate}
                onAddWorkout={(workoutType) => openBlankWorkout(workoutType, quickAddWorkoutDate)}
                onClose={() => setQuickAddWorkoutDate("")}
              />
            )}

            <AppRoutes
              activeWorkoutKey={activeWorkoutKey}
              allProgramSourceWorkouts={allProgramSourceWorkouts}
              applyAppUpdate={applyAppUpdate}
              athleteProgressWorkouts={athleteProgressWorkouts}
              calendarMonths={calendarMonths}
              deleteScheduledWorkout={deleteScheduledWorkout}
              handleProfileSaved={handleProfileSaved}
              handleProgramWorkoutCreated={handleProgramWorkoutCreated}
              handleWorkoutSaveStatus={handleWorkoutSaveStatus}
              isLoadingWorkouts={isLoadingWorkouts}
              isTrainer={isTrainer}
              workouts={workouts}
              moveSelectedWorkout={moveSelectedWorkout}
              openBlankWorkout={openBlankWorkout}
              openStoredWorkout={openStoredWorkout}
              openWorkout={openWorkout}
              openWorkoutList={openWorkoutList}
              programs={programs}
              refreshCustomWorkouts={refreshCustomWorkouts}
              scheduledWorkouts={scheduledWorkouts}
              selectedDate={selectedDate}
              selectedWorkout={selectedWorkout}
              selectedWorkoutGroups={selectedWorkoutGroups}
              serviceWorkerRegistration={serviceWorkerRegistration}
              setWorkouts={setWorkouts}
              setSelectedDate={setSelectedDate}
              setView={setView}
              setVisibleCalendarMonths={setVisibleCalendarMonths}
              syncUserMaxes={syncUserMaxes}
              todayTarget={todayTarget}
              updateRegistration={updateRegistration}
              user={user}
              view={view}
              workoutsByDate={workoutsByDate}
              handleLogout={handleAppLogout}
            />
          </AppShell>
          </TimerProvider>
        </MenuProvider>
      </NotificationProvider>
  );
}
