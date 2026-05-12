export async function registerAppServiceWorker(onUpdateFound) {
  if (!("serviceWorker" in navigator)) return null;

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  registration.addEventListener("updatefound", () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener("statechange", () => {
      if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
        onUpdateFound?.(registration);
      }
    });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  if (registration.waiting && navigator.serviceWorker.controller) {
    onUpdateFound?.(registration);
  }

  return registration;
}

export function activateWaitingServiceWorker(registration) {
  registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
}
