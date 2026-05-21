import React, { createContext, useContext } from "react";

const AppDataContext = createContext(null);

export function AppDataProvider({ children, value }) {
  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used within an AppDataProvider.");
  return context;
}
