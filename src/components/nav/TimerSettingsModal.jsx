import React from "react";
import { useTimer } from "../../context/TimerContext";

export function TimerSettingsModal() {
  const {
    changeTimerMode,
    countdownMinutes,
    countdownRemainderSeconds,
    intervalEndless,
    intervalRestSeconds,
    intervalRounds,
    intervalWorkSeconds,
    resetTimer,
    setIntervalCurrentRound,
    setIntervalEndless,
    setIntervalRestSeconds,
    setIntervalRounds,
    setIntervalWorkSeconds,
    setShowTimerSettings,
    setTimerBankedSeconds,
    setTimerStartedAt,
    timerMode,
    updateCountdownPart,
  } = useTimer();

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="timer-settings-title">
        <div>
          <p className="eyebrow">Timer</p>
          <h2 id="timer-settings-title">Timer settings</h2>
        </div>
        <div className="timer-mode-grid">
          <button className={timerMode === "countup" ? "choice-button active" : "choice-button"} type="button" onClick={() => changeTimerMode("countup")}>
            <strong>Count up</strong>
            <span>Tap to start from zero and stop whenever.</span>
          </button>
          <button className={timerMode === "countdown" ? "choice-button active" : "choice-button"} type="button" onClick={() => changeTimerMode("countdown")}>
            <strong>Countdown</strong>
            <span>Runs to zero, then stops.</span>
          </button>
          <button className={timerMode === "interval" ? "choice-button active" : "choice-button"} type="button" onClick={() => changeTimerMode("interval")}>
            <strong>Intervals</strong>
            <span>Alternates work/rest each time it finishes.</span>
          </button>
        </div>
        {timerMode === "countdown" && (
          <div className="timer-settings-grid">
            <label>
              Minutes
              <input value={countdownMinutes} onChange={(event) => updateCountdownPart("minutes", event.target.value)} inputMode="numeric" />
            </label>
            <label>
              Seconds
              <input value={countdownRemainderSeconds} onChange={(event) => updateCountdownPart("seconds", event.target.value)} inputMode="numeric" />
            </label>
          </div>
        )}
        {timerMode === "interval" && (
          <>
            <div className="timer-settings-grid">
              <label>
                Work seconds
                <input value={intervalWorkSeconds} onChange={(event) => setIntervalWorkSeconds(Math.max(1, Number(event.target.value) || 1))} inputMode="numeric" />
              </label>
              <label>
                Rest seconds
                <input value={intervalRestSeconds} onChange={(event) => setIntervalRestSeconds(Math.max(1, Number(event.target.value) || 1))} inputMode="numeric" />
              </label>
            </div>
            <label className="checkbox-field">
              <input
                checked={intervalEndless}
                onChange={(event) => {
                  setIntervalEndless(event.target.checked);
                  setIntervalCurrentRound(1);
                  setTimerStartedAt(null);
                  setTimerBankedSeconds(0);
                }}
                type="checkbox"
              />
              Endless intervals
            </label>
            {!intervalEndless && (
              <label>
                Rounds
                <input value={intervalRounds} onChange={(event) => {
                  setIntervalRounds(Math.max(1, Number(event.target.value) || 1));
                  setIntervalCurrentRound(1);
                  setTimerStartedAt(null);
                  setTimerBankedSeconds(0);
                }} inputMode="numeric" />
              </label>
            )}
          </>
        )}
        <div className="timer-settings-actions">
          <button className="secondary" type="button" onClick={resetTimer}>
            Reset timer
          </button>
          <button className="primary" type="button" onClick={() => setShowTimerSettings(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
