import { fetchAnalyticsAction } from "./analytics-client.js";
import { normalizeCompany, safeNumber } from "../../shared/normalization.js";

async function fetchCrmClients() {
  const data = await fetchAnalyticsAction("crm_clients");

  return (Array.isArray(data.clients) ? data.clients : []).map((client) => ({
    ...client,
    companyKey: String(client.companyKey || ""),
    companyName: normalizeCompany(client.companyName),
    taxId: String(client.taxId || ""),
    phone: String(client.phone || ""),
    status: String(client.status || "new"),
    owner: String(client.owner || ""),
    state: String(client.state || ""),
    address: String(client.address || ""),
    route: String(client.route || ""),
    daysWithoutPurchase: safeNumber(client.daysWithoutPurchase),
    nextContactAt: String(client.nextContactAt || ""),
    tags: String(client.tags || ""),
    funnelExitReason: String(client.funnelExitReason || ""),
    funnelExitAt: String(client.funnelExitAt || ""),
    notes: String(client.notes || ""),
    expectedValue: safeNumber(client.expectedValue),
    lastOutcome: String(client.lastOutcome || ""),
    lostReason: String(client.lostReason || "")
  }));
}

async function fetchCrmTasks() {
  const data = await fetchAnalyticsAction("crm_tasks");
  return Array.isArray(data.tasks) ? data.tasks : [];
}

async function fetchCrmActivities() {
  const data = await fetchAnalyticsAction("crm_activities");
  return Array.isArray(data.activities) ? data.activities : [];
}

async function fetchCrmSettings() {
  const data = await fetchAnalyticsAction("crm_settings");
  return data.settings && typeof data.settings === "object" ? data.settings : {};
}

async function fetchCrmQuotes() {
  return fetchAnalyticsAction("crm_quotes");
}

async function fetchCrmDemands() {
  const data = await fetchAnalyticsAction("crm_demands");
  return Array.isArray(data.demands) ? data.demands : [];
}

export {
  fetchCrmClients,
  fetchCrmTasks,
  fetchCrmActivities,
  fetchCrmSettings,
  fetchCrmQuotes,
  fetchCrmDemands
};
