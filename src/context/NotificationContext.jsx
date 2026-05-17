import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadAppNotificationSummary } from "../db";

const NotificationContext = createContext(null);

export function NotificationProvider({ children, user }) {
  const [summary, setSummary] = useState({ counts: {}, notifications: [], total: 0 });

  const refreshNotifications = useCallback(async () => {
    if (!user?.uid) {
      setSummary({ counts: {}, notifications: [], total: 0 });
      return;
    }
    const nextSummary = await loadAppNotificationSummary(user.uid);
    setSummary(nextSummary);
  }, [user?.uid]);

  useEffect(() => {
    let active = true;
    if (!user?.uid) {
      setSummary({ counts: {}, notifications: [], total: 0 });
      return undefined;
    }

    loadAppNotificationSummary(user.uid).then((nextSummary) => {
      if (active) setSummary(nextSummary);
    });
    const timer = window.setInterval(() => {
      loadAppNotificationSummary(user.uid).then((nextSummary) => {
        if (active) setSummary(nextSummary);
      });
    }, 20000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user?.uid]);

  const value = useMemo(() => ({
    ...summary,
    refreshNotifications,
  }), [refreshNotifications, summary]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) return { counts: {}, notifications: [], total: 0, refreshNotifications: () => {} };
  return context;
}
