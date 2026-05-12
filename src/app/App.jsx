import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppRoutes } from "./AppRoutes";
import { AppShell } from "../components/shell/AppShell";
import { BootPage } from "../pages/boot/BootPage";
import { LoginPage } from "../pages/login/LoginPage";
import { ProfileSetupModal } from "../pages/profile/ProfilePage";
import { defaultSelectedDate, flexibleScheduleMode } from "./config";
import { menuButtonItemMap } from "./menuRoutes";
import { ensureUserDocument, isTrainerUser, listenForForegroundMessages, loadCustomWorkouts, loadPrograms, loadProgramsForUser, loadUserMaxes as loadCloudUserMaxes, loadUserProfile, loadUserWorkouts, logout, observeAuth, saveCustomWorkout, saveUserActiveProgram, saveUserMaxes as saveCloudUserMaxes } from "../services/firebase";
import { activateWaitingServiceWorker, registerAppServiceWorker } from "../services/pwa";
import { appRouteUrl, applyActiveProgramDates, buildWorkoutDatesForProgram, calendarSections, flexibleProgramWorkoutGroups, formatTimer, groupByDate, groupWorkouts, isDevUser, loadMenuButtonPreferences, loadWorkoutScheduleOverrides, mergeUserProfile, moveWorkoutDraft, readAppRoute, saveMenuButtonPreferences, saveUserMaxes, saveWorkoutScheduleOverrides, shiftDate, workoutDateMapKey } from "../utils/appHelpers";

async function syncUserMaxes(userId, maxes) {
  saveUserMaxes(userId, maxes);
  return saveCloudUserMaxes(userId, maxes);
}

export default function App() {
  const initialRoute = useMemo(() => readAppRoute(), []);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isTrainer, setIsTrainer] = useState(false);
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
  const [notificationMessage, setNotificationMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [isMobileViewport, setIsMobileViewport] = useState(() => (
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 760px)").matches
  ));
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [menuEditMode, setMenuEditMode] = useState(false);
  const [menuPressHandled, setMenuPressHandled] = useState(false);
  const [menuButtonPreferences, setMenuButtonPreferences] = useState(loadMenuButtonPreferences);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [visibleCalendarMonths, setVisibleCalendarMonths] = useState(3);
  const [timerMode, setTimerMode] = useState("countup");
  const [countdownSeconds, setCountdownSeconds] = useState(180);
  const [intervalWorkSeconds, setIntervalWorkSeconds] = useState(60);
  const [intervalRestSeconds, setIntervalRestSeconds] = useState(30);
  const [intervalPhase, setIntervalPhase] = useState("work");
  const [intervalRounds, setIntervalRounds] = useState(5);
  const [intervalCurrentRound, setIntervalCurrentRound] = useState(1);
  const [intervalEndless, setIntervalEndless] = useState(true);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [timerPressHandled, setTimerPressHandled] = useState(false);
  const [lastTimerTap, setLastTimerTap] = useState(0);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [timerBankedSeconds, setTimerBankedSeconds] = useState(0);
  const [timerNow, setTimerNow] = useState(Date.now());
  const routeWritePending = useRef(false);
  const menuLongPressTimer = useRef(null);
  const timerRunning = Boolean(timerStartedAt);
  const timerElapsedSeconds = timerBankedSeconds + (timerRunning ? Math.floor((timerNow - timerStartedAt) / 1000) : 0);
  const activeIntervalSeconds = intervalPhase === "work" ? intervalWorkSeconds : intervalRestSeconds;
  const timerSeconds = timerMode === "countup" ? timerElapsedSeconds : Math.max(0, (timerMode === "countdown" ? countdownSeconds : activeIntervalSeconds) - timerElapsedSeconds);
  const timerLabel = timerMode === "interval" ? `${intervalPhase === "work" ? "W" : "R"}${intervalEndless ? "" : intervalCurrentRound} ${formatTimer(timerSeconds)}` : formatTimer(timerSeconds);
  const countdownMinutes = Math.floor(countdownSeconds / 60);
  const countdownRemainderSeconds = countdownSeconds % 60;

  useEffect(() => {
    if (!showNavMenu || typeof document === "undefined" || typeof window === "undefined") return undefined;

    const scrollY = window.scrollY;
    const body = document.body;
    const previousStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = previousStyles.overflow;
      body.style.position = previousStyles.position;
      body.style.top = previousStyles.top;
      body.style.width = previousStyles.width;
      window.scrollTo(0, scrollY);
    };
  }, [showNavMenu]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const syncMobileViewport = () => setIsMobileViewport(mobileQuery.matches);
    syncMobileViewport();
    mobileQuery.addEventListener("change", syncMobileViewport);
    return () => mobileQuery.removeEventListener("change", syncMobileViewport);
  }, []);

  async function hydrateUser(nextUser) {
    if (!nextUser) {
      setUser(null);
      setShowProfileSetup(false);
      setLogs({});
      setAthleteProgressLogs({});
      setIsTrainer(false);
      setCustomWorkouts([]);
      setPrograms([]);
      setProgramWorkouts([]);
      setWorkoutScheduleOverrides({});
      return;
    }

    const [profile, cloudMaxes, rootUser] = await Promise.all([
      loadUserProfile(nextUser.uid),
      loadCloudUserMaxes(nextUser.uid),
      ensureUserDocument(nextUser),
    ]);
    saveUserMaxes(nextUser.uid, cloudMaxes);
    const profiledUser = mergeUserProfile(nextUser, { ...rootUser, ...profile });
    setUser(profiledUser);
    setShowProfileSetup(profile.profileSetupCompleted !== true);

    const [nextLogs, nextTrainer, nextCustomWorkouts] = await Promise.all([
      loadUserWorkouts(nextUser.uid),
      isTrainerUser(nextUser),
      loadCustomWorkouts("default"),
    ]);
    const nextPrograms = nextTrainer || isDevUser(nextUser.uid) ? await loadPrograms() : await loadProgramsForUser(profiledUser);

    setLogs(nextLogs);
    setIsTrainer(nextTrainer);
    setAthleteProgressLogs(nextTrainer ? await loadUserWorkouts("dev-athlete") : nextLogs);
    setCustomWorkouts(nextCustomWorkouts);
    setWorkoutScheduleOverrides(loadWorkoutScheduleOverrides(nextUser.uid));
    const programWorkoutState = await loadProgramWorkoutState(nextUser, nextPrograms, nextTrainer);
    setPrograms(programWorkoutState.programs);
    setProgramWorkouts(programWorkoutState.workouts);
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
    const nextDefaultWorkouts = await loadCustomWorkouts("default");
    const nextPrograms = isTrainer || isDevUser(user?.uid) ? await loadPrograms() : user ? await loadProgramsForUser(user) : [];
    const programWorkoutState = await loadProgramWorkoutState(user, nextPrograms);
    setCustomWorkouts(nextDefaultWorkouts);
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
    return observeAuth((nextUser) => {
      setUser(mergeUserProfile(nextUser));
      setChecking(false);
      hydrateUser(nextUser);
    });
  }, []);

  useEffect(() => {
    function applyBrowserRoute() {
      const nextRoute = readAppRoute();
      routeWritePending.current = true;
      setSelectedDate(nextRoute.selectedDate);
      setSelectedWorkoutKey(nextRoute.selectedWorkoutKey);
      setView(nextRoute.view);
      setShowNavMenu(false);
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
    saveMenuButtonPreferences(menuButtonPreferences);
  }, [menuButtonPreferences]);

  useEffect(() => () => {
    if (menuLongPressTimer.current) window.clearTimeout(menuLongPressTimer.current);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let unsubscribe = () => {};
    let active = true;

    listenForForegroundMessages((payload = {}) => {
      const notification = payload?.notification || {};
      const data = payload?.data || {};
      const title = notification.title || data.title || "Primitive Programming";
      const body = notification.body || data.body || "New training update received.";
      setNotificationMessage(`${title}: ${body}`);
      window.setTimeout(() => setNotificationMessage(""), 5000);
    }).then((nextUnsubscribe) => {
      if (active) unsubscribe = nextUnsubscribe;
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const intervalId = window.setInterval(() => setTimerNow(Date.now()), 500);
    return () => window.clearInterval(intervalId);
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning || timerMode === "countup") return;
    const targetSeconds = timerMode === "countdown" ? countdownSeconds : activeIntervalSeconds;
    if (timerElapsedSeconds < targetSeconds) return;

    if (timerMode === "interval") {
      if (intervalPhase === "work") {
        setIntervalPhase("rest");
      } else {
        const nextRound = intervalCurrentRound + 1;
        if (!intervalEndless && nextRound > intervalRounds) {
          setIntervalPhase("work");
          setIntervalCurrentRound(1);
        } else {
          setIntervalPhase("work");
          setIntervalCurrentRound(nextRound);
        }
      }
    }
    setTimerStartedAt(null);
    setTimerBankedSeconds(0);
  }, [activeIntervalSeconds, countdownSeconds, intervalCurrentRound, intervalEndless, intervalPhase, intervalRounds, timerElapsedSeconds, timerMode, timerRunning]);

  useEffect(() => {
    if (isMobileViewport && view === "programs") {
      setView("client");
    }
  }, [isMobileViewport, view]);

  const hasDefaultProgramAccess = useMemo(() => programs.some((program) => program.id === "default"), [programs]);
  const activeFlexibleProgramIds = useMemo(() => new Set(programs
    .filter((program) => program.status === "active" && program.scheduleMode === flexibleScheduleMode)
    .map((program) => program.id)), [programs]);
  const starterProgramWorkouts = useMemo(() => (
    !hasDefaultProgramAccess || activeFlexibleProgramIds.has("default")
      ? []
      : importedProgram.map((item) => (
        workoutScheduleOverrides[item.id] ? { ...item, date: workoutScheduleOverrides[item.id] } : item
      ))
  ), [activeFlexibleProgramIds, hasDefaultProgramAccess, workoutScheduleOverrides]);
  const savedWorkouts = useMemo(() => [...customWorkouts, ...programWorkouts], [customWorkouts, programWorkouts]);
  const allProgramSourceWorkouts = useMemo(() => [
    ...(hasDefaultProgramAccess ? importedProgram : []),
    ...savedWorkouts,
  ], [hasDefaultProgramAccess, savedWorkouts]);
  const scheduledWorkouts = useMemo(() => [
    ...starterProgramWorkouts,
    ...savedWorkouts.filter((item) => !activeFlexibleProgramIds.has(item.programId || "default")),
  ], [activeFlexibleProgramIds, savedWorkouts, starterProgramWorkouts]);
  const flexibleWorkoutGroupsForSelectedDate = useMemo(() => (
    flexibleProgramWorkoutGroups(selectedDate, programs, allProgramSourceWorkouts, logs)
  ), [allProgramSourceWorkouts, logs, programs, selectedDate]);
  const workoutsByDate = useMemo(() => groupByDate(scheduledWorkouts), [scheduledWorkouts]);
  const programLedWorkoutDates = useMemo(() => (
    [...starterProgramWorkouts, ...programWorkouts]
      .map((item) => item.date)
      .filter(Boolean)
      .sort()
  ), [programWorkouts, starterProgramWorkouts]);
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
  const orderedMenuButtons = useMemo(() => {
    const normalized = normalizeMenuButtonPreferences(menuButtonPreferences);
    const hiddenIds = new Set(normalized.hidden);
    const applicableItems = normalized.order
      .map((id) => menuButtonItemMap[id])
      .filter(Boolean)
      .filter((item) => {
        if (item.trainerOnly && !isTrainer) return false;
        if (item.hideForTrainer && isTrainer) return false;
        if (item.hideOnMobile && isMobileViewport) return false;
        return true;
      });
    const visibleItems = applicableItems.filter((item) => !hiddenIds.has(item.id));
    if (!menuEditMode) return visibleItems.length ? visibleItems : [menuButtonItemMap.settings];
    return applicableItems;
  }, [isMobileViewport, isTrainer, menuButtonPreferences, menuEditMode]);
  const hiddenMenuButtonIds = useMemo(() => new Set(normalizeMenuButtonPreferences(menuButtonPreferences).hidden), [menuButtonPreferences]);

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

  function handleProfileSaved(profile) {
    setUser((currentUser) => ({ ...currentUser, ...profile }));
  }

  function handleProfileSetupComplete(profile) {
    setUser((currentUser) => ({ ...currentUser, ...profile }));
    setShowProfileSetup(false);
  }

  async function handleLogout() {
    await logout();
    setView("client");
    setUser(null);
    setShowProfileSetup(false);
    setLogs({});
    setAthleteProgressLogs({});
    setIsTrainer(false);
    setCustomWorkouts([]);
    setPrograms([]);
    setProgramWorkouts([]);
    setWorkoutScheduleOverrides({});
    setChecking(false);
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

  function resetTimer() {
    setTimerStartedAt(null);
    setTimerBankedSeconds(0);
    setTimerNow(Date.now());
    if (timerMode === "interval") {
      setIntervalPhase("work");
      setIntervalCurrentRound(1);
    }
  }

  function toggleTimer() {
    if (timerRunning) {
      setTimerBankedSeconds(timerElapsedSeconds);
      setTimerStartedAt(null);
      return;
    }
    setTimerStartedAt(Date.now());
    setTimerNow(Date.now());
  }

  function startTimerPress() {
    setTimerPressHandled(false);
    const timeoutId = window.setTimeout(() => {
      setTimerPressHandled(true);
      setShowTimerSettings(true);
    }, 550);
    setLongPressTimer(timeoutId);
  }

  function endTimerPress() {
    if (longPressTimer) window.clearTimeout(longPressTimer);
    setLongPressTimer(null);
  }

  function handleTimerClick() {
    if (timerPressHandled) {
      setTimerPressHandled(false);
      return;
    }
    const now = Date.now();
    if (now - lastTimerTap < 320) {
      setLastTimerTap(0);
      resetTimer();
      return;
    }
    setLastTimerTap(now);
    toggleTimer();
  }

  function changeTimerMode(mode) {
    setTimerMode(mode);
    setTimerStartedAt(null);
    setTimerBankedSeconds(0);
    setIntervalPhase("work");
    setIntervalCurrentRound(1);
  }

  function updateCountdownPart(part, value) {
    const numericValue = Math.max(0, Number(value) || 0);
    const nextMinutes = part === "minutes" ? numericValue : countdownMinutes;
    const nextSeconds = part === "seconds" ? Math.min(59, numericValue) : countdownRemainderSeconds;
    setCountdownSeconds(Math.max(1, (nextMinutes * 60) + nextSeconds));
    setTimerStartedAt(null);
    setTimerBankedSeconds(0);
  }

  function startMenuButtonPress() {
    if (menuEditMode) return;
    setMenuPressHandled(false);
    if (menuLongPressTimer.current) window.clearTimeout(menuLongPressTimer.current);
    menuLongPressTimer.current = window.setTimeout(() => {
      setMenuPressHandled(true);
      setMenuEditMode(true);
    }, 600);
  }

  function endMenuButtonPress() {
    if (menuLongPressTimer.current) window.clearTimeout(menuLongPressTimer.current);
    menuLongPressTimer.current = null;
  }

  function handleMenuButtonClick(item) {
    if (menuPressHandled) {
      setMenuPressHandled(false);
      return;
    }
    if (menuEditMode) return;
    openMenuView(item.view);
  }

  function moveMenuButton(itemId, targetItemId) {
    setMenuButtonPreferences((current) => {
      const nextPreferences = normalizeMenuButtonPreferences(current);
      const currentIndex = nextPreferences.order.indexOf(itemId);
      const nextIndex = nextPreferences.order.indexOf(targetItemId);
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= nextPreferences.order.length) return nextPreferences;
      const nextOrder = [...nextPreferences.order];
      [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
      return { ...nextPreferences, order: nextOrder };
    });
  }

  function toggleMenuButtonHidden(itemId) {
    setMenuButtonPreferences((current) => {
      const nextPreferences = normalizeMenuButtonPreferences(current);
      const hidden = new Set(nextPreferences.hidden);
      if (hidden.has(itemId)) {
        hidden.delete(itemId);
      } else {
        hidden.add(itemId);
      }
      return { ...nextPreferences, hidden: [...hidden] };
    });
  }

  function resetMenuButtons() {
    setMenuButtonPreferences(normalizeMenuButtonPreferences());
  }

  function openMenuView(nextView) {
    setView(nextView);
    setShowNavMenu(false);
    setMenuEditMode(false);
  }

  function handleWorkoutSaveStatus(result) {
    if (result?.synced) {
      setSaveMessage("Workout synced.");
    } else {
      setSaveMessage("Workout saved on this device.");
    }
    window.setTimeout(() => setSaveMessage(""), 3200);
  }

  if (checking) return <BootPage />;
  if (!user) return <LoginPage onAuthed={hydrateUser} />;

  return (
    <AppShell
      view={view}
      user={user}
      onStartDaySwipe={startDaySwipe}
      onFinishDaySwipe={finishDaySwipe}
      onStopDaySwipe={() => setDaySwipeStart(null)}
      showNavMenu={showNavMenu}
      onShowMenu={() => setShowNavMenu(true)}
      onHideMenu={() => {
        setShowNavMenu(false);
        setMenuEditMode(false);
      }}
      onBrandClick={() => setView("client")}
      onProfileClick={() => setView("profile")}
      timerRunning={timerRunning}
      timerLabel={timerLabel}
      onHandleTimerClick={handleTimerClick}
      onStartTimerPress={startTimerPress}
      onStopTimerPress={endTimerPress}
      menuEditMode={menuEditMode}
      onSetMenuEditMode={setMenuEditMode}
      onResetMenuButtons={resetMenuButtons}
      orderedMenuButtons={orderedMenuButtons}
      hiddenMenuButtonIds={hiddenMenuButtonIds}
      onHandleMenuButtonClick={handleMenuButtonClick}
      onStartMenuButtonPress={startMenuButtonPress}
      onStopMenuButtonPress={endMenuButtonPress}
      onMoveMenuButton={moveMenuButton}
      onToggleMenuButtonHidden={toggleMenuButtonHidden}
      showTimerSettings={showTimerSettings}
      timerMode={timerMode}
      onTimerModeChange={changeTimerMode}
      countdownMinutes={countdownMinutes}
      countdownRemainderSeconds={countdownRemainderSeconds}
      onUpdateCountdownPart={updateCountdownPart}
      intervalWorkSeconds={intervalWorkSeconds}
      onSetIntervalWorkSeconds={setIntervalWorkSeconds}
      intervalRestSeconds={intervalRestSeconds}
      onSetIntervalRestSeconds={setIntervalRestSeconds}
      intervalEndless={intervalEndless}
      onSetIntervalEndless={setIntervalEndless}
      onSetIntervalCurrentRound={setIntervalCurrentRound}
      onSetTimerStartedAt={setTimerStartedAt}
      onSetTimerBankedSeconds={setTimerBankedSeconds}
      intervalRounds={intervalRounds}
      onSetIntervalRounds={setIntervalRounds}
      onResetTimer={resetTimer}
      onSetShowTimerSettings={setShowTimerSettings}
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
        handleLogout={handleLogout}
      />
    </AppShell>
  );
}
