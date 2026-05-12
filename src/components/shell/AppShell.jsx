import React from "react";
import { MenuPanel } from "../menu/MenuPanel";
import { NavBar } from "../nav/NavBar";
import { TimerSettingsModal } from "../nav/TimerSettingsModal";
import { useMenu } from "../../context/MenuContext";
import { useTimer } from "../../context/TimerContext";

export function AppShell({
  children,
  isOnline,
  notificationMessage,
  onBrandClick,
  onFinishDaySwipe,
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

      {children}

      {!isOnline && <div className="connection-banner" role="status">Offline. Workout changes save on this device.</div>}
      {saveMessage && <div className="sync-toast" role="status">{saveMessage}</div>}
      {notificationMessage && <div className="notification-toast" role="status">{notificationMessage}</div>}
    </main>
  );
}
