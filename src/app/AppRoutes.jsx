import React from "react";
import { WorkoutView } from "../components/workout/WorkoutViews";
import { AthletesPage } from "../pages/athletes/AthletesPage";
import { CommunityPage } from "../pages/community/CommunityPage";
import { FoodLogPage } from "../pages/food-log/FoodLogPage";
import { DayView } from "../pages/home/day-view/DayView";
import { HomePage } from "../pages/home/HomePage";
import { MessagesPage } from "../pages/messages/MessagesPage";
import { NewsPage } from "../pages/news/NewsPage";
import { GoalsPage } from "../pages/progress/GoalsPage";
import { MaxesPage } from "../pages/maxes/MaxesPage";
import { ProfileEditPage, ProfilePage } from "../pages/profile/ProfilePage";
import { ProgramsPage } from "../pages/programs/ProgramsPage";
import { SettingsPage, SettingsSectionPage } from "../pages/settings/SettingsPage";
import { StorePage } from "../pages/store/StorePage";
import { StoredProgramsPage } from "../pages/stored-programs/StoredProgramsPage";
import { StoredWorkoutsPage } from "../pages/stored-workouts/StoredWorkoutsPage";
import { StretchesPage } from "../pages/stretches/StretchesPage";
import { WarmupCooldownPage } from "../pages/warmup-cooldown/WarmupCooldownPage";

export function AppRoutes({
  activeWorkoutKey,
  allProgramSourceWorkouts,
  applyAppUpdate,
  athleteProgressLogs,
  calendarMonths,
  handleProfileSaved,
  handleProgramWorkoutCreated,
  handleWorkoutSaveStatus,
  isTrainer,
  logs,
  moveSelectedWorkout,
  openBlankWorkout,
  openStoredWorkout,
  openWorkout,
  openWorkoutList,
  programs,
  refreshCustomWorkouts,
  scheduledWorkouts,
  selectedDate,
  selectedWorkout,
  selectedWorkoutGroups,
  serviceWorkerRegistration,
  setLogs,
  setSelectedDate,
  setView,
  setVisibleCalendarMonths,
  syncUserMaxes,
  todayTarget,
  updateRegistration,
  user,
  view,
  workoutsByDate,
  handleLogout,
}) {
  return (
    view === "profile" ? (
        <ProfilePage user={user} isTrainer={isTrainer} logs={logs} onOpenEdit={() => setView("edit-profile")} onOpenMaxes={() => setView("maxes")} onOpenGoals={() => setView("progress")} onOpenSettings={() => setView("settings")} />
      ) : view === "edit-profile" ? (
        <ProfileEditPage user={user} onProfileSaved={handleProfileSaved} />
      ) : view === "maxes" ? (
        <MaxesPage user={user} onSaveMaxes={syncUserMaxes} />
      ) : view === "progress" ? (
        <GoalsPage user={user} logs={logs} />
      ) : view === "settings" ? (
        <SettingsPage onOpenSection={(section) => setView(`settings-${section}`)} />
      ) : view.startsWith("settings-") ? (
        <SettingsSectionPage
          isTrainer={isTrainer}
          section={view.replace("settings-", "")}
          user={user}
          serviceWorkerRegistration={serviceWorkerRegistration}
          updateRegistration={updateRegistration}
          onApplyUpdate={applyAppUpdate}
          onLogout={handleLogout}
          onBack={() => setView("settings")}
          onProfileSaved={handleProfileSaved}
        />
      ) : view === "store" ? (
        <StorePage />
      ) : view === "community" ? (
        <CommunityPage user={user} />
      ) : view === "messages" ? (
        <MessagesPage />
      ) : view === "news" ? (
        <NewsPage />
      ) : view === "food-log" ? (
        <FoodLogPage />
      ) : view === "stretches" ? (
        <StretchesPage />
      ) : view === "warmup-cooldown" ? (
        <WarmupCooldownPage />
      ) : view === "stored-programs" ? (
        <StoredProgramsPage user={user} isTrainer={isTrainer} programs={programs} workouts={allProgramSourceWorkouts} logs={logs} onProgramStarted={refreshCustomWorkouts} />
      ) : view === "stored-workouts" ? (
        <StoredWorkoutsPage user={user} programs={programs} workouts={scheduledWorkouts} logs={logs} onOpenWorkout={openStoredWorkout} />
      ) : view === "programs" ? (
        <ProgramsPage
          user={user}
          isTrainer={isTrainer}
          programs={programs}
          workouts={allProgramSourceWorkouts}
          logs={athleteProgressLogs}
          selectedDate={selectedDate}
          onProgramCreated={refreshCustomWorkouts}
          onWorkoutCreated={handleProgramWorkoutCreated}
        />
      ) : view === "athletes" ? (
        <AthletesPage programs={programs} workouts={allProgramSourceWorkouts} logs={athleteProgressLogs} />
      ) : view === "workout-list" ? (
        <DayView date={selectedDate} workoutGroups={selectedWorkoutGroups} logs={logs} programs={programs} onOpenWorkout={openWorkout} onAddWorkout={openBlankWorkout} onChangeDate={openWorkoutList} />
      ) : view === "workout" ? (
        <WorkoutView workout={selectedWorkout} workoutKey={activeWorkoutKey} date={selectedDate} user={user} logs={logs} setLogs={setLogs} onDone={() => setView("client")} onSaveStatus={handleWorkoutSaveStatus} onMoveWorkout={moveSelectedWorkout} onSaveMaxes={syncUserMaxes} />
      ) : (
        <HomePage
          calendarMonths={calendarMonths}
          logs={logs}
          onOpenWorkoutList={openWorkoutList}
          onShowMoreMonths={() => setVisibleCalendarMonths((count) => count + 3)}
          selectedDate={selectedDate}
          todayTarget={todayTarget}
          workoutsByDate={workoutsByDate}
        />
      )
  );
}
