import React, { createContext, useContext } from "react";

const MenuContext = createContext(null);

export function MenuProvider({ children, value }) {
  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error("useMenu must be used within a MenuProvider.");
  return context;
}
