import { useCallback, useEffect, useState } from "react";
import { fetchSession, logoutSession } from "./session-client.js";

const EMPTY_PROFILE = {
  username: "",
  displayName: "",
  role: "",
  consultants: []
};

function useAuth() {
  const [authStatus, setAuthStatus] = useState("checking");
  const [authProfile, setAuthProfile] = useState(EMPTY_PROFILE);

  useEffect(() => {
    let active = true;

    fetchSession()
      .then((session) => {
        if (!active) return;

        if (session.authenticated) {
          setAuthProfile(session.profile || {
            username: session.user || "admin",
            displayName: session.user || "Administrador",
            role: "admin",
            consultants: ["*"]
          });
          setAuthStatus("authenticated");
        } else {
          setAuthStatus("anonymous");
        }
      })
      .catch(() => {
        if (active) setAuthStatus("anonymous");
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback((profile) => {
    setAuthProfile(profile || EMPTY_PROFILE);
    setAuthStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await logoutSession();
    setAuthStatus("anonymous");
    setAuthProfile(EMPTY_PROFILE);
  }, []);

  const invalidate = useCallback(() => {
    setAuthStatus("anonymous");
    setAuthProfile(EMPTY_PROFILE);
  }, []);

  return {
    authStatus,
    authProfile,
    login,
    logout,
    invalidate
  };
}

export {
  useAuth,
  EMPTY_PROFILE
};

