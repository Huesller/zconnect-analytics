import { parseEvents } from "../events/event-core.js";

const ANALYTICS_API_URL = "/api/analytics";

async function fetchEvents() {
  const url = `${ANALYTICS_API_URL}?action=events&cache=${Date.now()}`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (response.status === 401) throw new Error("unauthorized");
  if (!response.ok) throw new Error("Não foi possível carregar os eventos.");
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (data?.ok === false) throw new Error(data.error === "unauthorized" ? "Integração administrativa não autorizada. Confira ANALYTICS_ADMIN_TOKEN." : data.error);
    return parseEvents(data);
  } catch {
    if (text.trim().startsWith("{")) {
      const data = JSON.parse(text);
      throw new Error(data?.error === "unauthorized" ? "Integração administrativa não autorizada. Confira ANALYTICS_ADMIN_TOKEN." : (data?.error || "Resposta inválida do Analytics."));
    }
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(1).map((line) => line.split(","));
    return parseEvents(rows);
  }
}

async function fetchCatalogHealth() {
  const data = await fetchAnalyticsAction("catalog_health");
  return {
    snapshots: Array.isArray(data.snapshots) ? data.snapshots : [],
    products: Array.isArray(data.products) ? data.products : [],
    latest: data.latest || null
  };
}
async function fetchAnalyticsAction(action) {
  const url = `${ANALYTICS_API_URL}?action=${encodeURIComponent(action)}&cache=${Date.now()}`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (response.status === 401) throw new Error("unauthorized");
  if (!response.ok) throw new Error(`Falha ao carregar ${action}.`);
  const data = await response.json();
  if (!data?.ok) throw new Error(data?.error || `Falha ao carregar ${action}.`);
  return data;
}

async function postAnalyticsAction(action, payload = {}) {
  const response = await fetch(ANALYTICS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload })
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    if (response.status === 401 || data?.error === "unauthorized") throw new Error("unauthorized");
    if (data?.error === "invalid_pin") throw new Error("PIN administrativo inválido.");
    if (data?.error === "client_outside_user_scope") throw new Error("Este cliente pertence à carteira de outro vendedor. Peça ao administrador para revisar o responsável.");
    if (data?.error === "all_clients_outside_user_scope") throw new Error("Todos os clientes desta lista já pertencem à carteira de outro vendedor. Peça ao administrador para revisar os responsáveis.");
    throw new Error(data?.error || "Não foi possível concluir a operação.");
  }
  return data;
}

function waitForRetry(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function postAnalyticsActionWithRetry(action, payload = {}, options = {}) {
  const maxAttempts = Math.max(1, Number(options.maxAttempts || 5));
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await postAnalyticsAction(action, payload);
    } catch (error) {
      const code = String(error?.message || "");
      const isBusy = /_busy$/.test(code) || code === "analytics_timeout";
      if (!isBusy) throw error;
      if (attempt === maxAttempts) {
        throw new Error("A planilha continua ocupada com outra atualização. Aguarde um minuto e tente novamente.");
      }
      options.onRetry?.({ attempt: attempt + 1, maxAttempts, code });
      await waitForRetry(1500 + attempt * 1250);
    }
  }
  throw new Error("Não foi possível concluir a operação.");
}

export {
  fetchEvents,
  fetchCatalogHealth,
  fetchAnalyticsAction,
  postAnalyticsAction,
  waitForRetry,
  postAnalyticsActionWithRetry
};


