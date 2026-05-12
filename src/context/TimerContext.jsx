import React, { createContext, useContext } from "react";

const TimerContext = createContext(null);

export function TimerProvider({ children, value }) {
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
