import React from "react";

export function NotificationToasts({ isOnline, notificationMessage, saveMessage }) {
  return (
    <>
      {!isOnline && <div className="connection-banner" role="status">Offline. Workout changes save on this device.</div>}
      {saveMessage && <div className="sync-toast" role="status">{saveMessage}</div>}
      {notificationMessage && <div className="notification-toast" role="status">{notificationMessage}</div>}
    </>
  );
}
