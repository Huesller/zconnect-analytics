import { json, requireSession } from "../lib/server-auth.js";

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

export default async function handler(req, res) {
  if (!requireSession(req, res)) return;
  if (req.method !== "GET" && req.method !== "POST") return json(res, 405, { ok: false, error: "method_not_allowed" });

  const apiUrl = String(process.env.ANALYTICS_API_URL || process.env.VITE_ANALYTICS_API_URL || "").trim();
  const adminToken = String(process.env.ANALYTICS_ADMIN_TOKEN || "").trim();
  if (!apiUrl || !adminToken) return json(res, 503, { ok: false, error: "analytics_proxy_not_configured" });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    let response;
    if (req.method === "GET") {
      const url = new URL(apiUrl);
      Object.entries(req.query || {}).forEach(([key, value]) => {
        if (key === "adminToken") return;
        url.searchParams.set(key, Array.isArray(value) ? value[0] : String(value));
      });
      url.searchParams.set("adminToken", adminToken);
      url.searchParams.set("proxyCache", String(Date.now()));
      response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    } else {
      const body = parseBody(req);
      body.adminToken = adminToken;
      if (body.action === "catalog_snapshot") body.syncToken = String(process.env.CATALOG_SYNC_TOKEN || adminToken);
      response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    }
    clearTimeout(timeout);
    const text = await response.text();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(response.ok ? 200 : 502).send(text);
  } catch (error) {
    return json(res, 502, { ok: false, error: error?.name === "AbortError" ? "analytics_timeout" : "analytics_unavailable" });
  }
}
