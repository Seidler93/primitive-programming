import React from "react";
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
import { ProgramBuilderPage } from "../pages/program-builder/ProgramBuilderPage";
import { ProgramsPage } from "../pages/programs/ProgramsPage";
import { SettingsPage, SettingsSectionPage } from "../pages/settings/SettingsPage";
import { StorePage } from "../pages/store/StorePage";
import { StoredWorkoutsPage } from "../pages/stored-workouts/StoredWorkoutsPage";
import { StretchesPage } from "../pages/stretches/StretchesPage";
import { WarmupCooldownPage } from "../pages/warmup-cooldown/WarmupCooldownPage";
import { WorkoutPage } from "../pages/workout/WorkoutPage";

export function AppRoutes({
  activeWorkoutKey,
  allProgramSourceWorkouts,
  applyAppUpdate,
  athleteProgressWorkouts,
  calendarMonths,
  deleteScheduledWorkout,
  handleProfileSaved,
  handleProgramWorkoutCreated,
  handleWorkoutSaveStatus,
  isTrainer,
  workouts,
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
  setWorkouts,
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
        <ProfilePage user={user} isTrainer={isTrainer} workouts={workouts} onOpenEdit={() => setView("edit-profile")} onOpenMaxes={() => setView("maxes")} onOpenGoals={() => setView("progress")} onOpenSettings={() => setView("settings")} />
      ) : view === "edit-profile" ? (
        <ProfileEditPage user={user} onProfileSaved={handleProfileSaved} />
      ) : view === "maxes" ? (
        <MaxesPage user={user} onSaveMaxes={syncUserMaxes} />
      ) : view === "progress" ? (
        <GoalsPage user={user} workouts={workouts} onSaveMaxes={syncUserMaxes} />
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
      ) : view === "programs" ? (
        <ProgramsPage user={user} isTrainer={isTrainer} programs={programs} programWorkouts={allProgramSourceWorkouts} workouts={workouts} onProgramStarted={refreshCustomWorkouts} />
      ) : view === "stored-workouts" ? (
        <StoredWorkoutsPage user={user} programs={programs} scheduledWorkouts={scheduledWorkouts} workouts={workouts} onOpenWorkout={openStoredWorkout} />
      ) : view === "program-builder" ? (
        <ProgramBuilderPage
          user={user}
          isTrainer={isTrainer}
          programs={programs}
          programWorkouts={allProgramSourceWorkouts}
          workouts={athleteProgressWorkouts}
          selectedDate={selectedDate}
          onProgramCreated={refreshCustomWorkouts}
          onWorkoutCreated={handleProgramWorkoutCreated}
        />
      ) : view === "athletes" ? (
        <AthletesPage programs={programs} programWorkouts={allProgramSourceWorkouts} workouts={athleteProgressWorkouts} />
      ) : view === "workout-list" ? (
        <DayView date={selectedDate} user={user} workoutGroups={selectedWorkoutGroups} workouts={workouts} programs={programs} onOpenWorkout={openWorkout} onAddWorkout={openBlankWorkout} onChangeDate={openWorkoutList} onMoveWorkout={(workoutKey, nextDate) => moveSelectedWorkout(nextDate, workoutKey)} onDeleteWorkout={deleteScheduledWorkout} />
      ) : view === "workout" ? (
        <WorkoutPage workout={selectedWorkout} workoutKey={activeWorkoutKey} date={selectedDate} user={user} workouts={workouts} setWorkouts={setWorkouts} onDone={() => setView("client")} onSaveStatus={handleWorkoutSaveStatus} onSaveMaxes={syncUserMaxes} />
      ) : (
        <HomePage
          calendarMonths={calendarMonths}
          workouts={workouts}
          onOpenWorkoutList={openWorkoutList}
          onShowMoreMonths={() => setVisibleCalendarMonths((count) => count + 3)}
          selectedDate={selectedDate}
          todayTarget={todayTarget}
          workoutsByDate={workoutsByDate}
        />
      )
  );
}
