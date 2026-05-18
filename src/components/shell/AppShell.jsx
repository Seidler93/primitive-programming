import React from "react";
import { MenuPanel } from "../menu/MenuPanel";
import { BottomNav } from "../nav/BottomNav";
import { NavBar } from "../nav/NavBar";
import { NotificationToasts } from "../notifications/NotificationToasts";
import { TimerSettingsModal } from "../nav/TimerSettingsModal";
import { useMenu } from "../../context/MenuContext";
import { useTimer } from "../../context/TimerContext";

export function AppShell({
  children,
  isOnline,
  notificationMessage,
  onAddWorkoutClick,
  onBrandClick,
  onFinishDaySwipe,
  onOpenView,
  onProfileClick,
  onStartDaySwipe,
  onStopDaySwipe,
  saveMessage,
  view,
}) {
  const { showNavMenu } = useMenu();
  const { showTimerSettings } = useTimer();

  return (
    <main
      className={view === "workout-list" ? "app-shell day-swipe-shell" : "app-shell"}
      onPointerDown={onStartDaySwipe}
      onPointerUp={onFinishDaySwipe}
      onPointerCancel={onStopDaySwipe}
    >
      <NavBar
        onBrandClick={onBrandClick}
        onProfileClick={onProfileClick}
      />

      {showNavMenu && <MenuPanel />}

      {showTimerSettings && <TimerSettingsModal />}

      <div className="app-scroll-area">
        {children}
      </div>

      <NotificationToasts
        isOnline={isOnline}
        notificationMessage={notificationMessage}
        saveMessage={saveMessage}
      />

      {view === "client" && (
        <BottomNav
          onAddWorkout={onAddWorkoutClick}
          onOpenView={onOpenView}
          view={view}
        />
      )}
    </main>
  );
}
