import { expiredSessionCookie, json } from "../lib/server-auth.js";

export default function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "method_not_allowed" });
  res.setHeader("Set-Cookie", expiredSessionCookie());
  return json(res, 200, { ok: true });
}
