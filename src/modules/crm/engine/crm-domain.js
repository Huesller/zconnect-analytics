import {
  companyKey
} from "../../../shared/company-utils.js";

import {
  normalizeConsultant,
  normalizeCompany,
  safeNumber
} from "../../../shared/normalization.js";

import {
  crmContactDate,
  dateOnly
} from "../../../shared/dates.js";

function parseClientTags(value) {
  return [...new Set(String(value || "").split(/[,;|]/).map((item) => item.trim()).filter(Boolean))];
}

function serializeClientTags(tags = []) {
  return [...new Set(tags.map((item) => String(item || "").trim()).filter(Boolean))].join(", ");
}

function normalizeCrmTask(task) {
  return {
    ...task,
    taskId: String(task.taskId || task.id || ""),
    companyKey: companyKey(task.companyKey || task.companyName),
    companyName: normalizeCompany(task.companyName),
    title: String(task.title || "Tarefa comercial"),
    dueAt: String(task.dueAt || ""),
    owner: String(task.owner || "").toUpperCase(),
    priority: String(task.priority || "normal"),
    status: String(task.status || "open")
  };
}

function normalizeCrmActivity(activity) {
  return {
    ...activity,
    activityId: String(activity.activityId || activity.id || ""),
    companyKey: companyKey(activity.companyKey || activity.companyName),
    companyName: normalizeCompany(activity.companyName),
    type: String(activity.type || "note"),
    valueNumber: safeNumber(activity.value),
    createdAtRaw: activity.createdAt,
    createdAtLabel: dateTime(activity.createdAt),
    updatedAtRaw: activity.updatedAt,
    updatedAtLabel: activity.updatedAt ? dateTime(activity.updatedAt) : "",
    nextAction: String(activity.nextAction || ""),
    nextActionAt: String(activity.nextActionAt || ""),
    actionStatus: String(activity.actionStatus || (activity.nextAction ? "pending" : "")),
    deletedAt: activity.deletedAt || ""
  };
}

function mergeLocalCrmRows(remoteRows = [], localRows = [], idKeys = []) {
  const rowId = (row) => idKeys.map((key) => String(row?.[key] || "")).find(Boolean) || "";
  const merged = new Map();
  remoteRows.forEach((row) => { const id = rowId(row); if (id) merged.set(id, row); });
  localRows.forEach((row) => { const id = rowId(row); if (id) merged.set(id, row); });
  return [...merged.values()];
}

function dateDaysAgo(value, reference = new Date()) {
  const days = Math.max(0, Math.floor(safeNumber(value)));
  const date = new Date(reference);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizePurchaseReference(form = {}) {
  if (String(form.lastPurchaseAt || "").trim()) return form;
  const days = Math.max(0, Math.floor(safeNumber(form.daysWithoutPurchase)));
  return days ? { ...form, lastPurchaseAt: dateDaysAgo(days) } : form;
}

function noteTypeLabel(type) {
  const labels = Object.fromEntries(CONTACT_ACTIVITY_OPTIONS);
  const legacy = { contact_note: "Ligação realizada", call_no_answer: "Não atendeu", email_sent: "E-mail enviado", invalid_phone: "Telefone inválido", contact_success: "Ligação realizada", after_sales_note: "Pós-venda" };
  return labels[type] || legacy[type] || "Anotações gerais";
}

function noteTextForSave(type, value) {
  const text = String(value || "").trim();
  return text || AUTOMATIC_NOTE_TEXT[type] || "";
}

function clientProfilePayload(client = {}, overrides = {}) {
  return {
    companyKey: client.companyKey,
    companyName: client.company || client.companyName,
    customerCode: client.customerCode || "",
    contactName: client.contactName || "",
    phone: client.phone || "",
    email: client.email || "",
    city: client.city || "",
    state: client.state || "",
    taxId: client.taxId || "",
    address: client.address || "",
    route: client.route || "",
    daysWithoutPurchase: purchaseDays(client),
    lastPurchaseAt: client.lastPurchaseAt || "",
    lastPurchaseValue: safeNumber(client.lastPurchaseValue),
    purchaseTotal: safeNumber(client.purchaseTotal),
    purchaseCount: safeNumber(client.purchaseCount),
    averagePurchaseIntervalDays: safeNumber(client.averagePurchaseIntervalDays),
    segment: client.segment || "",
    status: client.statusKey || client.status || "new",
    owner: client.owner || client.consultant || "",
    nextContactAt: client.nextContactAt || "",
    tags: client.tags || "",
    notes: client.notes || "",
    expectedValue: safeNumber(client.expectedValue),
    lastOutcome: client.lastOutcome || "",
    lostReason: client.lostReason || "",
    funnelExitReason: client.funnelExitReason || "",
    funnelExitAt: client.funnelExitAt || "",
    ...overrides
  };
}

function buildCompanyAdminOptions(events, crmClients, reservations) {
  const map = new Map();
  function add(rawName, field) {
    const name = normalizeCompany(rawName);
    if (isAnonymousCompany(name) || cleanupReason(name)) return;
    const identity = name.toLocaleLowerCase("pt-BR");
    if (!map.has(identity)) map.set(identity, { id: identity, name, eventCount: 0, crmCount: 0, reservationCount: 0 });
    map.get(identity)[field] += 1;
  }
  events.forEach((event) => add(event.companyName, "eventCount"));
  crmClients.forEach((client) => add(client.companyName, "crmCount"));
  reservations.forEach((item) => add(item.company, "reservationCount"));
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export {
  parseClientTags,
  serializeClientTags,
  normalizeCrmTask,
  normalizeCrmActivity,
  mergeLocalCrmRows,
  dateDaysAgo,
  normalizePurchaseReference,
  noteTypeLabel,
  noteTextForSave,
  clientProfilePayload,
  buildCompanyAdminOptions
};
