async function fetchSession() {
  const response = await fetch("/api/session", {
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));

  return {
    authenticated: Boolean(response.ok && data.authenticated),
    profile: data.profile || (
      data.user
        ? {
            username: data.user,
            displayName: data.user,
            role: "admin",
            consultants: ["*"]
          }
        : null
    ),
    user: data.user || ""
  };
}

async function logoutSession() {
  await fetch("/api/logout", {
    method: "POST"
  }).catch(() => null);
}

export {
  fetchSession,
  logoutSession
};
