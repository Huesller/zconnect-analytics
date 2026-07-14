import { json, readSession } from "../lib/server-auth.js";

export default function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { ok: false, error: "method_not_allowed" });
  const session = readSession(req);
  return session
    ? json(res, 200, { ok: true, authenticated: true, user: session.user })
    : json(res, 401, { ok: false, authenticated: false });
}
