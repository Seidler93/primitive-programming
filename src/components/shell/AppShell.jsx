import React from "react";
import { MenuPanel } from "../menu/MenuPanel";
import { NavBar } from "../nav/NavBar";
import { TimerSettingsModal } from "../nav/TimerSettingsModal";

export function AppShell({
  children,
  hiddenMenuButtonIds,
  intervalEndless,
  intervalRestSeconds,
  intervalRounds,
  intervalWorkSeconds,
  isOnline,
  menuEditMode,
  notificationMessage,
  onBrandClick,
  onFinishDaySwipe,
  onHandleMenuButtonClick,
  onHandleTimerClick,
  onHideMenu,
  onMoveMenuButton,
  onProfileClick,
  onResetMenuButtons,
  onResetTimer,
  onSetIntervalCurrentRound,
  onSetIntervalEndless,
  onSetIntervalRestSeconds,
  onSetIntervalRounds,
  onSetIntervalWorkSeconds,
  onSetMenuEditMode,
  onSetShowTimerSettings,
  onSetTimerBankedSeconds,
  onSetTimerStartedAt,
  onShowMenu,
  onStartDaySwipe,
  onStartMenuButtonPress,
  onStartTimerPress,
  onStopDaySwipe,
  onStopMenuButtonPress,
  onStopTimerPress,
  onTimerModeChange,
  onToggleMenuButtonHidden,
  onUpdateCountdownPart,
  orderedMenuButtons,
  saveMessage,
  showNavMenu,
  showTimerSettings,
  timerLabel,
  timerMode,
  timerRunning,
  user,
  view,
  countdownMinutes,
  countdownRemainderSeconds,
}) {
  return (
    <main
      className={view === "workout-list" ? "app-shell day-swipe-shell" : "app-shell"}
      onPointerDown={onStartDaySwipe}
      onPointerUp={onFinishDaySwipe}
      onPointerCancel={onStopDaySwipe}
    >
      <NavBar
        onBrandClick={onBrandClick}
        onHandleTimerClick={onHandleTimerClick}
        onProfileClick={onProfileClick}
        onShowMenu={onShowMenu}
        onStartTimerPress={onStartTimerPress}
        onStopTimerPress={onStopTimerPress}
        timerLabel={timerLabel}
        timerRunning={timerRunning}
        user={user}
      />

      {showNavMenu && (
        <MenuPanel
          hiddenMenuButtonIds={hiddenMenuButtonIds}
          menuEditMode={menuEditMode}
          onHandleMenuButtonClick={onHandleMenuButtonClick}
          onHideMenu={onHideMenu}
          onMoveMenuButton={onMoveMenuButton}
          onResetMenuButtons={onResetMenuButtons}
          onSetMenuEditMode={onSetMenuEditMode}
          onStartMenuButtonPress={onStartMenuButtonPress}
          onStopMenuButtonPress={onStopMenuButtonPress}
          onToggleMenuButtonHidden={onToggleMenuButtonHidden}
          orderedMenuButtons={orderedMenuButtons}
        />
      )}

      {showTimerSettings && (
        <TimerSettingsModal
          countdownMinutes={countdownMinutes}
          countdownRemainderSeconds={countdownRemainderSeconds}
          intervalEndless={intervalEndless}
          intervalRestSeconds={intervalRestSeconds}
          intervalRounds={intervalRounds}
          intervalWorkSeconds={intervalWorkSeconds}
          onResetTimer={onResetTimer}
          onSetIntervalCurrentRound={onSetIntervalCurrentRound}
          onSetIntervalEndless={onSetIntervalEndless}
          onSetIntervalRestSeconds={onSetIntervalRestSeconds}
          onSetIntervalRounds={onSetIntervalRounds}
          onSetIntervalWorkSeconds={onSetIntervalWorkSeconds}
          onSetShowTimerSettings={onSetShowTimerSettings}
          onSetTimerBankedSeconds={onSetTimerBankedSeconds}
          onSetTimerStartedAt={onSetTimerStartedAt}
          onTimerModeChange={onTimerModeChange}
          onUpdateCountdownPart={onUpdateCountdownPart}
          timerMode={timerMode}
        />
      )}

      {children}

      {!isOnline && <div className="connection-banner" role="status">Offline. Workout changes save on this device.</div>}
      {saveMessage && <div className="sync-toast" role="status">{saveMessage}</div>}
      {notificationMessage && <div className="notification-toast" role="status">{notificationMessage}</div>}
    </main>
  );
}
