import React, { useEffect, useState } from "react";
import { Check, Clipboard } from "lucide-react";

function formatConsoleValue(value) {
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function NotificationToasts({ isOnline, notificationMessage, saveMessage }) {
  const [consoleFailure, setConsoleFailure] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    const originalConsoleError = console.error;

    function showConsoleFailure(result) {
      const text = String(result || "").trim();
      if (!text) return;
      setConsoleFailure(text);
      setCopyStatus("");
    }

    const patchedConsoleError = (...args) => {
      originalConsoleError.apply(console, args);
      showConsoleFailure(args.map(formatConsoleValue).join("\n"));
    };
    console.error = patchedConsoleError;

    function handleWindowError(event) {
      showConsoleFailure(event.error ? formatConsoleValue(event.error) : event.message);
    }

    function handleUnhandledRejection(event) {
      showConsoleFailure(formatConsoleValue(event.reason || "Unhandled promise rejection"));
    }

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      if (console.error === patchedConsoleError) {
        console.error = originalConsoleError;
      }
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  async function copyConsoleFailure() {
    if (!consoleFailure) return;
    try {
      await navigator.clipboard.writeText(consoleFailure);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus(""), 1600);
    } catch {
      setCopyStatus("Copy failed");
    }
  }

  return (
    <>
      {!isOnline && <div className="connection-banner" role="status">Offline. Workout changes save on this device.</div>}
      {saveMessage && <div className="sync-toast" role="status">{saveMessage}</div>}
      {notificationMessage && <div className="notification-toast" role="status">{notificationMessage}</div>}
      {consoleFailure && (
        <div className="console-failure-toast" role="alert">
          <div className="console-failure-header">
            <strong>Console command failed</strong>
            <button className="secondary console-copy-button" type="button" onClick={copyConsoleFailure}>
              {copyStatus === "Copied" ? <Check size={16} /> : <Clipboard size={16} />}
              {copyStatus || "Copy result"}
            </button>
          </div>
          <pre>{consoleFailure}</pre>
        </div>
      )}
    </>
  );
}
