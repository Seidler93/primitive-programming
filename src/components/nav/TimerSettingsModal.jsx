import React from "react";

export function TimerSettingsModal({
  countdownMinutes,
  countdownRemainderSeconds,
  intervalEndless,
  intervalRestSeconds,
  intervalRounds,
  intervalWorkSeconds,
  onResetTimer,
  onSetIntervalCurrentRound,
  onSetIntervalEndless,
  onSetIntervalRestSeconds,
  onSetIntervalRounds,
  onSetIntervalWorkSeconds,
  onSetShowTimerSettings,
  onSetTimerBankedSeconds,
  onSetTimerStartedAt,
  onTimerModeChange,
  onUpdateCountdownPart,
  timerMode,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="timer-settings-title">
        <div>
          <p className="eyebrow">Timer</p>
          <h2 id="timer-settings-title">Timer settings</h2>
        </div>
        <div className="timer-mode-grid">
          <button className={timerMode === "countup" ? "choice-button active" : "choice-button"} type="button" onClick={() => onTimerModeChange("countup")}>
            <strong>Count up</strong>
            <span>Tap to start from zero and stop whenever.</span>
          </button>
          <button className={timerMode === "countdown" ? "choice-button active" : "choice-button"} type="button" onClick={() => onTimerModeChange("countdown")}>
            <strong>Countdown</strong>
            <span>Runs to zero, then stops.</span>
          </button>
          <button className={timerMode === "interval" ? "choice-button active" : "choice-button"} type="button" onClick={() => onTimerModeChange("interval")}>
            <strong>Intervals</strong>
            <span>Alternates work/rest each time it finishes.</span>
          </button>
        </div>
        {timerMode === "countdown" && (
          <div className="timer-settings-grid">
            <label>
              Minutes
              <input value={countdownMinutes} onChange={(event) => onUpdateCountdownPart("minutes", event.target.value)} inputMode="numeric" />
            </label>
            <label>
              Seconds
              <input value={countdownRemainderSeconds} onChange={(event) => onUpdateCountdownPart("seconds", event.target.value)} inputMode="numeric" />
            </label>
          </div>
        )}
        {timerMode === "interval" && (
          <>
            <div className="timer-settings-grid">
              <label>
                Work seconds
                <input value={intervalWorkSeconds} onChange={(event) => onSetIntervalWorkSeconds(Math.max(1, Number(event.target.value) || 1))} inputMode="numeric" />
              </label>
              <label>
                Rest seconds
                <input value={intervalRestSeconds} onChange={(event) => onSetIntervalRestSeconds(Math.max(1, Number(event.target.value) || 1))} inputMode="numeric" />
              </label>
            </div>
            <label className="checkbox-field">
              <input
                checked={intervalEndless}
                onChange={(event) => {
                  onSetIntervalEndless(event.target.checked);
                  onSetIntervalCurrentRound(1);
                  onSetTimerStartedAt(null);
                  onSetTimerBankedSeconds(0);
                }}
                type="checkbox"
              />
              Endless intervals
            </label>
            {!intervalEndless && (
              <label>
                Rounds
                <input value={intervalRounds} onChange={(event) => {
                  onSetIntervalRounds(Math.max(1, Number(event.target.value) || 1));
                  onSetIntervalCurrentRound(1);
                  onSetTimerStartedAt(null);
                  onSetTimerBankedSeconds(0);
                }} inputMode="numeric" />
              </label>
            )}
          </>
        )}
        <div className="timer-settings-actions">
          <button className="secondary" type="button" onClick={onResetTimer}>
            Reset timer
          </button>
          <button className="primary" type="button" onClick={() => onSetShowTimerSettings(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
