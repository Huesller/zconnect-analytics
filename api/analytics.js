import { json, requireSession } from "../lib/server-auth.js";

const UPSTREAM_READ_CACHE = new Map();
const UPSTREAM_READ_TTL_MS = 15000;

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

function normalizeConsultant(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "ivoney" ? "ney" : normalized;
}

function profileFromSession(session) {
  return session.profile || { username: session.user, displayName: session.user, role: "admin", consultants: ["*"] };
}

function isAdmin(profile) {
  return profile.role === "admin" || (profile.consultants || []).includes("*");
}

function allowedConsultants(profile) {
  return new Set((profile.consultants || []).map(normalizeConsultant).filter((item) => item && item !== "*"));
}

function rowConsultant(row) {
  return normalizeConsultant(row?.consultant || row?.consultor || row?.owner || row?.specialOfferSeller);
}

function normalizeCompanyKey(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findMatchingClient(existing, requested) {
  const key = normalizeCompanyKey(requested.companyKey || requested.companyName);
  const code = String(requested.customerCode || "").trim().toLowerCase();
  const tax = String(requested.taxId || "").replace(/\D/g, "");
  return existing.find((client) => (
    (key && normalizeCompanyKey(client.companyKey || client.companyName) === key)
    || (code && String(client.customerCode || "").trim().toLowerCase() === code)
    || (tax && String(client.taxId || "").replace(/\D/g, "") === tax)
  ));
}

async function scopeImportClients(apiUrl, adminToken, body, profile, signal) {
  const clients = Array.isArray(body.clients) ? body.clients : [];
  if (!clients.length || clients.length > 2000) return { allowed: [], conflicts: [] };
  const permittedOwners = allowedConsultants(profile);
  const data = await readUpstream(apiUrl, adminToken, "crm_clients", signal);
  const existing = data.clients || [];
  return clients.reduce((result, requested) => {
    const match = findMatchingClient(existing, requested);
    if (!match || permittedOwners.has(rowConsultant(match))) result.allowed.push(requested);
    else result.conflicts.push({
      companyName: requested.companyName || match.companyName || "Cliente sem nome",
      customerCode: requested.customerCode || match.customerCode || ""
    });
    return result;
  }, { allowed: [], conflicts: [] });
}

async function readUpstream(apiUrl, adminToken, action, signal) {
  const cacheKey = `${apiUrl}|${action}`;
  const cached = UPSTREAM_READ_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < UPSTREAM_READ_TTL_MS) return cached.data;
  const url = new URL(apiUrl);
  url.searchParams.set("action", action);
  url.searchParams.set("adminToken", adminToken);
  url.searchParams.set("proxyCache", String(Date.now()));
  const response = await fetch(url, { signal, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (response.ok) UPSTREAM_READ_CACHE.set(cacheKey, { savedAt: Date.now(), data });
  return data;
}

async function canWriteScopedRecord(apiUrl, adminToken, action, body, profile, signal) {
  if (isAdmin(profile)) return true;
  const allowed = allowedConsultants(profile);
  if (action === "import_crm_clients") {
    return Array.isArray(body.clients) && body.clients.length > 0 && body.clients.length <= 2000;
  }
  if (["complete_crm_task", "cancel_crm_task"].includes(action)) {
    const data = await readUpstream(apiUrl, adminToken, "crm_tasks", signal);
    const task = (data.tasks || []).find((item) => String(item.taskId || item.id) === String(body.taskId || ""));
    return Boolean(task && allowed.has(rowConsultant(task)));
  }
  if (["update_crm_activity", "delete_crm_activity"].includes(action)) {
    const data = await readUpstream(apiUrl, adminToken, "crm_activities", signal);
    const activity = (data.activities || []).find((item) => String(item.activityId || item.id) === String(body.activityId || ""));
    return Boolean(activity && allowed.has(rowConsultant(activity)));
  }
  if (action === "update_crm_demand_status") {
    const data = await readUpstream(apiUrl, adminToken, "crm_demands", signal);
    const demand = (data.demands || []).find((item) => String(item.demandId || item.id) === String(body.demandId || ""));
    return Boolean(demand && allowed.has(rowConsultant(demand)));
  }
  if (action === "merge_crm_clients") {
    const [eventsData, clientsData] = await Promise.all([readUpstream(apiUrl, adminToken, "events", signal), readUpstream(apiUrl, adminToken, "crm_clients", signal)]);
    const owns = (name) => {
      const key = normalizeCompanyKey(name);
      return (clientsData.clients || []).some((row) => normalizeCompanyKey(row.companyKey || row.companyName) === key && allowed.has(rowConsultant(row)))
        || (eventsData.events || []).some((row) => normalizeCompanyKey(row.companyName || row.empresa || row.company) === key && allowed.has(rowConsultant(row)));
    };
    return owns(body.sourceName) && owns(body.targetName);
  }
  if (!["upsert_crm_client", "upsert_crm_task", "record_crm_activity", "complete_crm_action", "archive_crm_client", "upsert_external_quote", "close_commercial_cart", "upsert_crm_demand"].includes(action)) return true;
  const requestedCompany = normalizeCompanyKey(body.companyKey || body.companyName);
  if (!requestedCompany) return false;
  const [eventsData, clientsData] = await Promise.all([
    readUpstream(apiUrl, adminToken, "events", signal),
    readUpstream(apiUrl, adminToken, "crm_clients", signal)
  ]);
  const ownedClient = (clientsData.clients || []).some((client) => (
    normalizeCompanyKey(client.companyKey || client.companyName) === requestedCompany && allowed.has(rowConsultant(client))
  ));
  if (ownedClient) return true;
  const ownedEvent = (eventsData.events || []).some((event) => (
    allowed.has(rowConsultant(event))
    && normalizeCompanyKey(event.companyName || event.empresa || event.company) === requestedCompany
  ));
  if (ownedEvent) return true;
  return action === "upsert_crm_client" && body.createIfMissing === true;
}

function scopePayload(action, data, profile) {
  if (isAdmin(profile) || !data || typeof data !== "object") return data;
  const allowed = allowedConsultants(profile);
  const keep = (row) => allowed.has(rowConsultant(row));
  if (action === "events" && Array.isArray(data.events)) return { ...data, events: data.events.filter(keep) };
  if (action === "reservations_admin" && Array.isArray(data.reservations)) return { ...data, reservations: data.reservations.filter(keep) };
  if (action === "crm_clients" && Array.isArray(data.clients)) return { ...data, clients: data.clients.filter(keep) };
  if (action === "crm_tasks" && Array.isArray(data.tasks)) return { ...data, tasks: data.tasks.filter(keep) };
  if (action === "crm_activities" && Array.isArray(data.activities)) return { ...data, activities: data.activities.filter(keep) };
  if (action === "crm_demands" && Array.isArray(data.demands)) return { ...data, demands: data.demands.filter(keep) };
  if (action === "crm_aliases" && Array.isArray(data.aliases)) return { ...data, aliases: data.aliases.filter(keep) };
  if (action === "crm_quotes" && Array.isArray(data.quotes)) {
    const quotes = data.quotes.filter(keep);
    const ids = new Set(quotes.map((quote) => String(quote.quoteId || "")));
    return { ...data, quotes, items: (data.items || []).filter((item) => ids.has(String(item.quoteId || ""))) };
  }
  return data;
}

const ADMIN_ONLY_ACTIONS = new Set([
  "cleanup_candidates", "cleanup_selected_companies", "merge_companies", "delete_company_data", "clear_events", "reset", "clear", "factory_reset_commercial", "update_crm_settings"
]);

export default async function handler(req, res) {
  const session = requireSession(req, res);
  if (!session) return;
  const profile = profileFromSession(session);
  if (req.method !== "GET" && req.method !== "POST") return json(res, 405, { ok: false, error: "method_not_allowed" });

  const apiUrl = String(process.env.ANALYTICS_API_URL || process.env.VITE_ANALYTICS_API_URL || "").trim();
  const adminToken = String(process.env.ANALYTICS_ADMIN_TOKEN || "").trim();
  if (!apiUrl || !adminToken) return json(res, 503, { ok: false, error: "analytics_proxy_not_configured" });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    let response;
    let action = "";
    let scopeConflicts = [];
    if (req.method === "GET") {
      const url = new URL(apiUrl);
      Object.entries(req.query || {}).forEach(([key, value]) => {
        if (key === "adminToken") return;
        url.searchParams.set(key, Array.isArray(value) ? value[0] : String(value));
      });
      url.searchParams.set("adminToken", adminToken);
      url.searchParams.set("proxyCache", String(Date.now()));
      action = url.searchParams.get("action") || "";
      if (!isAdmin(profile) && ADMIN_ONLY_ACTIONS.has(action)) { clearTimeout(timeout); return json(res, 403, { ok: false, error: "forbidden" }); }
      response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    } else {
      const body = parseBody(req);
      action = String(body.action || "");
      if (!isAdmin(profile) && ADMIN_ONLY_ACTIONS.has(action)) { clearTimeout(timeout); return json(res, 403, { ok: false, error: "forbidden" }); }
      if (!isAdmin(profile)) {
        if (action === "import_crm_clients") {
          const scoped = await scopeImportClients(apiUrl, adminToken, body, profile, controller.signal);
          scopeConflicts = scoped.conflicts;
          body.clients = scoped.allowed;
          if (!body.clients.length) {
            clearTimeout(timeout);
            return json(res, 409, { ok: false, error: "all_clients_outside_user_scope", scopeSkipped: scopeConflicts.length });
          }
        }
        const canWrite = await canWriteScopedRecord(apiUrl, adminToken, action, body, profile, controller.signal);
        if (!canWrite) { clearTimeout(timeout); return json(res, 403, { ok: false, error: "client_outside_user_scope" }); }
        const primaryConsultant = [...allowedConsultants(profile)][0] || profile.username;
        if (["upsert_crm_client", "upsert_crm_task", "record_crm_activity", "complete_crm_action", "archive_crm_client", "merge_crm_clients", "upsert_external_quote", "close_commercial_cart", "upsert_crm_demand"].includes(action)) {
          body.owner = primaryConsultant;
          body.consultant = primaryConsultant;
        }
        if (action === "import_crm_clients" && Array.isArray(body.clients)) {
          body.clients = body.clients.map((client) => ({ ...client, owner: primaryConsultant }));
        }
      }
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
    let data;
    try { data = JSON.parse(text); } catch { return json(res, 502, { ok: false, error: "invalid_analytics_response" }); }
    if (scopeConflicts.length && data && typeof data === "object") {
      data.scopeSkipped = scopeConflicts.length;
      data.scopeConflicts = scopeConflicts.slice(0, 20);
    }
    return json(res, response.ok ? 200 : 502, scopePayload(action, data, profile));
  } catch (error) {
    return json(res, 502, { ok: false, error: error?.name === "AbortError" ? "analytics_timeout" : "analytics_unavailable" });
  }
}
