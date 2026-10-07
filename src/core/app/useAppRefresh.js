import { useEffect } from "react";

function useAppRefresh({
  authStatus,
  load,
  clientModalOpenRef,
  intervalMs = 30000
}) {
  useEffect(() => {
    if (authStatus !== "authenticated") return undefined;

    load();

    const timer = window.setInterval(() => {
      if (!clientModalOpenRef.current) {
        load({ silent: true });
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [authStatus, load, clientModalOpenRef, intervalMs]);
}

export {
  useAppRefresh
};
