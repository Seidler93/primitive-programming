import { useEffect, useRef, useState } from "react";
import { listenForForegroundMessages } from "../../services/firebase";

export function useToastNotifications(user) {
  const [notificationMessage, setNotificationMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const notificationTimerRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(notificationTimerRef.current);
      window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let unsubscribe = () => {};
    let active = true;

    listenForForegroundMessages((payload = {}) => {
      const notification = payload?.notification || {};
      const data = payload?.data || {};
      const title = notification.title || data.title || "Primitive Programming";
      const body = notification.body || data.body || "New training update received.";

      window.clearTimeout(notificationTimerRef.current);
      setNotificationMessage(`${title}: ${body}`);
      notificationTimerRef.current = window.setTimeout(() => setNotificationMessage(""), 5000);
    }).then((nextUnsubscribe) => {
      if (active) unsubscribe = nextUnsubscribe;
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  function handleWorkoutSaveStatus(result) {
    window.clearTimeout(saveTimerRef.current);
    setSaveMessage(result?.synced ? "Workout synced." : "Workout saved on this device.");
    saveTimerRef.current = window.setTimeout(() => setSaveMessage(""), 3200);
  }

  return {
    handleWorkoutSaveStatus,
    notificationMessage,
    saveMessage,
  };
}
