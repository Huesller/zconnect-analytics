import { createSession, json, sessionCookie, verifyCredentials } from "../lib/server-auth.js";

export default function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "method_not_allowed" });
  let body = req.body || {};
  try {
    if (typeof body === "string") body = JSON.parse(body || "{}");
  } catch {
    return json(res, 400, { ok: false, error: "invalid_json" });
  }
  if (!process.env.ANALYTICS_SESSION_SECRET) return json(res, 503, { ok: false, error: "auth_not_configured" });
  if (!verifyCredentials(body.user, body.password)) return json(res, 401, { ok: false, error: "invalid_credentials" });
  res.setHeader("Set-Cookie", sessionCookie(createSession(String(body.user).trim())));
  return json(res, 200, { ok: true, user: String(body.user).trim() });
}
