import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppRoutes } from "./AppRoutes";
import { AppShell } from "../components/shell/AppShell";
import { useToastNotifications } from "../components/notifications/useToastNotifications";
import { BootPage } from "../pages/boot/BootPage";
import { LoginPage } from "../pages/login/LoginPage";
import { ProfileSetupModal } from "../components/profile/ProfileSetupModal";
import { defaultSelectedDate, flexibleScheduleMode } from "./config";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { MenuProvider } from "../context/MenuContext";
import { TimerProvider } from "../context/TimerContext";
import { importedProgram } from "../data/programData";
import { loadCustomWorkouts, loadPrograms, loadProgramsForUser, loadUserWorkouts, saveCustomWorkout, saveUserActiveProgram } from "../services/firebase";
import { activateWaitingServiceWorker, registerAppServiceWorker } from "../services/pwa";
import { appRouteUrl, applyActiveProgramDates, buildWorkoutDatesForProgram, calendarSections, flexibleProgramWorkoutGroups, groupByDate, groupWorkouts, isDevUser, loadWorkoutScheduleOverrides, moveWorkoutDraft, readAppRoute, saveWorkoutScheduleOverrides, shiftDate, workoutDateMapKey } from "../utils/appHelpers";

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
  const [logs, setLogs] = useState({});
  const [athleteProgressLogs, setAthleteProgressLogs] = useState({});
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
    setLogs({});
    setAthleteProgressLogs({});
    setCustomWorkouts([]);
    setPrograms([]);
    setProgramWorkouts([]);
    setWorkoutScheduleOverrides({});
  }

  async function loadAuthenticatedUserData(currentUser, userIsTrainer) {
    const [nextLogs, nextPrograms] = await Promise.all([
      loadUserWorkouts(currentUser.uid),
      userIsTrainer || isDevUser(currentUser.uid) ? loadPrograms() : loadProgramsForUser(currentUser),
    ]);
    const programWorkoutState = await loadProgramWorkoutState(currentUser, nextPrograms, userIsTrainer);
    return {
      logs: nextLogs,
      athleteProgressLogs: userIsTrainer ? await loadUserWorkouts("dev-athlete") : nextLogs,
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
      const programItems = rawWorkouts.filter((workout) => (workout.programId || "default") === program.id);
      const expectedDates = buildWorkoutDatesForProgram(programItems, activeProgram.startDate || program.startDate);
      const missingDates = Object.keys(expectedDates).some((key) => !activeProgram.workoutDates?.[key]);
      if (!missingDates) return program;
      const nextActiveProgram = {
        ...activeProgram,
        workoutDates: {
          ...expectedDates,
          ...(activeProgram.workoutDates || {}),
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
    const nextPrograms = isTrainer || isDevUser(user?.uid) ? await loadPrograms() : user ? await loadProgramsForUser(user) : [];
    const programWorkoutState = await loadProgramWorkoutState(user, nextPrograms);
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
    loadAuthenticatedUserData(user, isTrainer).then((nextData) => {
      if (!active) return;
      setLogs(nextData.logs);
      setAthleteProgressLogs(nextData.athleteProgressLogs);
      setCustomWorkouts([]);
      setWorkoutScheduleOverrides(nextData.workoutScheduleOverrides);
      setPrograms(nextData.programs);
      setProgramWorkouts(nextData.programWorkouts);
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
    function updateOnlineStatus() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (isMobileViewport && view === "programs") {
      setView("client");
    }
  }, [isMobileViewport, view]);

  const hasDefaultProgramAccess = useMemo(() => programs.some((program) => program.id === "default"), [programs]);
  const activeProgramIds = useMemo(() => new Set(programs
    .filter((program) => program.activeProgram)
    .map((program) => program.id)), [programs]);
  const hasActiveDefaultProgram = activeProgramIds.has("default");
  const activeFlexibleProgramIds = useMemo(() => new Set(programs
    .filter((program) => program.activeProgram && program.scheduleMode === flexibleScheduleMode)
    .map((program) => program.id)), [programs]);
  const starterProgramWorkouts = useMemo(() => (
    !hasActiveDefaultProgram || activeFlexibleProgramIds.has("default")
      ? []
      : importedProgram.map((item) => (
        workoutScheduleOverrides[item.id] ? { ...item, date: workoutScheduleOverrides[item.id] } : item
      ))
  ), [activeFlexibleProgramIds, hasActiveDefaultProgram, workoutScheduleOverrides]);
  const savedWorkouts = useMemo(() => [...customWorkouts, ...programWorkouts], [customWorkouts, programWorkouts]);
  const allProgramSourceWorkouts = useMemo(() => [
    ...(hasDefaultProgramAccess ? importedProgram : []),
    ...savedWorkouts,
  ], [hasDefaultProgramAccess, savedWorkouts]);
  const scheduledWorkouts = useMemo(() => [
    ...starterProgramWorkouts,
    ...customWorkouts,
    ...programWorkouts.filter((item) => {
      const programId = item.programId || "default";
      return activeProgramIds.has(programId) && !activeFlexibleProgramIds.has(programId);
    }),
  ], [activeFlexibleProgramIds, activeProgramIds, customWorkouts, programWorkouts, starterProgramWorkouts]);
  const flexibleWorkoutGroupsForSelectedDate = useMemo(() => (
    flexibleProgramWorkoutGroups(selectedDate, programs, allProgramSourceWorkouts, logs)
  ), [allProgramSourceWorkouts, logs, programs, selectedDate]);
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
      .filter((item) => !item.scheduledPlaceholder);
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
    if (event.target.closest(".top-nav, .modal-backdrop, .modal-panel")) return;
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

  function openWorkout(key) {
    setSelectedWorkoutKey(key);
    setView("workout");
  }

  function openStoredWorkout(date, key) {
    setSelectedDate(date);
    setSelectedWorkoutKey(key);
    setView("workout");
  }

  async function openBlankWorkout() {
    const scheduledWorkout = {
      id: `scheduled-${selectedDate}-${Date.now()}`,
      date: selectedDate,
      focus: "Scheduled Workout",
      exercise: "",
      prescription: "",
      intensity: "",
      notes: "",
      programId: "default",
      day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${selectedDate}T12:00:00`)),
      phase: "Scheduled Workout",
      week: "Custom",
      scheduledPlaceholder: true,
      createdAt: new Date().toISOString(),
    };
    const nextWorkoutKey = workoutGroupKey(scheduledWorkout);
    setCustomWorkouts((current) => [...current.filter((item) => item.id !== scheduledWorkout.id), scheduledWorkout]);
    setSelectedWorkoutKey(nextWorkoutKey);
    setView("workout");
    await saveCustomWorkout("default", scheduledWorkout);
    await refreshCustomWorkouts();
    setSelectedWorkoutKey(nextWorkoutKey);
  }

  async function handleAppLogout() {
    await logoutUser();
    setView("client");
    setLogs({});
    setAthleteProgressLogs({});
    setCustomWorkouts([]);
    setPrograms([]);
    setProgramWorkouts([]);
    setWorkoutScheduleOverrides({});
  }

  async function moveSelectedWorkout(nextDate) {
    if (!user || !activeWorkoutGroup || !nextDate || nextDate === selectedDate) return;
    const movedItems = activeWorkoutGroup.items.map((item) => ({
      ...item,
      date: nextDate,
      day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${nextDate}T12:00:00`)),
    }));
    const movedIds = new Set(movedItems.map((item) => item.id));
    const nextWorkoutKey = workoutGroupKey(movedItems[0]);
    const nextOverrides = { ...workoutScheduleOverrides };

    movedItems.forEach((item) => {
      if (String(item.id || "").startsWith("mock-")) {
        nextOverrides[item.id] = nextDate;
      }
    });

    setWorkoutScheduleOverrides(nextOverrides);
    saveWorkoutScheduleOverrides(user.uid, nextOverrides);

    if (customWorkouts.some((item) => movedIds.has(item.id))) {
      setCustomWorkouts((current) => current.map((item) => (
        movedIds.has(item.id) ? movedItems.find((movedItem) => movedItem.id === item.id) || item : item
      )));
    }

    if (programWorkouts.some((item) => movedIds.has(item.id))) {
      setProgramWorkouts((current) => current.map((item) => (
        movedIds.has(item.id) ? movedItems.find((movedItem) => movedItem.id === item.id) || item : item
      )));
    }

    await Promise.all(movedItems
      .filter((item) => !String(item.id || "").startsWith("mock-"))
      .map((item) => saveCustomWorkout(item.programId || "default", item)));

    moveWorkoutDraft(user.uid, selectedDate, activeWorkoutKey, nextDate, nextWorkoutKey);
    setSelectedDate(nextDate);
    setSelectedWorkoutKey(nextWorkoutKey);
    setView("workout");
    handleWorkoutSaveStatus({ synced: false, local: true });
  }

  function applyAppUpdate() {
    activateWaitingServiceWorker(updateRegistration);
  }

  if (checking) return <BootPage />;
  if (!user) return <LoginPage onAuthed={hydrateUser} />;

  return (
      <MenuProvider isMobileViewport={isMobileViewport} isTrainer={isTrainer} onOpenView={setView}>
        <TimerProvider>
          <AppShell
            view={view}
            onStartDaySwipe={startDaySwipe}
            onFinishDaySwipe={finishDaySwipe}
            onStopDaySwipe={() => setDaySwipeStart(null)}
            onBrandClick={() => setView("client")}
            onProfileClick={() => setView("profile")}
            isOnline={isOnline}
            saveMessage={saveMessage}
            notificationMessage={notificationMessage}
          >
            {showProfileSetup && (
              <ProfileSetupModal user={user} onComplete={handleProfileSetupComplete} />
            )}

            <AppRoutes
              activeWorkoutKey={activeWorkoutKey}
              allProgramSourceWorkouts={allProgramSourceWorkouts}
              applyAppUpdate={applyAppUpdate}
              athleteProgressLogs={athleteProgressLogs}
              calendarMonths={calendarMonths}
              handleProfileSaved={handleProfileSaved}
              handleProgramWorkoutCreated={handleProgramWorkoutCreated}
              handleWorkoutSaveStatus={handleWorkoutSaveStatus}
              isTrainer={isTrainer}
              logs={logs}
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
              setLogs={setLogs}
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
  );
}
