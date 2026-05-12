import React from "react";
import { Clock, Dumbbell, Menu, UserRound } from "lucide-react";

export function NavBar({
  onBrandClick,
  onHandleTimerClick,
  onProfileClick,
  onShowMenu,
  onStartTimerPress,
  onStopTimerPress,
  timerLabel,
  timerRunning,
  user,
}) {
  return (
    <nav className="top-nav">
      <button className="nav-button nav-icon menu-button" type="button" onClick={onShowMenu} aria-label="Open menu" title="Menu">
        <Menu size={19} />
      </button>
      <button className="nav-brand" type="button" onClick={onBrandClick} aria-label="Go to home" title="Home">
        <Dumbbell size={22} />
        <span>Primitive</span>
      </button>
      <div className="nav-actions">
        <button
          className={timerRunning ? "nav-button timer-button active" : "nav-button timer-button"}
          onClick={onHandleTimerClick}
          onPointerDown={onStartTimerPress}
          onPointerUp={onStopTimerPress}
          onPointerCancel={onStopTimerPress}
          onPointerLeave={onStopTimerPress}
          type="button"
          aria-label={timerRunning ? `Stop timer at ${timerLabel}` : `Start timer at ${timerLabel}`}
          title="Tap start/stop, double tap reset, long press settings"
        >
          <Clock size={17} />
          <span>{timerLabel}</span>
        </button>
        <button className="nav-profile-button" type="button" onClick={onProfileClick} aria-label="Open profile" title="Profile">
          {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserRound size={18} />}
        </button>
      </div>
    </nav>
  );
}
