import React, { createContext, useContext, useEffect, useState } from "react";
import { formatTimer } from "../utils/appHelpers";

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
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
  const timerRunning = Boolean(timerStartedAt);
  const timerElapsedSeconds = timerBankedSeconds + (timerRunning ? Math.floor((timerNow - timerStartedAt) / 1000) : 0);
  const activeIntervalSeconds = intervalPhase === "work" ? intervalWorkSeconds : intervalRestSeconds;
  const timerSeconds = timerMode === "countup" ? timerElapsedSeconds : Math.max(0, (timerMode === "countdown" ? countdownSeconds : activeIntervalSeconds) - timerElapsedSeconds);
  const timerLabel = timerMode === "interval" ? `${intervalPhase === "work" ? "W" : "R"}${intervalEndless ? "" : intervalCurrentRound} ${formatTimer(timerSeconds)}` : formatTimer(timerSeconds);
  const countdownMinutes = Math.floor(countdownSeconds / 60);
  const countdownRemainderSeconds = countdownSeconds % 60;

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

  function stopTimerPress() {
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

  const value = {
    changeTimerMode,
    countdownMinutes,
    countdownRemainderSeconds,
    handleTimerClick,
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
    showTimerSettings,
    startTimerPress,
    stopTimerPress,
    timerLabel,
    timerMode,
    timerRunning,
    updateCountdownPart,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) throw new Error("useTimer must be used within a TimerProvider.");
  return context;
}
