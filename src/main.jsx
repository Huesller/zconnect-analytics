import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  Download,
  Flame,
  Eraser,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  X,
  XCircle
} from "lucide-react";
import "./styles.css";
import { InsightStrip } from "./components/ExecutiveInsights.jsx";
import { Kpi, ValueCard } from "./components/MetricCard.jsx";
import { EmptyState } from "./components/EmptyState.jsx";
import { ExecutiveHeader } from "./components/ExecutiveHeader.jsx";
import { StatGrid } from "./components/StatGrid.jsx";
import { RankingTable } from "./components/RankingTable.jsx";

const ANALYTICS_API_URL = "/api/analytics";
const EMPTY_PERIOD_MESSAGE = "Nenhum evento registrado no período.";
const EMPTY_LIST_MESSAGE = "Sem dados no período.";
const RESET_SUCCESS_MESSAGE = "Dados de teste limpos com sucesso";
const RESET_ERROR_MESSAGE = "Erro ao limpar dados. Verifique Apps Script/PIN";

const EVENT_ALIASES = {
  view_product: "product_open",
  search_no_result: "search_no_results",
  sem_resultado: "search_no_results",
  whatsapp_checkout: "whatsapp_quote",
  whatsapp_order: "whatsapp_quote"
};

const EVENT_LABELS = {
  page_view: "Acesso",
  search: "Busca",
  search_no_results: "Busca sem resultado",
  product_open: "Produto aberto",
  add_to_cart: "Adicionado",
  remove_from_cart: "Removido",
  clear_cart: "Carrinho limpo",
  whatsapp_quote: "Cotação WhatsApp",
  special_offer_created: "Oferta criada",
  special_offer_opened: "Oferta aberta"
};

const PIPELINE_STAGES = [
  { key: "new", label: "Novo interesse" },
  { key: "contact", label: "Contato necessário" },
  { key: "quoted", label: "Cotação enviada" },
  { key: "negotiation", label: "Negociação" },
  { key: "waiting", label: "Aguardando cliente" },
  { key: "won", label: "Pedido fechado" },
  { key: "lost", label: "Perdido" }
];

const LOST_REASONS = ["Sem estoque", "Preço", "Frete", "Prazo", "Cliente desistiu", "Comprou de outro fornecedor", "Outro"];

const EVENT_HISTORY_COLUMNS = [
  { key: "dateTime", label: "Data/hora", className: "col-time" },
  { key: "company", label: "Empresa", className: "col-company" },
  { key: "consultant", label: "Consultor", className: "col-consultant" },
  { key: "event", label: "Evento", className: "col-event" },
  { key: "product", label: "Produto", className: "col-product" },
  { key: "search", label: "Busca", className: "col-search" },
  { key: "value", label: "Valor", className: "col-value" },
  { key: "quantity", label: "Qtd.", className: "col-qty" }
];

const SEARCH_HISTORY_COLUMNS = [
  { key: "dateTime", label: "Data/hora", className: "col-time" },
  { key: "company", label: "Empresa", className: "col-company" },
  { key: "consultant", label: "Consultor", className: "col-consultant" },
  { key: "search", label: "Termo buscado", className: "col-search-wide" },
  { key: "result", label: "Resultado", className: "col-result" },
  { key: "event", label: "Evento", className: "col-event" }
];

const QUOTE_HISTORY_COLUMNS = [
  { key: "dateTime", label: "Data/hora", className: "col-time" },
  { key: "company", label: "Empresa", className: "col-company" },
  { key: "consultant", label: "Consultor", className: "col-consultant" },
  { key: "items", label: "Itens", className: "col-qty" },
  { key: "product", label: "Produtos", className: "col-product-wide" },
  { key: "value", label: "Valor total cotado", className: "col-value" }
];

const COMPANY_ACTIVITY_COLUMNS = [
  { key: "position", label: "#", className: "col-qty" },
  { key: "company", label: "Empresa", className: "col-company-wide" },
  { key: "score", label: "Score", className: "col-metric" },
  { key: "totalActions", label: "Ações", className: "col-metric" },
  { key: "accesses", label: "Acessos", className: "col-metric" },
  { key: "searches", label: "Buscas", className: "col-metric" },
  { key: "productOpen", label: "Produtos abertos", className: "col-metric" },
  { key: "added", label: "Adicionados", className: "col-metric" },
  { key: "quotes", label: "Cotações", className: "col-metric" },
  { key: "quoteRate", label: "Conversão", className: "col-metric" },
  { key: "quoteTotal", label: "Valor cotado", className: "col-value" },
  { key: "lastEvent", label: "Último evento", className: "col-time" }
];

const CONSULTANT_ACTIVITY_COLUMNS = [
  { key: "position", label: "#", className: "col-qty" },
  { key: "consultant", label: "Consultor", className: "col-company-wide" },
  { key: "score", label: "Score", className: "col-metric" },
  { key: "totalActions", label: "Ações", className: "col-metric" },
  { key: "accesses", label: "Acessos", className: "col-metric" },
  { key: "searches", label: "Buscas", className: "col-metric" },
  { key: "productOpen", label: "Produtos abertos", className: "col-metric" },
  { key: "quotes", label: "Cotações", className: "col-metric" },
  { key: "quoteRate", label: "Conversão", className: "col-metric" },
  { key: "quoteTotal", label: "Valor cotado", className: "col-value" },
  { key: "lastEvent", label: "Último evento", className: "col-time" }
];

const HOT_PRODUCT_COLUMNS = [
  { key: "position", label: "#", className: "col-qty" },
  { key: "product", label: "Produto", className: "col-product-wide" },
  { key: "views", label: "Aberturas", className: "col-metric" },
  { key: "carts", label: "Carrinhos", className: "col-metric" },
  { key: "quotes", label: "Cotações", className: "col-metric" },
  { key: "score", label: "Score", className: "col-metric" },
  { key: "conversion", label: "Conversão", className: "col-metric" },
  { key: "lastEvent", label: "Último sinal", className: "col-time" }
];

const QUOTED_PRODUCT_COLUMNS = [
  { key: "position", label: "#", className: "col-qty" },
  { key: "product", label: "Produto", className: "col-product-wide" },
  { key: "quotes", label: "Cotações", className: "col-metric" },
  { key: "carts", label: "Carrinhos", className: "col-metric" },
  { key: "views", label: "Aberturas", className: "col-metric" },
  { key: "score", label: "Score", className: "col-metric" },
  { key: "conversion", label: "Conversão", className: "col-metric" }
];

const NO_RESULT_DEMAND_COLUMNS = [
  { key: "position", label: "#", className: "col-qty" },
  { key: "search", label: "Termo pesquisado", className: "col-search-wide" },
  { key: "count", label: "Ocorrências", className: "col-metric" },
  { key: "companies", label: "Empresas", className: "col-metric" },
  { key: "companyList", label: "Empresas interessadas", className: "col-company-wide" },
  { key: "consultants", label: "Consultores", className: "col-metric" },
  { key: "lastEvent", label: "Última busca", className: "col-time" }
];

const COMPANY_COMMERCIAL_COLUMNS = [
  { key: "position", label: "#", className: "col-qty" },
  { key: "company", label: "Empresa", className: "col-company-wide" },
  { key: "score", label: "Score", className: "col-metric" },
  { key: "quotes", label: "Cotações", className: "col-metric" },
  { key: "searches", label: "Buscas", className: "col-metric" },
  { key: "productOpen", label: "Produtos", className: "col-metric" },
  { key: "quoteRate", label: "Conv.", className: "col-metric" },
  { key: "lastEvent", label: "Último evento", className: "col-time" }
];

const CONSULTANT_COMMERCIAL_COLUMNS = [
  { key: "position", label: "#", className: "col-qty" },
  { key: "consultant", label: "Consultor", className: "col-company-wide" },
  { key: "score", label: "Score", className: "col-metric" },
  { key: "quotes", label: "Cotações", className: "col-metric" },
  { key: "accesses", label: "Acessos", className: "col-metric" },
  { key: "searches", label: "Buscas", className: "col-metric" },
  { key: "quoteRate", label: "Conv.", className: "col-metric" },
  { key: "quoteTotal", label: "Valor", className: "col-value" }
];

const DORMANT_COMPANY_COLUMNS = [
  { key: "position", label: "#", className: "col-qty" },
  { key: "company", label: "Empresa", className: "col-company-wide" },
  { key: "status", label: "Status", className: "col-event" },
  { key: "previousScore", label: "Score anterior", className: "col-metric" },
  { key: "currentScore", label: "Score atual", className: "col-metric" },
  { key: "drop", label: "Queda", className: "col-metric" },
  { key: "previousQuotes", label: "Cotações ant.", className: "col-metric" },
  { key: "currentQuotes", label: "Cotações atuais", className: "col-metric" },
  { key: "lastEvent", label: "Último evento", className: "col-time" }
];

const OFFER_COLUMNS = [
  { key: "client", label: "Cliente", className: "col-company-wide" },
  { key: "consultant", label: "Consultor", className: "col-consultant" },
  { key: "discount", label: "Adicional", className: "col-metric" },
  { key: "opens", label: "Aberturas", className: "col-metric" },
  { key: "quotes", label: "Cotações", className: "col-metric" },
  { key: "quoteTotal", label: "Valor cotado", className: "col-value" },
  { key: "status", label: "Status", className: "col-event" },
  { key: "createdAt", label: "Criada em", className: "col-time" }
];

const RESERVATION_COLUMNS = [
  { key: "company", label: "Empresa", className: "col-company-wide" },
  { key: "consultant", label: "Consultor", className: "col-consultant" },
  { key: "product", label: "Produto", className: "col-product-wide" },
  { key: "requested", label: "Solicitadas", className: "col-metric" },
  { key: "reserved", label: "Reservadas", className: "col-metric" },
  { key: "excess", label: "Sob consulta", className: "col-metric" },
  { key: "status", label: "Status", className: "col-event" },
  { key: "expires", label: "Expira", className: "col-time" }
];

const ACTIVE_CART_COLUMNS = [
  { key: "company", label: "Empresa", className: "col-company-wide" },
  { key: "consultant", label: "Consultor", className: "col-consultant" },
  { key: "products", label: "Produtos", className: "col-metric" },
  { key: "reserved", label: "Reservadas", className: "col-metric" },
  { key: "excess", label: "Sob consulta", className: "col-metric" },
  { key: "status", label: "Status", className: "col-event" }
];

function normalizeEvent(value) {
  const event = String(value || "").trim();
  return EVENT_ALIASES[event] || event;
}

function normalizeConsultant(value) {
  const slug = String(value || "sem_consultor").toLowerCase().trim();
  if (slug === "ivoney") return "ney";
  return slug || "sem_consultor";
}

function normalizeCompany(value) {
  const company = String(value || "").trim();
  return company || "Empresa não informada";
}

function isAnonymousCompany(value) {
  const company = normalizeCompany(value).toLowerCase();
  return company === "não identificado" ||
    company === "nao identificado" ||
    company === "empresa não informada" ||
    company === "empresa nao informada" ||
    company === "não informada" ||
    company === "nao informada";
}

function companyKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanupReason(value) {
  const key = companyKey(value);
  if (!key || ["nao identificado", "empresa nao informada", "nao informada", "anonimo", "visitante", "sem empresa"].includes(key)) {
    return "Empresa não identificada";
  }
  if (key.split(" ").some((token) => /^(teste|testes|test|testing)\d*$/.test(token))) {
    return "Nome de teste";
  }
  return "";
}

function duplicateCompanyKey(value) {
  return companyKey(value)
    .replace(/\b(ltda|eireli|mei|me|sa)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function crmStatusLabel(status) {
  const labels = {
    new: "Novo",
    contact: "Em contato",
    quoted: "Cotação enviada",
    negotiation: "Negociação",
    waiting: "Aguardando cliente",
    won: "Pedido fechado",
    active: "Cliente ativo",
    cold: "Frio",
    lost: "Perdido"
  };
  return labels[status] || labels.new;
}

function percent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

function commercialEventScore(event) {
  if (!event) return 0;
  if (event.event === "page_view") return 1;
  if (event.event === "search" || event.event === "search_no_results") return 2;
  if (event.event === "product_open") return 3;
  if (event.event === "add_to_cart") return 5 * productQuantity(productFromEvent(event), event.quantity || 1);
  if (event.event === "whatsapp_quote") return 15;
  return 1;
}

function safeNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value || "0").trim().replace(/[^0-9,.-]/g, "");
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  return Number(normalized) || 0;
}

function readField(row, keys, fallback = "") {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return fallback;
}

function parseProducts(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function eventTimestamp(row) {
  return readField(row, ["timestamp", "createdAt", "date", "data"], new Date().toISOString());
}

function normalizeObjectEvent(row, index) {
  const event = normalizeEvent(readField(row, ["event", "acao", "type"], ""));
  const timestamp = eventTimestamp(row);
  const companyRaw = String(readField(row, ["companyName", "empresa", "company", "cliente", "clientName", "nomeEmpresa"], "")).trim();
  const quantity = safeNumber(readField(row, ["quantity", "quantidade"]));
  const total = safeNumber(readField(row, ["total", "cart_total"]));
  const products = parseProducts(readField(row, ["products", "items", "productList"]));
  const cartTotal = safeNumber(readField(row, ["cartTotal", "cart_total", "total", "displayedPrice"], total));
  const itemsCount = safeNumber(readField(row, ["itemsCount", "itemCount", "quantity", "quantidade"], quantity));

  return {
    id: row.id || row.eventId || `row-${index}`,
    timestamp,
    createdAt: timestamp,
    event,
    consultant: normalizeConsultant(readField(row, ["consultant", "consultor", "consultant_slug"])),
    companyName: normalizeCompany(companyRaw),
    companyRaw,
    clientId: readField(row, ["clientId", "clienteId", "customerId", "sessionId"], ""),
    sessionId: readField(row, ["sessionId"], ""),
    query: String(readField(row, ["query", "search_query", "busca"], "")).trim(),
    productCode: String(readField(row, ["productCode", "codigo", "product_code"], "")).trim(),
    productName: String(readField(row, ["productName", "descricao", "product_name"], "")).trim(),
    brand: String(readField(row, ["brand", "marca", "fabricante"], "")).trim(),
    price: safeNumber(readField(row, ["price", "preco"])),
    quantity,
    total,
    cartTotal,
    itemsCount,
    products,
    page: readField(row, ["page"], ""),
    referrer: readField(row, ["referrer"], ""),
    userAgent: readField(row, ["userAgent"], ""),
    searchTimeMs: safeNumber(readField(row, ["searchTimeMs", "search_time", "elapsedMs"])),
    resultsCount: safeNumber(readField(row, ["resultsCount", "results", "resultCount"])),
    specialOffer: Boolean(readField(row, ["specialOffer"], false)),
    specialOfferId: String(readField(row, ["specialOfferId"], "")).trim(),
    specialOfferSigned: Boolean(readField(row, ["specialOfferSigned"], false)),
    specialOfferActive: Boolean(readField(row, ["specialOfferActive"], false)),
    specialOfferExpired: Boolean(readField(row, ["specialOfferExpired"], false)),
    specialOfferClient: String(readField(row, ["specialOfferClient"], "")).trim(),
    specialOfferSeller: normalizeConsultant(readField(row, ["specialOfferSeller"], "")),
    specialOfferMode: String(readField(row, ["specialOfferMode"], "")).trim(),
    specialOfferDiscount: safeNumber(readField(row, ["specialOfferDiscount"])),
    specialOfferFactor: safeNumber(readField(row, ["specialOfferFactor"])),
    specialOfferExpiresAt: String(readField(row, ["specialOfferExpiresAt"], "")).trim(),
    specialOfferSource: String(readField(row, ["specialOfferSource"], "")).trim()
  };
}

function normalizeArrayEvent(row, index) {
  return normalizeObjectEvent({
    id: `row-${index}`,
    createdAt: row[0],
    timestamp: row[0],
    event: row[1],
    consultant: row[2],
    query: row[3],
    productCode: row[4],
    productName: row[5],
    brand: row[6],
    price: row[7],
    quantity: row[8],
    total: row[9],
    page: row[10],
    userAgent: row[11],
    sessionId: row[12],
    eventId: row[13],
    clientId: row[14],
    companyName: row[15],
    searchTimeMs: row[18],
    resultsCount: row[19]
  }, index);
}

function parseEvents(payload) {
  let rows = [];
  if (Array.isArray(payload)) rows = payload;
  if (payload && Array.isArray(payload.events)) rows = payload.events;
  if (payload && Array.isArray(payload.data)) rows = payload.data;

  return rows
    .map((row, index) => (Array.isArray(row) ? normalizeArrayEvent(row, index) : normalizeObjectEvent(row, index)))
    .filter((event) => event.event);
}

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

function reservationExpiryLabel(value) {
  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.getTime())) return "-";
  const minutes = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `em ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `em ${hours}h ${remainder}min` : `em ${hours}h`;
}

function normalizeReservation(row, index) {
  const statusKey = String(row?.status || "active").toLowerCase();
  const company = normalizeCompany(row?.companyName);
  const consultant = normalizeConsultant(row?.consultant).toUpperCase();
  const productCode = String(row?.productCode || "").trim();
  const productName = String(row?.productName || "").trim();
  const requestedNumber = safeNumber(row?.requestedQty);
  const reservedNumber = safeNumber(row?.reservedQty);
  const excessNumber = safeNumber(row?.excessQty);
  const formatted = {
    id: row?.id || `reservation-${index}`,
    sessionId: String(row?.sessionId || ""),
    company,
    consultant,
    product: [productCode, productName].filter(Boolean).join(" · ") || "Produto não informado",
    requested: requestedNumber,
    reserved: reservedNumber,
    excess: excessNumber || "-",
    requestedNumber,
    reservedNumber,
    excessNumber,
    stockQty: safeNumber(row?.stockQty),
    statusKey,
    status: statusKey === "quoted" ? "Cotação enviada" : "No carrinho",
    expires: reservationExpiryLabel(row?.expiresAt),
    expiresAtRaw: row?.expiresAt || "",
    updatedAtRaw: row?.updatedAt || row?.createdAt || "",
    updatedAt: dateTime(row?.updatedAt || row?.createdAt),
    productCode,
    productName
  };
  formatted._search = [formatted.company, formatted.consultant, formatted.product, formatted.status]
    .join(" ")
    .toLowerCase();
  return formatted;
}

async function fetchActiveReservations() {
  const url = `${ANALYTICS_API_URL}?action=reservations_admin&cache=${Date.now()}`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (response.status === 401) throw new Error("unauthorized");
  if (!response.ok) throw new Error("Não foi possível carregar os carrinhos ativos.");
  const data = await response.json();
  if (data?.ok === false) throw new Error(data.error || "Falha ao carregar carrinhos ativos.");
  const rows = Array.isArray(data?.reservations) ? data.reservations : [];
  return rows.map(normalizeReservation);
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
    throw new Error(data?.error || "Não foi possível concluir a operação.");
  }
  return data;
}

async function fetchCrmClients() {
  const data = await fetchAnalyticsAction("crm_clients");
  return (Array.isArray(data.clients) ? data.clients : []).map((client) => ({
    ...client,
    companyKey: String(client.companyKey || ""),
    companyName: normalizeCompany(client.companyName),
    phone: String(client.phone || ""),
    status: String(client.status || "new"),
    owner: String(client.owner || ""),
    nextContactAt: String(client.nextContactAt || ""),
    tags: String(client.tags || ""),
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

async function fetchCatalogHealth() {
  const data = await fetchAnalyticsAction("catalog_health");
  return {
    snapshots: Array.isArray(data.snapshots) ? data.snapshots : [],
    products: Array.isArray(data.products) ? data.products : [],
    latest: data.latest || null
  };
}

async function fetchCleanupCandidates() {
  const data = await fetchAnalyticsAction("cleanup_candidates");
  return Array.isArray(data.candidates) ? data.candidates : [];
}

async function clearEvents(pin) {
  return postAnalyticsAction("clear_events", { pin });
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function localDateInput(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isSamePeriod(dateLike, selected, customStart = "", customEnd = "") {
  if (selected === "all") return true;
  const d = new Date(dateLike);
  const now = new Date();
  if (Number.isNaN(d.getTime())) return false;
  if (selected === "today") return d.toDateString() === now.toDateString();

  if (selected === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return d.toDateString() === yesterday.toDateString();
  }

  if (selected === "week") {
    const start = startOfDay(now);
    const weekday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - weekday);
    return d >= start && d <= now;
  }

  if (selected === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return d >= start && d <= now;
  }

  if (selected === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return d >= start && d <= end;
  }

  if (selected === "custom") {
    const start = customStart ? startOfDay(`${customStart}T00:00:00`) : null;
    const end = customEnd ? endOfDay(`${customEnd}T00:00:00`) : null;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return Boolean(start || end);
  }

  const days = selected === "7d" ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);
  return d >= cutoff;
}

function countBy(items, keyFn, weightFn = () => 1) {
  const map = new Map();
  items.forEach((item) => {
    const key = String(keyFn(item) || "").trim();
    if (!key) return;
    map.set(key, (map.get(key) || 0) + safeNumber(weightFn(item) || 1));
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CurrencyInput({ value, onChange, placeholder = "R$ 0,00", ...props }) {
  const [display, setDisplay] = useState(value === "" || value === null || value === undefined ? "" : money(safeNumber(value)));
  useEffect(() => setDisplay(value === "" || value === null || value === undefined ? "" : money(safeNumber(value))), [value]);
  return <input {...props} inputMode="decimal" value={display} placeholder={placeholder} onFocus={(event) => event.currentTarget.select()} onChange={(event) => {
    setDisplay(event.target.value);
    onChange?.(event.target.value);
  }} onBlur={() => {
    const numeric = safeNumber(display);
    const formatted = display.trim() ? money(numeric) : "";
    setDisplay(formatted);
    onChange?.(formatted);
  }}/>;
}

function DatePickerField({ value, onChange, min, max, required = false }) {
  const inputRef = useRef(null);
  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (typeof input.showPicker === "function") input.showPicker();
  }
  return <span className="date-picker-field"><input ref={inputRef} type="date" value={value} min={min} max={max} required={required} onChange={(event) => onChange(event.target.value)}/><button type="button" onClick={openPicker} aria-label="Abrir calendário"><CalendarDays size={16}/></button></span>;
}

function dateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function crmContactDate(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(`${text}T12:00:00`) : new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateOnly(value) {
  const date = crmContactDate(value);
  return date ? date.toLocaleDateString("pt-BR") : "-";
}

function timeOnly(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function productFromEvent(event) {
  return {
    productCode: event.productCode,
    productName: event.productName,
    brand: event.brand,
    quantity: event.quantity || 1,
    price: event.price,
    total: event.total
  };
}

function productCode(product) {
  return String(product.productCode || product.code || product.codigo || product.sku || "").trim();
}

function productName(product) {
  return String(product.productName || product.name || product.description || product.descricao || "").trim();
}

function productLabel(product) {
  const code = productCode(product);
  const name = productName(product);
  return [code, name].filter(Boolean).join(" - ") || "Produto não informado";
}

function productQuantity(product, fallback = 1) {
  return Math.max(1, safeNumber(product.quantity || product.quantidade || fallback || 1));
}

function productValue(product, event) {
  const total = safeNumber(product.total || product.cartTotal || product.valorTotal);
  if (total) return total;
  const price = safeNumber(product.price || product.preco || event.price);
  return price ? price * productQuantity(product, event.quantity || 1) : safeNumber(event.total || event.cartTotal);
}

function quoteProducts(event) {
  const products = event.products.length ? event.products : [productFromEvent(event)];
  return products.filter((product) => productLabel(product) !== "Produto não informado");
}

function quoteProductsSummary(event) {
  const labels = quoteProducts(event).map(productLabel);
  if (!labels.length) return "Produtos não informados";
  if (labels.length <= 2) return labels.join("; ");
  return `${labels.slice(0, 2).join("; ")} +${labels.length - 2} produtos`;
}

function quoteItemsCount(event) {
  if (event.itemsCount) return event.itemsCount;
  const products = quoteProducts(event);
  if (!products.length) return event.quantity || 0;
  return products.reduce((sum, product) => sum + productQuantity(product, 1), 0);
}

function eventDetail(event) {
  if (event.query) return event.query;
  if (event.event === "whatsapp_quote") return quoteProductsSummary(event);
  const product = productLabel(productFromEvent(event));
  if (product !== "Produto não informado") return product;
  return event.page || event.clientId || "-";
}

function productRank(events, options = {}) {
  const { expandQuotes = false, weightQuantity = false } = options;
  const map = new Map();

  events.forEach((event) => {
    const products = expandQuotes ? quoteProducts(event) : [productFromEvent(event)];
    products.forEach((product) => {
      const label = productLabel(product);
      if (!label || label === "Produto não informado") return;
      const weight = weightQuantity ? productQuantity(product, event.quantity || 1) : 1;
      map.set(label, (map.get(label) || 0) + weight);
    });
  });

  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function updateProductMetric(map, label, event, field, weight = 1) {
  if (!label || label === "Produto não informado") return;

  if (!map.has(label)) {
    map.set(label, {
      product: label,
      views: 0,
      carts: 0,
      quotes: 0,
      quotedItemsQty: 0,
      score: 0,
      lastEventDate: null
    });
  }

  const row = map.get(label);
  row[field] += weight;

  const currentDate = new Date(event.timestamp);
  if (!Number.isNaN(currentDate.getTime()) && (!row.lastEventDate || currentDate > row.lastEventDate)) {
    row.lastEventDate = currentDate;
  }
}

function commercialProductRows({ productOpen = [], added = [], quotes = [] }) {
  const map = new Map();

  productOpen.forEach((event) => {
    updateProductMetric(map, productLabel(productFromEvent(event)), event, "views", 1);
  });

  added.forEach((event) => {
    const product = productFromEvent(event);
    updateProductMetric(map, productLabel(product), event, "carts", productQuantity(product, event.quantity || 1));
  });

  quotes.forEach((event) => {
    quoteProducts(event).forEach((product) => {
      updateProductMetric(map, productLabel(product), event, "quotes", productQuantity(product, 1));
    });
  });

  return [...map.values()]
    .map((row) => {
      const score = row.views + (row.carts * 3) + (row.quotes * 10);
      const conversionRate = row.views ? row.quotes / row.views : 0;
      return {
        ...row,
        score,
        conversionRate,
        conversion: row.views ? `${(conversionRate * 100).toFixed(1).replace(".", ",")}%` : "-",
        lastEvent: row.lastEventDate ? dateTime(row.lastEventDate) : "-",
        _search: ""
      };
    })
    .sort((a, b) => b.score - a.score || b.quotes - a.quotes || b.carts - a.carts || b.views - a.views)
    .map((row, index) => {
      const formatted = { ...row, position: index + 1 };
      formatted._search = [
        formatted.position,
        formatted.product,
        formatted.views,
        formatted.carts,
        formatted.quotes,
        formatted.score,
        formatted.conversion,
        formatted.lastEvent
      ].join(" ").toLowerCase();
      return formatted;
    });
}

function quotedProductRows(rows) {
  return [...rows]
    .filter((row) => row.quotes > 0)
    .sort((a, b) => b.quotes - a.quotes || b.score - a.score)
    .map((row, index) => ({ ...row, position: index + 1 }));
}

function noResultDemandRows(events) {
  const map = new Map();

  events.forEach((event) => {
    const query = String(event.query || "").trim();
    if (!query) return;
    const key = query.toLowerCase();

    if (!map.has(key)) {
      map.set(key, {
        search: query,
        count: 0,
        companiesSet: new Set(),
        consultantsSet: new Set(),
        lastEventDate: null
      });
    }

    const row = map.get(key);
    row.count += 1;
    row.companiesSet.add(normalizeCompany(event.companyName));
    row.consultantsSet.add(normalizeConsultant(event.consultant).toUpperCase());

    const currentDate = new Date(event.timestamp);
    if (!Number.isNaN(currentDate.getTime()) && (!row.lastEventDate || currentDate > row.lastEventDate)) {
      row.lastEventDate = currentDate;
    }
  });

  return [...map.values()]
    .sort((a, b) => b.count - a.count)
    .map((row, index) => {
      const companyNames = [...row.companiesSet].filter((item) => !isAnonymousCompany(item));
      const companies = row.companiesSet.size;
      const consultants = row.consultantsSet.size;
      const formatted = {
        id: `no-result-${index}-${row.search}`,
        position: index + 1,
        search: row.search,
        count: row.count,
        companies,
        companyList: companyNames.slice(0, 3).join(", ") || "-",
        consultants,
        lastEvent: row.lastEventDate ? dateTime(row.lastEventDate) : "-",
        _search: ""
      };
      formatted._search = [
        formatted.position,
        formatted.search,
        formatted.count,
        formatted.companies,
        formatted.consultants,
        formatted.lastEvent
      ].join(" ").toLowerCase();
      return formatted;
    });
}


function periodLabel(value, customStart = "", customEnd = "") {
  const labels = {
    today: "Hoje",
    yesterday: "Ontem",
    week: "Esta semana",
    month: "Este mês",
    last_month: "Mês anterior",
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    all: "Tudo"
  };
  if (value === "custom") {
    const format = (date) => date ? new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR") : "…";
    return `${format(customStart)} até ${format(customEnd)}`;
  }
  return labels[value] || value;
}

function fileDateStamp() {
  const d = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function slugifyFilePart(value) {
  return String(value || "todos")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "todos";
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadBlob(content, fileName, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function exportRowsCsv({ fileName, columns, rows }) {
  const header = columns.map((column) => column.label);
  const body = rows.map((row) => columns.map((column) => csvEscape(row[column.key] ?? "")).join(";"));
  downloadBlob(["\ufeff" + header.map(csvEscape).join(";"), ...body].join("\n"), fileName, "text/csv;charset=utf-8");
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function excelColumnName(index) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function xlsxStyleIndex(styleId = "") {
  if (styleId === "title") return 1;
  if (styleId === "subtitle") return 2;
  if (styleId === "header") return 3;
  return 0;
}

function xlsxCell(value, rowIndex, columnIndex, styleId = "") {
  const cellRef = `${excelColumnName(columnIndex)}${rowIndex + 1}`;
  const style = xlsxStyleIndex(styleId);
  const styleAttr = style ? ` s="${style}"` : "";
  const raw = value ?? "";

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return `<c r="${cellRef}"${styleAttr}><v>${raw}</v></c>`;
  }

  return `<c r="${cellRef}" t="inlineStr"${styleAttr}><is><t>${xmlEscape(raw)}</t></is></c>`;
}

function xlsxSheetXml(sheet) {
  const rows = sheet.rows || [];
  const sheetData = rows.map((row, rowIndex) => {
    const values = row.values || [];
    const cells = values.map((value, columnIndex) => xlsxCell(value, rowIndex, columnIndex, row.styleId)).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <sheetData>${sheetData}</sheetData>
</worksheet>`;
}

function sanitizeSheetName(name, fallback) {
  return String(name || fallback || "Planilha")
    .slice(0, 31)
    .replace(/[\\/?*[\]:]/g, " ")
    .trim() || fallback || "Planilha";
}

function crc32(bytes) {
  let crc = -1;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value >>> 0, true);
}

function concatUint8Arrays(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  const { dosTime, dosDate } = dosDateTime();
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = typeof file.content === "string" ? encoder.encode(file.content) : file.content;
    const checksum = crc32(contentBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, dosTime);
    writeUint16(localView, 12, dosDate);
    writeUint32(localView, 14, checksum);
    writeUint32(localView, 18, contentBytes.length);
    writeUint32(localView, 22, contentBytes.length);
    writeUint16(localView, 26, nameBytes.length);
    writeUint16(localView, 28, 0);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, dosTime);
    writeUint16(centralView, 14, dosDate);
    writeUint32(centralView, 16, checksum);
    writeUint32(centralView, 20, contentBytes.length);
    writeUint32(centralView, 24, contentBytes.length);
    writeUint16(centralView, 28, nameBytes.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, offset);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + contentBytes.length;
  });

  const centralDirectory = concatUint8Arrays(centralParts);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, files.length);
  writeUint16(endView, 10, files.length);
  writeUint32(endView, 12, centralDirectory.length);
  writeUint32(endView, 16, offset);
  writeUint16(endView, 20, 0);

  return concatUint8Arrays([...localParts, centralDirectory, endRecord]);
}

function buildExcelWorkbook(sheets) {
  const safeSheets = sheets.map((sheet, index) => ({
    ...sheet,
    name: sanitizeSheetName(sheet.name, `Planilha ${index + 1}`)
  }));

  const worksheetOverrides = safeSheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("");

  const workbookSheets = safeSheets.map((sheet, index) =>
    `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  ).join("");

  const workbookRels = safeSheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  ).join("");

  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${worksheetOverrides}
</Types>`
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Z Connect Analytics</dc:creator>
  <cp:lastModifiedBy>Z Connect Analytics</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Z Connect Analytics</Application>
</Properties>`
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${workbookSheets}</sheets>
</workbook>`
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${workbookRels}
  <Relationship Id="rId${safeSheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F2937"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE5E7EB"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`
    },
    ...safeSheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      content: xlsxSheetXml(sheet)
    }))
  ];

  return new Blob([createZip(files)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}
function sheetTitle(title, subtitle = "") {
  const rows = [{ values: [title], styleId: "title" }];
  if (subtitle) rows.push({ values: [subtitle], styleId: "subtitle" });
  rows.push({ values: [] });
  return rows;
}

function tableRows(title, columns, rows) {
  return [
    ...sheetTitle(title),
    { values: columns.map((column) => column.label), styleId: "header" },
    ...rows.map((row) => ({ values: columns.map((column) => row[column.key] ?? "") }))
  ];
}

function rawEventRows(events) {
  const columns = [
    { key: "timestamp", label: "Timestamp" },
    { key: "event", label: "Evento" },
    { key: "companyName", label: "Empresa" },
    { key: "consultant", label: "Consultor" },
    { key: "query", label: "Busca" },
    { key: "productCode", label: "Código" },
    { key: "productName", label: "Produto" },
    { key: "brand", label: "Marca" },
    { key: "quantity", label: "Qtd." },
    { key: "price", label: "Preço" },
    { key: "itemsCount", label: "Itens" },
    { key: "cartTotal", label: "Valor cotado" }
  ];

  return {
    columns,
    rows: events.map((event) => ({
      ...event,
      event: EVENT_LABELS[event.event] || event.event,
      companyName: normalizeCompany(event.companyName),
      consultant: normalizeConsultant(event.consultant).toUpperCase(),
      timestamp: dateTime(event.timestamp),
      productName: productLabel(productFromEvent(event)) === "Produto não informado" ? "" : productLabel(productFromEvent(event)),
      cartTotal: event.cartTotal || event.total ? money(event.cartTotal || event.total) : ""
    }))
  };
}


function sortEventsDesc(events) {
  return [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function resultLabel(event) {
  if (event.event === "search_no_results") return "Sem resultado";
  if (event.resultsCount > 0) return `${event.resultsCount} resultado${event.resultsCount === 1 ? "" : "s"}`;
  return "Com resultado";
}

function eventHistoryRows(events, options = {}) {
  const { expandQuoteProducts = false } = options;

  return sortEventsDesc(events).flatMap((event) => {
    const expandedProducts = expandQuoteProducts && event.event === "whatsapp_quote"
      ? quoteProducts(event)
      : [null];

    return expandedProducts.map((expandedProduct, index) => {
      const product = expandedProduct || productFromEvent(event);
      const isQuote = event.event === "whatsapp_quote";
      const productText = isQuote && !expandedProduct
        ? quoteProductsSummary(event)
        : productLabel(product);
      const quantity = expandedProduct
        ? productQuantity(product, 1)
        : (isQuote ? quoteItemsCount(event) : event.quantity);
      const numericValue = isQuote && !expandedProduct
        ? safeNumber(event.cartTotal || event.total)
        : productValue(product, event);
      const row = {
        id: `${event.id}-${event.timestamp}-${index}`,
        timestamp: event.timestamp,
        dateTime: dateTime(event.timestamp),
        company: event.companyName,
        consultant: event.consultant.toUpperCase(),
        event: EVENT_LABELS[event.event] || event.event,
        product: productText === "Produto não informado" ? "-" : productText,
        search: event.query || "-",
        result: resultLabel(event),
        value: (numericValue || isQuote) ? money(numericValue) : "-",
        quantity: quantity ? String(quantity) : "-",
        items: quoteItemsCount(event) ? String(quoteItemsCount(event)) : "-",
        _search: ""
      };

      row._search = [
        row.dateTime,
        row.company,
        row.consultant,
        row.event,
        row.product,
        row.search,
        row.result,
        row.value,
        row.quantity
      ].join(" ").toLowerCase();

      return row;
    });
  });
}

function companyActivityRows(events) {
  const map = new Map();

  events.forEach((event) => {
    const company = normalizeCompany(event.companyName);
    if (!map.has(company)) {
      map.set(company, {
        company,
        totalActions: 0,
        accesses: 0,
        searches: 0,
        productOpen: 0,
        added: 0,
        quotes: 0,
        quotedItemsQty: 0,
        score: 0,
        quoteTotalNumber: 0,
        lastEventDate: null
      });
    }

    const row = map.get(company);
    row.totalActions += 1;
    row.score += commercialEventScore(event);
    if (event.event === "page_view") row.accesses += 1;
    if (event.event === "search" || event.event === "search_no_results") row.searches += 1;
    if (event.event === "product_open") row.productOpen += 1;
    if (event.event === "add_to_cart") row.added += productQuantity(productFromEvent(event), event.quantity || 1);
    if (event.event === "whatsapp_quote") {
      row.quotes += 1;
      row.quoteTotalNumber += safeNumber(event.cartTotal || event.total);
    }

    const currentDate = new Date(event.timestamp);
    if (!Number.isNaN(currentDate.getTime()) && (!row.lastEventDate || currentDate > row.lastEventDate)) {
      row.lastEventDate = currentDate;
    }
  });

  return [...map.values()]
    .sort((a, b) => b.score - a.score || b.quotes - a.quotes || b.totalActions - a.totalActions)
    .map((row, index) => {
      const quoteRateNumber = row.productOpen ? row.quotes / row.productOpen : 0;
      const formatted = {
        ...row,
        id: `company-${index}-${row.company}`,
        position: index + 1,
        quoteRate: percent(quoteRateNumber),
        quoteTotal: money(row.quoteTotalNumber),
        lastEvent: row.lastEventDate ? dateTime(row.lastEventDate) : "-",
        _search: ""
      };
      formatted._search = [
        formatted.company,
        formatted.totalActions,
        formatted.accesses,
        formatted.searches,
        formatted.productOpen,
        formatted.added,
        formatted.quotes,
        formatted.score,
        formatted.quoteRate,
        formatted.quoteTotal,
        formatted.lastEvent
      ].join(" ").toLowerCase();
      return formatted;
    });
}

function buildCrmRows(events, reservations, crmClients) {
  const metadata = new Map(crmClients.map((client) => [companyKey(client.companyKey || client.companyName), client]));
  const map = new Map();
  const carts = new Map();
  reservations.forEach((item) => {
    const key = companyKey(item.company);
    if (!key) return;
    if (!carts.has(key)) carts.set(key, { reserved: 0, excess: 0, products: new Set() });
    const cart = carts.get(key);
    cart.reserved += item.reservedNumber;
    cart.excess += item.excessNumber;
    if (item.product) cart.products.add(item.product);
  });

  crmClients.forEach((client) => {
    const company = normalizeCompany(client.companyName);
    const key = companyKey(client.companyKey || company);
    if (!key || cleanupReason(company) || map.has(key)) return;
    map.set(key, {
      companyKey: key,
      company,
      consultant: client.owner ? normalizeConsultant(client.owner).toUpperCase() : "SEM_CONSULTOR",
      totalActions: 0,
      accesses: 0,
      searches: 0,
      noResults: 0,
      productOpen: 0,
      added: 0,
      quotes: 0,
      quotedItemsQty: 0,
      quoteTotalNumber: 0,
      score: 0,
      days: new Set(),
      products: new Map(),
      lastEventRaw: ""
    });
  });

  events.forEach((event) => {
    const company = normalizeCompany(event.companyName);
    if (isAnonymousCompany(company) || cleanupReason(company)) return;
    const key = companyKey(company);
    if (!map.has(key)) {
      map.set(key, {
        companyKey: key,
        company,
        consultant: normalizeConsultant(event.consultant).toUpperCase(),
        totalActions: 0,
        accesses: 0,
        searches: 0,
        noResults: 0,
        productOpen: 0,
        added: 0,
        quotes: 0,
        quotedItemsQty: 0,
        quoteTotalNumber: 0,
        score: 0,
        days: new Set(),
        products: new Map(),
        lastEventRaw: ""
      });
    }
    const row = map.get(key);
    row.totalActions++;
    row.score += commercialEventScore(event);
    if (event.event === "page_view") row.accesses++;
    if (event.event === "search" || event.event === "search_no_results") row.searches++;
    if (event.event === "search_no_results") row.noResults++;
    if (event.event === "product_open") row.productOpen++;
    if (event.event === "add_to_cart") row.added += productQuantity(productFromEvent(event), event.quantity || 1);
    if (event.event === "whatsapp_quote") {
      row.quotes++;
      row.quotedItemsQty += quoteItemsCount(event);
      row.quoteTotalNumber += safeNumber(event.cartTotal || event.total);
    }
    const date = new Date(event.timestamp);
    if (!Number.isNaN(date.getTime())) {
      row.days.add(date.toDateString());
      if (!row.lastEventRaw || date > new Date(row.lastEventRaw)) {
        row.lastEventRaw = event.timestamp;
        row.consultant = normalizeConsultant(event.consultant).toUpperCase();
      }
    }
    const product = productFromEvent(event);
    const label = productLabel(product);
    if (label !== "Produto não informado") {
      row.products.set(label, (row.products.get(label) || 0) + Math.max(1, productQuantity(product, 1)));
    }
  });

  reservations.forEach((item) => {
    const company = normalizeCompany(item.company);
    if (isAnonymousCompany(company) || cleanupReason(company)) return;
    const key = companyKey(company);
    if (map.has(key)) return;
    map.set(key, {
      companyKey: key,
      company,
      consultant: normalizeConsultant(item.consultant).toUpperCase(),
      totalActions: 0,
      accesses: 0,
      searches: 0,
      noResults: 0,
      productOpen: 0,
      added: 0,
      quotes: 0,
      quotedItemsQty: 0,
      quoteTotalNumber: 0,
      score: 0,
      days: new Set(),
      products: new Map(),
      lastEventRaw: ""
    });
  });

  return [...map.values()].map((row) => {
    const meta = metadata.get(row.companyKey) || {};
    const cart = carts.get(row.companyKey) || { reserved: 0, excess: 0, products: new Set() };
    const topProducts = [...row.products.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);
    const statusKey = String(meta.status || (cart.reserved ? "negotiation" : row.quotes ? "quoted" : "new"));
    return {
      ...row,
      id: `crm-${row.companyKey}`,
      statusKey,
      status: crmStatusLabel(statusKey),
      phone: String(meta.phone || ""),
      owner: meta.owner ? normalizeConsultant(meta.owner).toUpperCase() : row.consultant,
      nextContactAt: String(meta.nextContactAt || ""),
      nextContact: meta.nextContactAt ? dateOnly(meta.nextContactAt) : "-",
      tags: String(meta.tags || ""),
      notes: String(meta.notes || ""),
      expectedValue: safeNumber(meta.expectedValue),
      lastOutcome: String(meta.lastOutcome || ""),
      lostReason: String(meta.lostReason || ""),
      activeCartQty: cart.reserved,
      cartExcessQty: cart.excess,
      activeCartProducts: [...cart.products].slice(0, 8),
      topProducts,
      itemCount: Math.max(cart.reserved, row.quotedItemsQty, topProducts.length),
      activeDays: row.days.size,
      quoteRate: percent(row.productOpen ? row.quotes / row.productOpen : 0),
      quoteTotal: money(row.quoteTotalNumber),
      lastEvent: row.lastEventRaw ? dateTime(row.lastEventRaw) : "-",
      _search: [row.company, row.consultant, crmStatusLabel(statusKey), meta.tags, ...topProducts].join(" ").toLowerCase()
    };
  }).sort((a, b) => b.score - a.score || new Date(b.lastEventRaw) - new Date(a.lastEventRaw));
}

function buildOpportunityRows(crmRows, events) {
  const eventSignals = new Map();
  events.forEach((event) => {
    const key = companyKey(event.companyName);
    if (!key || cleanupReason(event.companyName)) return;
    if (!eventSignals.has(key)) eventSignals.set(key, { lastAdd: 0, lastQuote: 0, lastNoResult: "", lastProduct: "" });
    const signal = eventSignals.get(key);
    const timestamp = new Date(event.timestamp).getTime() || 0;
    if (event.event === "add_to_cart") signal.lastAdd = Math.max(signal.lastAdd, timestamp);
    if (event.event === "whatsapp_quote") signal.lastQuote = Math.max(signal.lastQuote, timestamp);
    if (event.event === "search_no_results") signal.lastNoResult = event.query || signal.lastNoResult;
    const label = productLabel(productFromEvent(event));
    if (label !== "Produto não informado") signal.lastProduct = label;
  });

  return crmRows.map((client) => {
    const signal = eventSignals.get(client.companyKey) || {};
    let priority = 0;
    let level = "medium";
    let reason = "";
    if (client.cartExcessQty > 0) {
      priority = 110;
      level = "urgent";
      reason = `${client.cartExcessQty} unidade(s) acima do estoque aguardando atendimento`;
    } else if (client.activeCartQty > 0) {
      priority = 100;
      level = "hot";
      reason = `Carrinho ativo com ${client.activeCartQty} unidade(s) reservada(s)`;
    } else if ((signal.lastAdd || 0) > (signal.lastQuote || 0)) {
      priority = 90;
      level = "hot";
      reason = "Adicionou produtos, mas ainda não enviou cotação";
    } else if (signal.lastQuote && Date.now() - signal.lastQuote <= 3 * 86400000) {
      priority = 80;
      level = "high";
      reason = `Cotação recente de ${money(client.quoteTotalNumber)}`;
    } else if (signal.lastNoResult) {
      priority = 70;
      level = "high";
      reason = `Não encontrou: ${signal.lastNoResult}`;
    } else if (client.productOpen >= 3 && !client.quotes) {
      priority = 60;
      reason = `${client.productOpen} produtos abertos sem cotação`;
    } else if (client.lastEventRaw && Date.now() - new Date(client.lastEventRaw).getTime() >= 15 * 86400000) {
      priority = 30;
      level = "cold";
      reason = "Cliente sem atividade há mais de 15 dias";
    }
    return {
      ...client,
      priority,
      level,
      reason,
      interest: client.activeCartProducts[0] || signal.lastProduct || client.topProducts[0] || "-"
    };
  }).filter((row) => row.reason).sort((a, b) => b.priority - a.priority || b.score - a.score);
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
    createdAtLabel: dateTime(activity.createdAt)
  };
}

function buildActionCenterRows(opportunities, tasks, crmRows) {
  const clientMap = new Map(crmRows.map((client) => [client.companyKey, client]));
  const now = new Date();
  const taskRows = tasks.filter((task) => task.status === "open").map((task) => {
    const client = clientMap.get(task.companyKey) || {
      id: `crm-${task.companyKey}`,
      companyKey: task.companyKey,
      company: task.companyName,
      owner: task.owner,
      statusKey: "contact",
      status: crmStatusLabel("contact"),
      topProducts: [],
      activeCartProducts: [],
      quoteTotal: money(0),
      score: 0
    };
    const due = crmContactDate(task.dueAt);
    const overdue = due && due.getTime() < startOfDay(now).getTime();
    const dueToday = due && due.toDateString() === now.toDateString();
    const priority = overdue ? 125 : dueToday ? 115 : task.priority === "urgent" ? 110 : task.priority === "high" ? 95 : 75;
    return {
      ...client,
      id: `action-task-${task.taskId}`,
      actionType: "task",
      taskId: task.taskId,
      dueAt: task.dueAt,
      priority,
      level: overdue ? "urgent" : priority >= 110 ? "hot" : "high",
      reason: overdue ? `Retorno atrasado: ${task.title}` : dueToday ? `Retorno para hoje: ${task.title}` : task.title,
      interest: task.dueAt ? `Prazo: ${dateOnly(task.dueAt)}` : "Sem prazo definido"
    };
  });
  const opportunityActions = opportunities.map((item) => ({ ...item, actionType: "opportunity", id: `action-${item.id}` }));
  return [...taskRows, ...opportunityActions].sort((a, b) => b.priority - a.priority || b.score - a.score);
}

function buildDemandStockRows(events, catalogProducts, reservations) {
  const catalog = new Map(catalogProducts.map((item) => [String(item.productCode || "").trim(), item]));
  const reserved = new Map();
  reservations.forEach((item) => {
    const code = String(item.productCode || "").trim();
    if (code) reserved.set(code, (reserved.get(code) || 0) + safeNumber(item.reservedNumber ?? item.reservedQty));
  });
  const map = new Map();
  function touch(product, type, quantity = 1) {
    const code = String(product?.productCode || product?.code || "").trim();
    if (!code) return;
    if (!map.has(code)) map.set(code, { productCode: code, productName: String(product?.productName || product?.name || ""), views: 0, carts: 0, quotes: 0 });
    const row = map.get(code);
    if (type === "view") row.views += 1;
    if (type === "cart") row.carts += Math.max(1, safeNumber(quantity));
    if (type === "quote") row.quotes += Math.max(1, safeNumber(quantity));
  }
  events.forEach((event) => {
    if (event.event === "product_open") touch(productFromEvent(event), "view");
    if (event.event === "add_to_cart") touch(productFromEvent(event), "cart", event.quantity);
    if (event.event === "whatsapp_quote") quoteProducts(event).forEach((product) => touch(product, "quote", productQuantity(product, 1)));
  });
  return [...map.values()].map((row) => {
    const product = catalog.get(row.productCode) || {};
    const stockQty = safeNumber(product.stockQty);
    const reservedQty = reserved.get(row.productCode) || 0;
    const availableQty = Math.max(0, stockQty - reservedQty);
    const demandScore = row.views + row.carts * 3 + row.quotes * 10;
    const pressure = demandScore && catalog.has(row.productCode) ? demandScore / Math.max(1, availableQty) : 0;
    let signal = "Demanda normal";
    if (!catalog.has(row.productCode)) signal = "Sem snapshot de estoque";
    else if (availableQty <= 0 && demandScore) signal = "Procura sem disponibilidade";
    else if (pressure >= 8) signal = "Reposição prioritária";
    else if (pressure >= 3) signal = "Estoque sob pressão";
    return {
      ...row,
      id: `demand-${row.productCode}`,
      productName: row.productName || product.productName || "Produto sem descrição",
      brand: String(product.brand || ""),
      stockQty,
      reservedQty,
      availableQty,
      demandScore,
      pressure,
      signal,
      _search: [row.productCode, row.productName, product.productName, product.brand, signal].join(" ").toLowerCase()
    };
  }).sort((a, b) => b.pressure - a.pressure || b.demandScore - a.demandScore);
}

function buildAlerts({ actionRows, tasks, reservationKpis, catalogHealth }) {
  const alerts = [];
  const overdue = tasks.filter((task) => task.status === "open" && crmContactDate(task.dueAt) && crmContactDate(task.dueAt) < startOfDay(new Date())).length;
  if (overdue) alerts.push({ level: "urgent", title: `${overdue} retorno(s) atrasado(s)`, detail: "Priorize os clientes com tarefa vencida.", view: "opportunities" });
  if (reservationKpis.excess) alerts.push({ level: "urgent", title: `${reservationKpis.excess} unidade(s) acima do estoque`, detail: "Há clientes aguardando consulta comercial.", view: "carts" });
  if (reservationKpis.carts) alerts.push({ level: "hot", title: `${reservationKpis.carts} carrinho(s) ativo(s)`, detail: "Reservas temporárias estão acontecendo agora.", view: "carts" });
  const urgentActions = actionRows.filter((item) => item.priority >= 100).length;
  if (urgentActions) alerts.push({ level: "high", title: `${urgentActions} oportunidade(s) prioritária(s)`, detail: "A fila comercial está ordenada por urgência.", view: "opportunities" });
  const latest = catalogHealth.latest;
  if (!latest) alerts.push({ level: "medium", title: "Monitor do catálogo aguardando integração", detail: "Envie o primeiro snapshot diário para ativar estoque e saúde da atualização.", view: "catalog" });
  else {
    const age = Date.now() - new Date(latest.createdAt).getTime();
    if (latest.status === "error") alerts.push({ level: "urgent", title: "Última atualização do catálogo falhou", detail: latest.errorMessage || "Confira o processo diário.", view: "catalog" });
    else if (age > 36 * 60 * 60 * 1000) alerts.push({ level: "high", title: "Catálogo sem atualização recente", detail: `Último registro: ${dateTime(latest.createdAt)}.`, view: "catalog" });
    if (safeNumber(latest.missingImageCount)) alerts.push({ level: "medium", title: `${latest.missingImageCount} produto(s) sem imagem`, detail: "Revise a qualidade visual do catálogo.", view: "catalog" });
  }
  return alerts;
}

function buildCleanupCandidates(events) {
  const map = new Map();
  events.forEach((event) => {
    const rawName = String(event.companyRaw ?? event.companyName ?? "").trim();
    const name = normalizeCompany(rawName);
    const reason = cleanupReason(rawName);
    if (!reason) return;
    const key = companyKey(rawName);
    const mapKey = key || "__empty__";
    if (!map.has(mapKey)) map.set(mapKey, { companyKey: key, companyName: name, reason, eventCount: 0, firstAt: "", lastAt: "" });
    const item = map.get(mapKey);
    item.eventCount++;
    if (!item.firstAt || new Date(event.timestamp) < new Date(item.firstAt)) item.firstAt = event.timestamp;
    if (!item.lastAt || new Date(event.timestamp) > new Date(item.lastAt)) item.lastAt = event.timestamp;
  });
  return [...map.values()].sort((a, b) => b.eventCount - a.eventCount);
}

function buildDuplicateCompanyGroups(events) {
  const names = new Map();
  events.forEach((event) => {
    const name = normalizeCompany(event.companyName);
    if (cleanupReason(name)) return;
    if (!names.has(name)) names.set(name, 0);
    names.set(name, names.get(name) + 1);
  });
  const groups = new Map();
  names.forEach((count, name) => {
    const key = duplicateCompanyKey(name);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ name, count, companyKey: companyKey(name) });
  });
  return [...groups.entries()].map(([key, variants]) => {
    const sortedVariants = variants.sort((a, b) => b.count - a.count);
    return {
      key,
      variants: sortedVariants,
      targetName: sortedVariants[0]?.name || ""
    };
  }).filter((group) => group.variants.length > 1);
}

function consultantActivityRows(events) {
  const map = new Map();

  events.forEach((event) => {
    const consultant = normalizeConsultant(event.consultant).toUpperCase();
    if (!map.has(consultant)) {
      map.set(consultant, {
        consultant,
        totalActions: 0,
        accesses: 0,
        searches: 0,
        productOpen: 0,
        quotes: 0,
        score: 0,
        quoteTotalNumber: 0,
        lastEventDate: null
      });
    }

    const row = map.get(consultant);
    row.totalActions += 1;
    row.score += commercialEventScore(event);
    if (event.event === "page_view") row.accesses += 1;
    if (event.event === "search" || event.event === "search_no_results") row.searches += 1;
    if (event.event === "product_open") row.productOpen += 1;
    if (event.event === "whatsapp_quote") {
      row.quotes += 1;
      row.quoteTotalNumber += safeNumber(event.cartTotal || event.total);
    }

    const currentDate = new Date(event.timestamp);
    if (!Number.isNaN(currentDate.getTime()) && (!row.lastEventDate || currentDate > row.lastEventDate)) {
      row.lastEventDate = currentDate;
    }
  });

  return [...map.values()]
    .sort((a, b) => b.score - a.score || b.quotes - a.quotes || b.totalActions - a.totalActions)
    .map((row, index) => {
      const quoteRateNumber = row.productOpen ? row.quotes / row.productOpen : 0;
      const formatted = {
        ...row,
        id: `consultant-${index}-${row.consultant}`,
        position: index + 1,
        quoteRate: percent(quoteRateNumber),
        quoteTotal: money(row.quoteTotalNumber),
        lastEvent: row.lastEventDate ? dateTime(row.lastEventDate) : "-",
        _search: ""
      };
      formatted._search = [
        formatted.consultant,
        formatted.totalActions,
        formatted.accesses,
        formatted.searches,
        formatted.productOpen,
        formatted.quotes,
        formatted.score,
        formatted.quoteRate,
        formatted.quoteTotal,
        formatted.lastEvent
      ].join(" ").toLowerCase();
      return formatted;
    });
}

function dormantCompanyRows(events) {
  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - 30);
  const previousStart = new Date(now);
  previousStart.setDate(previousStart.getDate() - 60);

  const map = new Map();

  events.forEach((event) => {
    const company = normalizeCompany(event.companyName);
    if (isAnonymousCompany(company)) return;

    const eventDate = new Date(event.timestamp);
    if (Number.isNaN(eventDate.getTime()) || eventDate < previousStart) return;

    if (!map.has(company)) {
      map.set(company, {
        company,
        currentScore: 0,
        previousScore: 0,
        currentActions: 0,
        previousActions: 0,
        currentQuotes: 0,
        previousQuotes: 0,
        lastEventDate: null
      });
    }

    const row = map.get(company);
    const score = commercialEventScore(event);

    if (eventDate >= currentStart) {
      row.currentScore += score;
      row.currentActions += 1;
      if (event.event === "whatsapp_quote") row.currentQuotes += 1;
    } else {
      row.previousScore += score;
      row.previousActions += 1;
      if (event.event === "whatsapp_quote") row.previousQuotes += 1;
    }

    if (!row.lastEventDate || eventDate > row.lastEventDate) row.lastEventDate = eventDate;
  });

  return [...map.values()]
    .filter((row) => row.previousScore >= 10 && row.currentScore < row.previousScore)
    .map((row) => {
      const dropNumber = row.previousScore ? (row.previousScore - row.currentScore) / row.previousScore : 0;
      const status = dropNumber >= 0.75 ? "Crítico" : dropNumber >= 0.45 ? "Atenção" : "Monitorar";
      return {
        ...row,
        dropNumber,
        status,
        drop: `-${Math.round(dropNumber * 100)}%`,
        lastEvent: row.lastEventDate ? dateTime(row.lastEventDate) : "-",
        _search: ""
      };
    })
    .sort((a, b) => b.dropNumber - a.dropNumber || b.previousScore - a.previousScore)
    .map((row, index) => {
      const formatted = {
        ...row,
        id: `dormant-${index}-${row.company}`,
        position: index + 1
      };
      formatted._search = [
        formatted.company,
        formatted.status,
        formatted.previousScore,
        formatted.currentScore,
        formatted.drop,
        formatted.previousQuotes,
        formatted.currentQuotes,
        formatted.lastEvent
      ].join(" ").toLowerCase();
      return formatted;
    });
}

function commercialInsightRows({ companyActivity, consultantActivity, dormantCompanies, noResultDemand, commercialProducts }) {
  const insights = [];

  const topCompany = companyActivity.find((row) => !isAnonymousCompany(row.company));
  if (topCompany) {
    insights.push({
      id: "insight-top-company",
      title: "Cliente mais quente",
      value: topCompany.company,
      detail: `${topCompany.score} pontos, ${topCompany.quotes} cotações e ${topCompany.quoteRate} de conversão.`,
      level: "success"
    });
  }

  const topConsultant = consultantActivity[0];
  if (topConsultant) {
    insights.push({
      id: "insight-top-consultant",
      title: "Consultor em destaque",
      value: `${topConsultant.consultant}`,
      detail: `${topConsultant.score} pontos e ${topConsultant.quotes} cotações no filtro atual.`,
      level: "info"
    });
  }

  const topDormant = dormantCompanies[0];
  if (topDormant) {
    insights.push({
      id: "insight-dormant",
      title: "Cliente esfriando",
      value: topDormant.company,
      detail: `Queda de ${topDormant.drop} no score comercial dos últimos 30 dias.`,
      level: "warning"
    });
  }

  const topDemand = noResultDemand[0];
  if (topDemand) {
    insights.push({
      id: "insight-demand",
      title: "Oportunidade de compra",
      value: topDemand.search,
      detail: `${topDemand.count} busca${topDemand.count === 1 ? "" : "s"} sem resultado.`,
      level: "warning"
    });
  }

  const topProduct = commercialProducts[0];
  if (topProduct) {
    insights.push({
      id: "insight-product",
      title: "Produto mais quente",
      value: topProduct.product,
      detail: `${topProduct.score} pontos, ${topProduct.quotes} cotações e ${topProduct.conversion} de conversão.`,
      level: "success"
    });
  }

  return insights;
}

function specialOfferRows(events) {
  const offers = new Map();

  events.forEach((event) => {
    const offerId = String(event.specialOfferId || "").trim();
    if (!offerId) return;

    if (!offers.has(offerId)) {
      offers.set(offerId, {
        id: offerId,
        client: event.specialOfferClient || event.companyName || "Cliente não informado",
        consultant: normalizeConsultant(event.specialOfferSeller || event.consultant).toUpperCase(),
        discountNumber: safeNumber(event.specialOfferDiscount),
        expiresAtRaw: event.specialOfferExpiresAt || "",
        createdAtRaw: event.createdAt || event.timestamp,
        opens: 0,
        quotes: 0,
        quoteTotalNumber: 0
      });
    }

    const row = offers.get(offerId);
    if (event.event === "special_offer_created") {
      row.createdAtRaw = event.createdAt || event.timestamp || row.createdAtRaw;
      row.client = event.specialOfferClient || event.companyName || row.client;
      row.consultant = normalizeConsultant(event.specialOfferSeller || event.consultant).toUpperCase();
      row.discountNumber = safeNumber(event.specialOfferDiscount) || row.discountNumber;
      row.expiresAtRaw = event.specialOfferExpiresAt || row.expiresAtRaw;
    }
    if (event.event === "special_offer_opened") row.opens += 1;
    if (event.event === "whatsapp_quote") {
      row.quotes += 1;
      row.quoteTotalNumber += safeNumber(event.cartTotal || event.total);
    }
  });

  return [...offers.values()]
    .sort((a, b) => new Date(b.createdAtRaw) - new Date(a.createdAtRaw))
    .map((row) => {
      const expires = row.expiresAtRaw ? new Date(row.expiresAtRaw) : null;
      const expired = expires && !Number.isNaN(expires.getTime()) && expires.getTime() < Date.now();
      const formatted = {
        ...row,
        discount: row.discountNumber ? `${row.discountNumber.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%` : "-",
        quoteTotal: money(row.quoteTotalNumber),
        status: expired ? "Expirada" : "Ativa",
        createdAt: dateTime(row.createdAtRaw)
      };
      formatted._search = [formatted.id, formatted.client, formatted.consultant, formatted.status].join(" ").toLowerCase();
      return formatted;
    });
}


function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: user.trim(), password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        if (data.error === "auth_not_configured") throw new Error("Login seguro ainda não configurado na Vercel.");
        throw new Error("Usuário ou senha inválidos.");
      }
      onLogin(data.profile || { username: data.user, displayName: data.user, role: "admin", consultants: ["*"] });
    } catch (loginError) {
      setError(loginError.message || "Não foi possível entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <span>Painel protegido</span>
          <h1>Z Connect Intelligence</h1>
          <p>Informe suas credenciais para acessar o Analytics comercial.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Usuário
            <input
              value={user}
              onChange={(event) => setUser(event.target.value)}
              autoComplete="username"
              placeholder="Digite o usuário"
              autoFocus
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Digite a senha"
            />
          </label>

          {error ? <p className="login-error">{error}</p> : null}

          <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Entrando..." : "Entrar no Analytics"}</button>
        </form>

        <p className="login-note">
          A sessão é protegida no servidor e expira automaticamente. Não existe cadastro público online.
        </p>
      </section>
    </main>
  );
}

function App() {
  const [authStatus, setAuthStatus] = useState("checking");
  const [authProfile, setAuthProfile] = useState({ username: "", displayName: "", role: "", consultants: [] });
  const [events, setEvents] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [crmClients, setCrmClients] = useState([]);
  const [crmTasks, setCrmTasks] = useState([]);
  const [crmActivities, setCrmActivities] = useState([]);
  const [crmSettings, setCrmSettings] = useState({});
  const [catalogHealth, setCatalogHealth] = useState({ snapshots: [], products: [], latest: null });
  const [status, setStatus] = useState("Carregando eventos reais...");
  const [period, setPeriod] = useState("today");
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return localDateInput(date);
  });
  const [dateTo, setDateTo] = useState(() => localDateInput(new Date()));
  const [consultant, setConsultant] = useState("all");
  const [company, setCompany] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("");
  const [resetStatus, setResetStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedCleanupKeys, setSelectedCleanupKeys] = useState([]);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isSavingCrm, setIsSavingCrm] = useState(false);
  const [qualityStatus, setQualityStatus] = useState("");
  const [activeView, setActiveView] = useState("overview");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    let active = true;
    fetch("/api/session", { cache: "no-store" })
      .then(async (response) => ({ response, data: await response.json().catch(() => ({})) }))
      .then(({ response, data }) => {
        if (!active) return;
        if (response.ok && data.authenticated) {
          setAuthProfile(data.profile || { username: data.user || "admin", displayName: data.user || "Administrador", role: "admin", consultants: ["*"] });
          setAuthStatus("authenticated");
        } else {
          setAuthStatus("anonymous");
        }
      })
      .catch(() => { if (active) setAuthStatus("anonymous"); });
    return () => { active = false; };
  }, []);

  async function load(options = {}) {
    const silent = options?.silent === true;
    if (!silent) setStatus("Carregando eventos reais...");
    setIsLoading(true);
    try {
      const [data, activeReservations, savedCrmClients, savedTasks, savedActivities, savedSettings, savedCatalogHealth] = await Promise.all([
        fetchEvents(),
        fetchActiveReservations().catch(() => []),
        fetchCrmClients().catch(() => []),
        fetchCrmTasks().catch(() => []),
        fetchCrmActivities().catch(() => []),
        fetchCrmSettings().catch(() => ({})),
        fetchCatalogHealth().catch(() => ({ snapshots: [], products: [], latest: null }))
      ]);
      setEvents(data);
      setReservations(activeReservations);
      setCrmClients(savedCrmClients);
      setCrmTasks(savedTasks);
      setCrmActivities(savedActivities);
      setCrmSettings(savedSettings);
      setCatalogHealth(savedCatalogHealth);
      setLastUpdatedAt(new Date());
      const activeCarts = new Set(activeReservations.map((item) => item.sessionId)).size;
      setStatus(data.length || activeCarts ? `${data.length} eventos · ${activeCarts} carrinho(s) ativo(s)` : EMPTY_PERIOD_MESSAGE);
    } catch (error) {
      if (error.message === "unauthorized") setAuthStatus("anonymous");
      setEvents([]);
      setReservations([]);
      setCrmClients([]);
      setStatus(error.message || "Não consegui carregar os eventos.");
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(message, type = "success") {
    setToast({ id: Date.now(), message, type });
  }

  useEffect(() => {
    if (authStatus !== "authenticated") return undefined;

    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, [authStatus]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const consultants = useMemo(() => {
    return ["all", ...new Set([
      ...events.map((event) => normalizeConsultant(event.consultant)),
      ...reservations.map((item) => normalizeConsultant(item.consultant))
    ])];
  }, [events, reservations]);

  const companies = useMemo(() => {
    const names = [...new Set([
      ...events.map((event) => normalizeCompany(event.companyName)),
      ...reservations.map((item) => normalizeCompany(item.company))
    ])]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ["all", ...names];
  }, [events, reservations]);

  const periodFiltered = useMemo(() => events.filter((event) => (
    isSamePeriod(event.createdAt, period, dateFrom, dateTo)
  )), [events, period, dateFrom, dateTo]);

  const filtered = useMemo(() => periodFiltered.filter((event) => {
    const okConsultant = consultant === "all" || normalizeConsultant(event.consultant) === consultant;
    const okCompany = company === "all" || normalizeCompany(event.companyName) === company;
    const okEvent = eventFilter === "all" || event.event === eventFilter;
    const productNeedle = productFilter.trim().toLowerCase();
    const productHaystack = [
      event.productCode,
      event.productName,
      event.brand,
      event.query,
      ...quoteProducts(event).flatMap((product) => [product.productCode, product.productName, product.brand])
    ].filter(Boolean).join(" ").toLowerCase();
    const okProduct = !productNeedle || productHaystack.includes(productNeedle);
    return okConsultant && okCompany && okEvent && okProduct;
  }), [periodFiltered, consultant, company, eventFilter, productFilter]);

  const filteredReservations = useMemo(() => reservations.filter((item) => {
    const okConsultant = consultant === "all" || normalizeConsultant(item.consultant) === consultant;
    const okCompany = company === "all" || normalizeCompany(item.company) === company;
    return okConsultant && okCompany;
  }).map((item, index) => ({ ...item, position: index + 1, expires: reservationExpiryLabel(item.expiresAtRaw) })), [reservations, consultant, company, lastUpdatedAt]);

  const reservationKpis = useMemo(() => ({
    carts: new Set(filteredReservations.map((item) => item.sessionId)).size,
    reserved: filteredReservations.reduce((sum, item) => sum + item.reservedNumber, 0),
    excess: filteredReservations.reduce((sum, item) => sum + item.excessNumber, 0),
    quoted: new Set(filteredReservations.filter((item) => item.statusKey === "quoted").map((item) => item.sessionId)).size
  }), [filteredReservations]);

  const activeCartRows = useMemo(() => {
    const carts = new Map();
    filteredReservations.forEach((item) => {
      if (!carts.has(item.sessionId)) {
        carts.set(item.sessionId, {
          id: item.sessionId,
          sessionId: item.sessionId,
          company: item.company,
          consultant: item.consultant,
          products: 0,
          requestedNumber: 0,
          reservedNumber: 0,
          excessNumber: 0,
          quoted: false
        });
      }
      const cart = carts.get(item.sessionId);
      cart.products += 1;
      cart.requestedNumber += item.requestedNumber;
      cart.reservedNumber += item.reservedNumber;
      cart.excessNumber += item.excessNumber;
      cart.quoted = cart.quoted || item.statusKey === "quoted";
    });

    return [...carts.values()].map((cart, index) => {
      const status = cart.quoted ? "Cotação enviada" : "No carrinho";
      return {
        ...cart,
        position: index + 1,
        requested: cart.requestedNumber,
        reserved: cart.reservedNumber,
        excess: cart.excessNumber || "-",
        status,
        _search: [cart.company, cart.consultant, status].join(" ").toLowerCase()
      };
    });
  }, [filteredReservations]);

  const byType = useMemo(() => ({
    pageViews: filtered.filter((event) => event.event === "page_view"),
    searches: filtered.filter((event) => event.event === "search"),
    noResults: filtered.filter((event) => event.event === "search_no_results"),
    productOpen: filtered.filter((event) => event.event === "product_open"),
    added: filtered.filter((event) => event.event === "add_to_cart"),
    removed: filtered.filter((event) => event.event === "remove_from_cart"),
    cleared: filtered.filter((event) => event.event === "clear_cart"),
    quotes: filtered.filter((event) => event.event === "whatsapp_quote")
  }), [filtered]);

  const allSearchEvents = useMemo(() => [...byType.searches, ...byType.noResults], [byType.searches, byType.noResults]);

  const kpis = useMemo(() => ({
    pageViews: byType.pageViews.length,
    searches: byType.searches.length,
    noResults: byType.noResults.length,
    productOpen: byType.productOpen.length,
    added: byType.added.length,
    removed: byType.removed.length,
    cleared: byType.cleared.length,
    quotes: byType.quotes.length,
    quoteTotal: byType.quotes.reduce((sum, event) => sum + safeNumber(event.cartTotal || event.total), 0)
  }), [byType]);

  const companyActiveRank = useMemo(() => countBy(filtered, (event) => normalizeCompany(event.companyName)), [filtered]);
  const companySearchRank = useMemo(() => countBy(allSearchEvents, (event) => normalizeCompany(event.companyName)), [allSearchEvents]);
  const companyQuoteRank = useMemo(() => countBy(byType.quotes, (event) => normalizeCompany(event.companyName)), [byType.quotes]);
  const companyActivity = useMemo(() => companyActivityRows(filtered), [filtered]);
  const crmEventScope = useMemo(() => events.filter((event) => {
    const okConsultant = consultant === "all" || normalizeConsultant(event.consultant) === consultant;
    const okCompany = company === "all" || normalizeCompany(event.companyName) === company;
    return okConsultant && okCompany;
  }), [events, consultant, company]);
  const normalizedTasks = useMemo(() => crmTasks.map(normalizeCrmTask).filter((task) => {
    const okConsultant = consultant === "all" || normalizeConsultant(task.owner) === consultant;
    const okCompany = company === "all" || normalizeCompany(task.companyName) === company;
    return okConsultant && okCompany;
  }), [crmTasks, consultant, company]);
  const normalizedActivities = useMemo(() => crmActivities.map(normalizeCrmActivity).filter((activity) => (
    company === "all" || normalizeCompany(activity.companyName) === company
  )), [crmActivities, company]);
  const crmRows = useMemo(() => buildCrmRows(crmEventScope, filteredReservations, crmClients), [crmEventScope, filteredReservations, crmClients]);
  const opportunityRows = useMemo(() => buildOpportunityRows(crmRows, filtered), [crmRows, filtered]);
  const actionRows = useMemo(() => buildActionCenterRows(opportunityRows, normalizedTasks, crmRows), [opportunityRows, normalizedTasks, crmRows]);
  const demandStockRows = useMemo(() => buildDemandStockRows(filtered, catalogHealth.products || [], filteredReservations), [filtered, catalogHealth.products, filteredReservations]);
  const alerts = useMemo(() => buildAlerts({ actionRows, tasks: normalizedTasks, reservationKpis, catalogHealth }), [actionRows, normalizedTasks, reservationKpis, catalogHealth]);
  const cleanupCandidates = useMemo(() => buildCleanupCandidates(events), [events]);
  const duplicateCompanyGroups = useMemo(() => buildDuplicateCompanyGroups(events), [events]);

  const searchRank = useMemo(() => countBy(allSearchEvents, (event) => event.query.toLowerCase()), [allSearchEvents]);
  const noResultRank = useMemo(() => countBy(byType.noResults, (event) => event.query.toLowerCase()), [byType.noResults]);
  const searchByCompanyRank = useMemo(() => countBy(allSearchEvents, (event) => normalizeCompany(event.companyName)), [allSearchEvents]);

  const productOpenRank = useMemo(() => productRank(byType.productOpen), [byType.productOpen]);
  const productAddedRank = useMemo(() => productRank(byType.added, { weightQuantity: true }), [byType.added]);
  const productRemovedRank = useMemo(() => productRank(byType.removed, { weightQuantity: true }), [byType.removed]);
  const productQuotedRank = useMemo(() => productRank(byType.quotes, { expandQuotes: true, weightQuantity: true }), [byType.quotes]);

  const commercialProducts = useMemo(() => commercialProductRows({
    productOpen: byType.productOpen,
    added: byType.added,
    quotes: byType.quotes
  }), [byType.productOpen, byType.added, byType.quotes]);
  const hotProducts = useMemo(() => commercialProducts.slice(0, 20), [commercialProducts]);
  const quotedProducts = useMemo(() => quotedProductRows(commercialProducts).slice(0, 20), [commercialProducts]);
  const noResultDemand = useMemo(() => noResultDemandRows(byType.noResults).slice(0, 50), [byType.noResults]);

  const consultantAccessRank = useMemo(() => countBy(byType.pageViews, (event) => normalizeConsultant(event.consultant)), [byType.pageViews]);
  const consultantSearchRank = useMemo(() => countBy(allSearchEvents, (event) => normalizeConsultant(event.consultant)), [allSearchEvents]);
  const consultantQuoteRank = useMemo(() => countBy(byType.quotes, (event) => normalizeConsultant(event.consultant)), [byType.quotes]);
  const consultantValueRank = useMemo(() => countBy(byType.quotes, (event) => normalizeConsultant(event.consultant), (event) => event.cartTotal || event.total), [byType.quotes]);
  const consultantActivity = useMemo(() => consultantActivityRows(filtered), [filtered]);

  const activityScope = crmEventScope;

  const dormantCompanies = useMemo(() => dormantCompanyRows(activityScope).slice(0, 20), [activityScope]);
  const commercialInsights = useMemo(() => commercialInsightRows({
    companyActivity,
    consultantActivity,
    dormantCompanies,
    noResultDemand,
    commercialProducts
  }), [companyActivity, consultantActivity, dormantCompanies, noResultDemand, commercialProducts]);
  const offerEvents = useMemo(() => filtered.filter((event) => (
    event.event === "special_offer_created"
    || event.event === "special_offer_opened"
    || (event.event === "whatsapp_quote" && event.specialOfferId)
  )), [filtered]);
  const offers = useMemo(() => specialOfferRows(offerEvents), [offerEvents]);
  const offerCreatedEvents = useMemo(() => filtered.filter((event) => event.event === "special_offer_created"), [filtered]);
  const offerOpenedEvents = useMemo(() => filtered.filter((event) => event.event === "special_offer_opened"), [filtered]);
  const offerQuoteEvents = useMemo(() => byType.quotes.filter((event) => event.specialOfferId), [byType.quotes]);
  const offerQuoteTotal = useMemo(() => offerQuoteEvents.reduce((sum, event) => sum + safeNumber(event.cartTotal || event.total), 0), [offerQuoteEvents]);
  const identifiedCompanies = useMemo(() => new Set(
    filtered.map((event) => normalizeCompany(event.companyName)).filter((name) => !isAnonymousCompany(name) && !cleanupReason(name))
  ).size, [filtered]);
  const monthActivities = useMemo(() => {
    const now = new Date();
    return normalizedActivities.filter((item) => {
      const date = new Date(item.createdAtRaw);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
  }, [normalizedActivities]);
  const wonActivities = useMemo(() => monthActivities.filter((item) => item.type === "won"), [monthActivities]);
  const lostActivities = useMemo(() => monthActivities.filter((item) => item.type === "lost"), [monthActivities]);
  const wonValue = useMemo(() => wonActivities.reduce((sum, item) => sum + item.valueNumber, 0), [wonActivities]);
  const monthlyTarget = safeNumber(crmSettings.monthlyTarget);

  useEffect(() => {
    const availableKeys = cleanupCandidates.map((item) => item.companyKey || "__empty__");
    setSelectedCleanupKeys((current) => {
      const retained = current.filter((key) => availableKeys.includes(key));
      return retained.length ? retained : availableKeys;
    });
  }, [cleanupCandidates]);

  const funnel = [
    ["Acessos", kpis.pageViews],
    ["Buscas", kpis.searches],
    ["Produtos abertos", kpis.productOpen],
    ["Adicionados", kpis.added],
    ["Cotações WhatsApp", kpis.quotes]
  ];
  const quoteConversionRate = kpis.productOpen ? percent(kpis.quotes / kpis.productOpen) : "0%";
  const lastUpdatedLabel = lastUpdatedAt ? timeOnly(lastUpdatedAt) : "--:--";

  function openModal(config = {}) {
    const safeTitle = typeof config.title === "string" && config.title.trim()
      ? config.title.trim()
      : "Detalhes";
    setActiveModal({
      empty: EMPTY_LIST_MESSAGE,
      ...config,
      title: safeTitle,
      id: `${safeTitle}-${Date.now()}`
    });
  }

  function openEventModal(title, sourceEvents, options = {}) {
    const rows = eventHistoryRows(sourceEvents, options);
    openModal({
      title,
      description: options.description || "Histórico completo dentro dos filtros atuais do dashboard.",
      totalLabel: options.totalLabel || `${sourceEvents.length} registros`,
      rows,
      columns: options.columns || EVENT_HISTORY_COLUMNS
    });
  }

  function openSearchModal(title, sourceEvents) {
    openEventModal(title, sourceEvents, {
      columns: SEARCH_HISTORY_COLUMNS,
      totalLabel: `${sourceEvents.length} busca${sourceEvents.length === 1 ? "" : "s"}`
    });
  }

  function openQuoteModal(title = "Cotações WhatsApp") {
    openEventModal(title, byType.quotes, {
      columns: QUOTE_HISTORY_COLUMNS,
      totalLabel: `${byType.quotes.length} cotação${byType.quotes.length === 1 ? "" : "ões"} / ${money(kpis.quoteTotal)}`
    });
  }

  function openReservationsModal(title) {
    const modalTitle = typeof title === "string" && title.trim()
      ? title.trim()
      : "Carrinhos ativos agora";
    openModal({
      title: modalTitle,
      description: "Reservas temporárias do catálogo. Os nomes são visíveis apenas neste painel interno; clientes veem somente quantidades.",
      totalLabel: `${reservationKpis.carts} carrinho(s) · ${reservationKpis.reserved} unidade(s) reservada(s)`,
      rows: filteredReservations,
      columns: RESERVATION_COLUMNS
    });
  }

  function openCompanyModal() {
    openModal({
      title: "Ranking comercial de empresas",
      description: "Score comercial: acesso ×1, busca ×2, produto aberto ×3, carrinho ×5 e cotação WhatsApp ×15.",
      totalLabel: `${filtered.length} ações em ${companyActivity.length} empresa${companyActivity.length === 1 ? "" : "s"}`,
      rows: companyActivity,
      columns: COMPANY_ACTIVITY_COLUMNS,
      filters: { consultant: false }
    });
  }

  function openConsultantModal() {
    openModal({
      title: "Ranking comercial de consultores",
      description: "Score comercial por consultor/link considerando acessos, buscas, produtos abertos e cotações.",
      totalLabel: `${filtered.length} ações em ${consultantActivity.length} consultor${consultantActivity.length === 1 ? "" : "es"}`,
      rows: consultantActivity,
      columns: CONSULTANT_ACTIVITY_COLUMNS,
      filters: { company: false, consultant: false }
    });
  }

  function openDormantCompanyModal() {
    openModal({
      title: "Empresas adormecidas",
      description: "Compara os últimos 30 dias contra os 30 dias anteriores e destaca clientes identificados que perderam atividade comercial.",
      totalLabel: `${dormantCompanies.length} empresa${dormantCompanies.length === 1 ? "" : "s"} com queda de atividade`,
      rows: dormantCompanyRows(activityScope),
      columns: DORMANT_COMPANY_COLUMNS,
      filters: { consultant: false }
    });
  }

  function openHotProductsModal() {
    openModal({
      title: "Produtos mais quentes",
      description: "Score comercial: produto aberto ×1, adicionado ao carrinho ×3 e cotação WhatsApp ×10.",
      totalLabel: `${commercialProducts.length} produto${commercialProducts.length === 1 ? "" : "s"} com sinal comercial`,
      rows: commercialProducts,
      columns: HOT_PRODUCT_COLUMNS,
      filters: { company: false, consultant: false }
    });
  }

  function openQuotedProductsModal() {
    const rows = quotedProductRows(commercialProducts);
    openModal({
      title: "Produtos mais cotados",
      description: "Ranking dos itens com maior quantidade em cotações WhatsApp dentro dos filtros atuais.",
      totalLabel: `${rows.length} produto${rows.length === 1 ? "" : "s"} cotado${rows.length === 1 ? "" : "s"}`,
      rows,
      columns: QUOTED_PRODUCT_COLUMNS,
      filters: { company: false, consultant: false }
    });
  }

  function openNoResultDemandModal() {
    const rows = noResultDemandRows(byType.noResults);
    openModal({
      title: "Demandas sem resultado",
      description: "Termos pesquisados que não retornaram produto. Útil para compra, cadastro e ajuste de busca.",
      totalLabel: `${rows.length} termo${rows.length === 1 ? "" : "s"} sem resultado`,
      rows,
      columns: NO_RESULT_DEMAND_COLUMNS,
      filters: { company: false, consultant: false }
    });
  }

  function openOffersModal() {
    openModal({
      title: "Desempenho das ofertas especiais",
      description: "Da criação do link curto até a abertura e a cotação enviada pelo cliente.",
      totalLabel: `${offers.length} oferta${offers.length === 1 ? "" : "s"}`,
      rows: offers,
      columns: OFFER_COLUMNS,
      filters: { company: false, consultant: false }
    });
  }

  function openClientProfile(client) {
    setSelectedClient(client);
  }

  function openActionClient(client) {
    const initialTab = client.actionType === "task"
      ? "tasks"
      : client.activeCartQty > 0 || client.priority === 90
        ? "cart"
        : client.priority === 70
          ? "interests"
          : "summary";
    setSelectedClient({ ...client, initialTab });
  }

  async function saveClientProfile(form) {
    setIsSavingCrm(true);
    try {
      const saved = await postAnalyticsAction("upsert_crm_client", form);
      const normalized = {
        ...saved.client,
        companyKey: String(saved.client.companyKey || companyKey(form.companyName)),
        companyName: normalizeCompany(saved.client.companyName || form.companyName)
      };
      setCrmClients((current) => [normalized, ...current.filter((item) => companyKey(item.companyKey || item.companyName) !== normalized.companyKey)]);
      setSelectedClient((current) => current ? {
        ...current,
        statusKey: normalized.status,
        status: crmStatusLabel(normalized.status),
        phone: normalized.phone,
        owner: normalized.owner ? normalizeConsultant(normalized.owner).toUpperCase() : current.owner,
        nextContactAt: normalized.nextContactAt,
        nextContact: normalized.nextContactAt ? dateOnly(normalized.nextContactAt) : "-",
        tags: normalized.tags,
        notes: normalized.notes,
        expectedValue: safeNumber(normalized.expectedValue),
        lastOutcome: normalized.lastOutcome,
        lostReason: normalized.lostReason
      } : current);
      showToast("Ficha CRM salva com sucesso.");
      return normalized;
    } catch (error) {
      showToast(error.message || "Não foi possível salvar a ficha CRM.", "error");
      throw error;
    } finally {
      setIsSavingCrm(false);
    }
  }

  async function saveCrmTask(form) {
    try {
      const result = await postAnalyticsAction("upsert_crm_task", form);
      const task = normalizeCrmTask(result.task);
      setCrmTasks((current) => [task, ...current.filter((item) => String(item.taskId || item.id) !== task.taskId)]);
      showToast("Tarefa comercial criada.");
      return task;
    } catch (error) {
      showToast(error.message || "Não foi possível criar a tarefa.", "error");
      throw error;
    }
  }

  async function completeCrmTask(taskId) {
    try {
      await postAnalyticsAction("complete_crm_task", { taskId });
      setCrmTasks((current) => current.map((item) => String(item.taskId || item.id) === taskId ? { ...item, status: "done", completedAt: new Date().toISOString() } : item));
      showToast("Tarefa concluída.");
    } catch (error) {
      showToast(error.message || "Não foi possível concluir a tarefa.", "error");
    }
  }

  async function recordClientOutcome(client, outcome) {
    try {
      const result = await postAnalyticsAction("record_crm_activity", {
        companyKey: client.companyKey,
        companyName: client.company,
        owner: client.owner,
        ...outcome
      });
      const activity = normalizeCrmActivity(result.activity);
      setCrmActivities((current) => [activity, ...current]);
      const status = outcome.type === "won" ? "won" : "lost";
      await saveClientProfile({
        companyKey: client.companyKey,
        companyName: client.company,
        phone: client.phone || "",
        status,
        owner: client.owner || "",
        nextContactAt: client.nextContactAt || "",
        tags: client.tags || "",
        notes: client.notes || "",
        expectedValue: safeNumber(outcome.value || client.expectedValue),
        lastOutcome: outcome.note || (status === "won" ? "Pedido fechado" : "Oportunidade perdida"),
        lostReason: status === "lost" ? outcome.reason || "Outro" : ""
      });
      showToast(status === "won" ? "Venda registrada no resultado do mês." : "Perda registrada para análise.");
    } catch (error) {
      showToast(error.message || "Não foi possível registrar o resultado.", "error");
      throw error;
    }
  }

  async function moveClientStage(client, status) {
    await saveClientProfile({
      companyKey: client.companyKey,
      companyName: client.company,
      phone: client.phone || "",
      status,
      owner: client.owner || "",
      nextContactAt: client.nextContactAt || "",
      tags: client.tags || "",
      notes: client.notes || "",
      expectedValue: client.expectedValue || 0,
      lastOutcome: client.lastOutcome || "",
      lostReason: status === "lost" ? client.lostReason || "Outro" : ""
    });
  }

  async function saveMonthlyTarget(value) {
    try {
      const result = await postAnalyticsAction("update_crm_settings", { settings: { monthlyTarget: safeNumber(value), targetMonth: localDateInput(new Date()).slice(0, 7) } });
      setCrmSettings(result.settings || { ...crmSettings, monthlyTarget: safeNumber(value) });
      showToast("Meta mensal atualizada.");
    } catch (error) {
      showToast(error.message || "Não foi possível salvar a meta.", "error");
    }
  }

  function exportCleanupBackup() {
    const selectedSet = new Set(selectedCleanupKeys);
    const sourceEvents = events.filter((event) => {
      const rawName = String(event.companyRaw ?? event.companyName ?? "").trim();
      const key = companyKey(rawName) || "__empty__";
      return selectedSet.has(key) && cleanupReason(rawName);
    });
    const raw = rawEventRows(sourceEvents);
    exportRowsCsv({
      fileName: `zconnect-backup-limpeza-${fileDateStamp()}.csv`,
      columns: raw.columns,
      rows: raw.rows
    });
    showToast(`Backup CSV gerado com ${sourceEvents.length} eventos.`);
  }

  async function handleSelectiveCleanup() {
    if (!selectedCleanupKeys.length) {
      showToast("Selecione pelo menos uma empresa para limpar.", "error");
      return;
    }
    const selectedCandidates = cleanupCandidates.filter((item) => selectedCleanupKeys.includes(item.companyKey || "__empty__"));
    const totalEvents = selectedCandidates.reduce((sum, item) => sum + item.eventCount, 0);
    const confirmed = window.confirm(`Excluir ${totalEvents} eventos de ${selectedCandidates.length} empresa(s) de teste/não identificadas? Um backup será criado na planilha.`);
    if (!confirmed) return;

    setIsCleaning(true);
    setQualityStatus("Criando backup e removendo somente os registros selecionados...");
    try {
      const result = await postAnalyticsAction("cleanup_selected_companies", {
        companyKeys: selectedCleanupKeys.map((key) => key === "__empty__" ? "" : key)
      });
      setQualityStatus(`${result.removedEvents} eventos removidos. Backup: ${result.backupSheet}.`);
      showToast(`${result.removedEvents} eventos de teste removidos com segurança.`);
      setSelectedCleanupKeys([]);
      setPeriod("all");
      setConsultant("all");
      setCompany("all");
      setEventFilter("all");
      setProductFilter("");
      await load({ silent: true });
    } catch (error) {
      setQualityStatus(error.message || "Falha ao limpar os dados.");
      showToast(error.message || "Falha ao limpar os dados.", "error");
    } finally {
      setIsCleaning(false);
    }
  }

  async function handleMergeDuplicates() {
    const merges = duplicateCompanyGroups.flatMap((group) => group.variants
      .filter((variant) => variant.name !== group.targetName)
      .map((variant) => ({ sourceName: variant.name, targetName: group.targetName })));
    if (!merges.length) return;
    if (!window.confirm(`Unificar ${merges.length} variação(ões) de nomes? Um backup será criado antes da alteração.`)) return;
    setIsCleaning(true);
    setQualityStatus("Criando backup e unificando nomes duplicados...");
    try {
      const result = await postAnalyticsAction("merge_companies", { merges });
      setQualityStatus(`${result.mergedEvents} eventos padronizados. Backup: ${result.backupSheet}.`);
      showToast("Nomes duplicados unificados com segurança.");
      await load({ silent: true });
    } catch (error) {
      setQualityStatus(error.message || "Falha ao unificar empresas.");
      showToast(error.message || "Falha ao unificar empresas.", "error");
    } finally {
      setIsCleaning(false);
    }
  }

  function exportRawCsv() {
    const raw = rawEventRows(filtered);
    exportRowsCsv({
      fileName: `zconnect-eventos-brutos-${period}-${slugifyFilePart(consultant)}-${slugifyFilePart(company)}-${fileDateStamp()}.csv`,
      columns: raw.columns,
      rows: raw.rows
    });
    showToast("CSV bruto exportado.");
  }

  function exportExecutiveReport() {
    const selectedCompany = company === "all" ? "Todas" : company;
    const selectedConsultant = consultant === "all" ? "Todos" : consultant.toUpperCase();
    const nonAnonymousCompanies = companyActivity.filter((row) => !isAnonymousCompany(row.company));
    const topCompany = nonAnonymousCompanies[0];
    const topConsultant = consultantActivity[0];
    const topProduct = commercialProducts[0];
    const topNoResult = noResultDemand[0];
    const raw = rawEventRows(filtered);

    const summaryRows = [
      ...sheetTitle("Z Connect - Relatório Executivo", "Relatório gerado automaticamente pelo dashboard Analytics."),
      { values: ["Gerado em", dateTime(new Date())] },
      { values: ["Período", periodLabel(period, dateFrom, dateTo)] },
      { values: ["Consultor", selectedConsultant] },
      { values: ["Empresa", selectedCompany] },
      { values: ["Eventos considerados", filtered.length] },
      { values: [] },
      { values: ["Indicador", "Valor"], styleId: "header" },
      { values: ["Acessos", kpis.pageViews] },
      { values: ["Buscas", kpis.searches] },
      { values: ["Buscas sem resultado", kpis.noResults] },
      { values: ["Produtos abertos", kpis.productOpen] },
      { values: ["Adicionados ao carrinho", kpis.added] },
      { values: ["Cotações WhatsApp", kpis.quotes] },
      { values: ["Valor cotado", money(kpis.quoteTotal)] },
      { values: ["Taxa busca/acesso", kpis.pageViews ? percent(kpis.searches / kpis.pageViews) : "0%"] },
      { values: ["Taxa cotação/produto aberto", kpis.productOpen ? percent(kpis.quotes / kpis.productOpen) : "0%"] },
      { values: [] },
      { values: ["Destaques", "Valor", "Detalhe"], styleId: "header" },
      { values: ["Cliente mais quente", topCompany?.company || "-", topCompany ? `${topCompany.score} pontos / ${topCompany.quotes} cotações` : "-"] },
      { values: ["Consultor destaque", topConsultant?.consultant || "-", topConsultant ? `${topConsultant.score} pontos / ${topConsultant.quotes} cotações` : "-"] },
      { values: ["Produto mais quente", topProduct?.product || "-", topProduct ? `${topProduct.score} pontos / ${topProduct.quotes} cotações` : "-"] },
      { values: ["Maior demanda sem resultado", topNoResult?.search || "-", topNoResult ? `${topNoResult.count} ocorrências` : "-"] }
    ];

    const chartDataRows = [
      ...sheetTitle("Dados para gráficos", "Base pronta para criar gráficos no Excel."),
      { values: ["Funil", "Quantidade"], styleId: "header" },
      ...funnel.map(([label, value]) => ({ values: [label, value] })),
      { values: [] },
      { values: ["Top 10 produtos quentes", "Score"], styleId: "header" },
      ...commercialProducts.slice(0, 10).map((row) => ({ values: [row.product, row.score] })),
      { values: [] },
      { values: ["Top 10 empresas", "Score"], styleId: "header" },
      ...nonAnonymousCompanies.slice(0, 10).map((row) => ({ values: [row.company, row.score] })),
      { values: [] },
      { values: ["Top 10 consultores", "Score"], styleId: "header" },
      ...consultantActivity.slice(0, 10).map((row) => ({ values: [row.consultant, row.score] }))
    ];

    const sheets = [
      { name: "Resumo Executivo", rows: summaryRows },
      { name: "Produtos Quentes", rows: tableRows("Produtos Mais Quentes", HOT_PRODUCT_COLUMNS, commercialProducts) },
      { name: "Produtos Cotados", rows: tableRows("Produtos Mais Cotados", QUOTED_PRODUCT_COLUMNS, quotedProductRows(commercialProducts)) },
      { name: "Demandas Sem Resultado", rows: tableRows("Demandas Sem Resultado", NO_RESULT_DEMAND_COLUMNS, noResultDemandRows(byType.noResults)) },
      { name: "Empresas", rows: tableRows("Ranking Comercial de Empresas", COMPANY_ACTIVITY_COLUMNS, nonAnonymousCompanies) },
      { name: "Consultores", rows: tableRows("Ranking Comercial de Consultores", CONSULTANT_ACTIVITY_COLUMNS, consultantActivity) },
      { name: "Empresas Adormecidas", rows: tableRows("Empresas Adormecidas", DORMANT_COMPANY_COLUMNS, dormantCompanyRows(activityScope)) },
      { name: "Dados Graficos", rows: chartDataRows },
      { name: "Eventos Brutos", rows: tableRows("Eventos Brutos", raw.columns, raw.rows) }
    ];

    const workbook = buildExcelWorkbook(sheets);
    downloadBlob(
      workbook,
      `zconnect-relatorio-executivo-${period}-${slugifyFilePart(consultant)}-${slugifyFilePart(company)}-${fileDateStamp()}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    showToast("Relatório executivo exportado.");
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => null);
    setAuthStatus("anonymous");
    setAuthProfile({ username: "", displayName: "", role: "", consultants: [] });
    setEvents([]);
    setStatus("Sessão encerrada.");
  }

  async function handleReset() {
    if (isResetting) return;

    setResetStatus("");
    const confirmed = window.confirm("Tem certeza que deseja apagar todos os dados de analytics?");
    if (!confirmed) return;

    try {
      setIsResetting(true);
      setResetStatus("Limpando eventos...");
      await clearEvents("");
      setEvents([]);
      setLastUpdatedAt(new Date());
      setResetStatus(RESET_SUCCESS_MESSAGE);
      setStatus(EMPTY_PERIOD_MESSAGE);
      showToast(RESET_SUCCESS_MESSAGE);
      await load({ silent: true });
    } catch (error) {
      setResetStatus(error.message ? `${RESET_ERROR_MESSAGE} (${error.message})` : RESET_ERROR_MESSAGE);
      showToast(RESET_ERROR_MESSAGE, "error");
    } finally {
      setIsResetting(false);
    }
  }

  if (authStatus === "checking") {
    return <main className="login-page"><section className="login-card auth-checking"><RefreshCw className="spin"/><h1>Validando sessão</h1><p>Preparando a inteligência comercial...</p></section></main>;
  }

  if (authStatus !== "authenticated") {
    return <LoginScreen onLogin={(profile) => { setAuthProfile(profile); setAuthStatus("authenticated"); }} />;
  }

  const isAdminUser = authProfile.role === "admin" || authProfile.consultants?.includes("*");
  const navigation = [
    { id: "overview", label: "Visão geral", icon: <TrendingUp size={17}/> },
    { id: "opportunities", label: "Ações agora", icon: <AlertTriangle size={17}/>, badge: actionRows.filter((item) => item.priority >= 80).length },
    { id: "pipeline", label: "Funil", icon: <Filter size={17}/>, badge: crmRows.filter((item) => !["won", "lost"].includes(item.statusKey)).length },
    { id: "crm", label: "Clientes CRM", icon: <Building2 size={17}/>, badge: crmRows.length },
    { id: "products", label: "Produtos", icon: <Flame size={17}/> },
    { id: "catalog", label: "Catálogo e estoque", icon: <Eye size={17}/>, badge: alerts.filter((item) => item.view === "catalog").length },
    { id: "carts", label: "Carrinhos", icon: <ShoppingCart size={17}/>, badge: reservationKpis.carts },
    { id: "offers", label: "Ofertas", icon: <Send size={17}/>, badge: offers.length },
    ...(isAdminUser ? [{ id: "quality", label: "Qualidade", icon: <Filter size={17}/>, badge: cleanupCandidates.length }] : []),
    { id: "events", label: "Atividade", icon: <UserCheck size={17}/> }
  ];
  const currentView = navigation.find((item) => item.id === activeView) || navigation[0];
  const viewDescriptions = {
    overview: "Os números essenciais para decidir rápido.",
    opportunities: "A fila diária combina retornos, carrinhos, cotações e sinais de compra.",
    pipeline: "Arraste os clientes entre as etapas e acompanhe o avanço comercial.",
    crm: "Histórico, responsável, etapa e próximo contato de cada cliente real.",
    products: "Demanda real, intenção de compra e lacunas do catálogo.",
    catalog: "Saúde da atualização diária, estoque disponível e demanda por reposição.",
    carts: "O que os clientes estão separando agora, com reserva e excedente em tempo real.",
    offers: "Do link especial criado até a cotação enviada.",
    quality: "Limpeza seletiva, prévia e padronização dos dados sem apagar empresas reais.",
    events: "Histórico detalhado dos eventos do catálogo."
  };
  const dueTaskRows = normalizedTasks.filter((item) => item.status === "open" && crmContactDate(item.dueAt) && crmContactDate(item.dueAt).getTime() <= endOfDay(new Date()).getTime());
  const dueFollowUps = dueTaskRows.length;
  const negotiationClients = crmRows.filter((item) => item.statusKey === "negotiation").length;
  const filteredActionRows = actionRows.filter((item) => {
    if (actionFilter === "immediate") return item.priority >= 100;
    if (actionFilter === "cart") return item.actionType === "opportunity" && (item.priority === 90 || item.activeCartQty > 0);
    if (actionFilter === "demand") return item.priority === 70;
    if (actionFilter === "due") return item.actionType === "task" && crmContactDate(item.dueAt)?.getTime() <= endOfDay(new Date()).getTime();
    return true;
  });

  return (
    <main className="app analytics-app">
      <header className="analytics-topbar">
        <div className="analytics-brand">
          <span className="analytics-brand-mark">Z</span>
          <div>
            <small>Inteligência comercial</small>
            <h1>Z Connect</h1>
          </div>
        </div>
        <div className="analytics-top-actions">
          <span className="secure-user"><UserCheck size={14}/> {authProfile.displayName || authProfile.username}<small>{authProfile.role === "representative" ? "Representante" : isAdminUser ? "Administrador" : "Consultor"}</small></span>
          <button type="button" className={`notification-button ${dueFollowUps ? "has-alerts" : ""}`} onClick={() => {
            const task = dueTaskRows[0];
            if (!task) return;
            const client = crmRows.find((row) => row.companyKey === task.companyKey);
            if (client) setSelectedClient({ ...client, initialTab: "tasks" });
          }} title={dueFollowUps ? `${dueFollowUps} retorno(s) para hoje ou vencido(s)` : "Nenhum retorno pendente"}><Bell size={17}/>{dueFollowUps ? <b>{dueFollowUps}</b> : null}</button>
          <button type="button" className="refresh" onClick={() => load()} disabled={isLoading || isResetting}>
            <RefreshCw className={isLoading ? "spin" : undefined} size={16}/>{isLoading ? "Atualizando" : "Atualizar"}
          </button>
          {isAdminUser ? <button type="button" className="refresh" onClick={exportExecutiveReport}><Download size={16}/> Relatório</button> : null}
          <button type="button" className="analytics-logout" onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <section className="analytics-controlbar">
        <div className="analytics-status">
          <i className={isLoading ? "loading" : ""}/>
          <span>{status}</span>
          <small>Atualizado {lastUpdatedLabel}</small>
        </div>
        <div className="analytics-filters">
          <label><CalendarDays size={14}/> Período
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
              <option value="last_month">Mês anterior</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="custom">Escolher datas</option>
              <option value="all">Todo o histórico</option>
            </select>
          </label>
          {period === "custom" ? (
            <div className="custom-date-range">
              <label>De <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)}/></label>
              <label>Até <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)}/></label>
            </div>
          ) : null}
          {isAdminUser ? <label><UserCheck size={14}/> Consultor
            <select value={consultant} onChange={(event) => setConsultant(event.target.value)}>
              {consultants.map((item) => <option key={item} value={item}>{item === "all" ? "Todos" : item.toUpperCase()}</option>)}
            </select>
          </label> : null}
          <label><Building2 size={14}/> Empresa
            <select value={company} onChange={(event) => setCompany(event.target.value)}>
              {companies.map((item) => <option key={item} value={item}>{item === "all" ? "Todas" : item}</option>)}
            </select>
          </label>
          <label><Filter size={14}/> Evento
            <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
              <option value="all">Todos</option>
              {Object.entries(EVENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="product-filter"><Search size={14}/> Produto ou busca
            <input value={productFilter} onChange={(event) => setProductFilter(event.target.value)} placeholder="código, peça ou termo"/>
          </label>
          {(period !== "today" || consultant !== "all" || company !== "all" || eventFilter !== "all" || productFilter) ? (
            <button type="button" className="filter-reset" onClick={() => {
              setPeriod("today"); setConsultant("all"); setCompany("all"); setEventFilter("all"); setProductFilter("");
            }}><X size={14}/> Limpar filtros</button>
          ) : null}
        </div>
      </section>

      <nav className="analytics-nav" aria-label="Áreas do Analytics">
        {navigation.map((item) => (
          <button key={item.id} type="button" className={activeView === item.id ? "active" : ""} onClick={() => setActiveView(item.id)}>
            {item.icon}<span>{item.label}</span>{item.badge ? <b>{item.badge}</b> : null}
          </button>
        ))}
      </nav>

      <section className="analytics-view-head">
        <div><span>Área atual</span><h2>{currentView.label}</h2></div>
        <p>{viewDescriptions[activeView]}</p>
      </section>

      {dueFollowUps ? <button type="button" className="due-task-banner" onClick={() => {
        const task = dueTaskRows[0];
        const client = crmRows.find((row) => row.companyKey === task?.companyKey);
        if (client) setSelectedClient({ ...client, initialTab: "tasks" });
      }}><Bell size={18}/><span><strong>{dueFollowUps} retorno(s) para hoje ou vencido(s)</strong><small>Clique para abrir a próxima tarefa.</small></span><b>Abrir tarefa →</b></button> : null}

      {!["carts", "quality"].includes(activeView) && !filtered.length ? <div className="empty-state">{EMPTY_PERIOD_MESSAGE}</div> : null}

      {activeView === "overview" ? (
        <div className="view-stack">
          <ExecutiveBrief
            urgent={actionRows.filter((item) => item.priority >= 100).length}
            carts={reservationKpis.carts}
            due={dueFollowUps}
            alerts={alerts}
          />
          <StatGrid items={[
            { icon: <AlertTriangle/>, label: "Ações prioritárias", value: actionRows.filter((item) => item.priority >= 100).length, onOpen: () => setActiveView("opportunities"), emphasis: true },
            { icon: <ShoppingCart/>, label: "Carrinhos ativos", value: reservationKpis.carts, onOpen: () => setActiveView("carts") },
            { icon: <CalendarDays/>, label: "Retornos vencidos/hoje", value: dueFollowUps, onOpen: () => setActiveView("opportunities") },
            { icon: <TrendingUp/>, label: "Vendas registradas no mês", value: money(wonValue), emphasis: true }
          ]}/>
          <section className="command-grid">
            <AlertCenter alerts={alerts} onNavigate={setActiveView}/>
            <GoalPanel target={monthlyTarget} result={wonValue} won={wonActivities.length} lost={lostActivities.length} onSave={isAdminUser ? saveMonthlyTarget : null}/>
          </section>
          <OpportunityList rows={actionRows.slice(0, 8)} onOpen={openClientProfile}/>
          <section className="overview-grid">
            <article className="panel decision-panel">
              <div className="panel-head"><h2><TrendingUp size={18}/> Caminho até a cotação</h2><span>{quoteConversionRate} de conversão</span></div>
              <div className="heat funnel-compact">
                {funnel.map(([label, value]) => {
                  const max = Math.max(1, funnel[0][1]);
                  return <div key={label} className="bar-row"><span>{label}</span><div><i style={{width:`${Math.max(4, Math.min(100, (value / max) * 100))}%`}}/></div><b>{value}</b></div>;
                })}
              </div>
            </article>
            <RecentEvents title="Últimas cotações" events={sortEventsDesc(byType.quotes).slice(0, 7)} empty={EMPTY_LIST_MESSAGE} detailFn={(event) => `${quoteItemsCount(event)} itens · ${money(event.cartTotal || event.total)}`} onOpen={() => openQuoteModal("Cotações recentes")}/>
          </section>
          <InsightStrip insights={commercialInsights}/>
          <section className="overview-grid">
            <MetricTable title="Clientes em destaque" subtitle="Atividade comercial no período" rows={companyActivity.filter((row) => !isAnonymousCompany(row.company)).slice(0, 8)} columns={COMPANY_COMMERCIAL_COLUMNS.slice(1, 6)} empty={EMPTY_LIST_MESSAGE} icon={<Building2 size={18}/>} onOpen={openCompanyModal}/>
            <MetricTable title="Equipe comercial" subtitle="Origem das interações e cotações" rows={consultantActivity.slice(0, 8)} columns={CONSULTANT_COMMERCIAL_COLUMNS.slice(1, 6)} empty={EMPTY_LIST_MESSAGE} icon={<UserCheck size={18}/>} onOpen={openConsultantModal}/>
          </section>
        </div>
      ) : null}

      {activeView === "opportunities" ? (
        <div className="view-stack">
          <StatGrid items={[
            { icon: <Flame/>, label: "Ação imediata", value: actionRows.filter((item) => item.priority >= 100).length, emphasis: true, onOpen: () => setActionFilter("immediate") },
            { icon: <ShoppingCart/>, label: "Carrinho sem cotação", value: actionRows.filter((item) => item.actionType === "opportunity" && (item.priority === 90 || item.activeCartQty > 0)).length, onOpen: () => setActionFilter("cart") },
            { icon: <Search/>, label: "Demanda não atendida", value: actionRows.filter((item) => item.priority === 70).length, onOpen: () => setActionFilter("demand") },
            { icon: <CalendarDays/>, label: "Retornos vencidos", value: dueFollowUps, emphasis: true, onOpen: () => setActionFilter("due") }
          ]}/>
          <OpportunityList rows={filteredActionRows} onOpen={openActionClient} activeFilter={actionFilter} onClear={() => setActionFilter("all")}/>
        </div>
      ) : null}

      {activeView === "pipeline" ? (
        <div className="view-stack">
          <StatGrid items={[
            { icon: <Building2/>, label: "Clientes no funil", value: crmRows.length },
            { icon: <Send/>, label: "Cotação enviada", value: crmRows.filter((item) => item.statusKey === "quoted").length },
            { icon: <TrendingUp/>, label: "Em negociação", value: crmRows.filter((item) => item.statusKey === "negotiation").length, emphasis: true },
            { icon: <UserCheck/>, label: "Pedidos fechados", value: crmRows.filter((item) => item.statusKey === "won").length, emphasis: true }
          ]}/>
          <PipelineBoard rows={crmRows} onOpen={openClientProfile} onMove={moveClientStage}/>
        </div>
      ) : null}

      {activeView === "crm" ? (
        <div className="view-stack">
          <StatGrid items={[
            { icon: <Building2/>, label: "Clientes reais", value: crmRows.length },
            { icon: <TrendingUp/>, label: "Em negociação", value: negotiationClients, emphasis: true },
            { icon: <CalendarDays/>, label: "Próximos contatos vencidos", value: dueFollowUps },
            { icon: <Send/>, label: "Valor cotado", value: money(crmRows.reduce((sum, item) => sum + item.quoteTotalNumber, 0)), emphasis: true }
          ]}/>
          <ClientCrmTable rows={crmRows} onOpen={openClientProfile}/>
        </div>
      ) : null}

      {activeView === "products" ? (
        <div className="view-stack">
          <StatGrid items={[
            { icon: <Eye/>, label: "Produtos abertos", value: kpis.productOpen, onOpen: () => openEventModal("Produtos abertos", byType.productOpen) },
            { icon: <ShoppingCart/>, label: "Adicionados", value: kpis.added, onOpen: () => openEventModal("Produtos adicionados", byType.added) },
            { icon: <Send/>, label: "Itens cotados", value: productQuotedRank.length, onOpen: openQuotedProductsModal },
            { icon: <AlertTriangle/>, label: "Buscas sem resultado", value: kpis.noResults, onOpen: openNoResultDemandModal }
          ]}/>
          <ProductIntelligenceView hot={hotProducts} quoted={quotedProducts} missing={noResultDemand} stock={demandStockRows} onOpenHot={openHotProductsModal} onOpenQuoted={openQuotedProductsModal} onOpenMissing={openNoResultDemandModal}/>
        </div>
      ) : null}

      {activeView === "catalog" ? (
        <CatalogHealthView health={catalogHealth} demandRows={demandStockRows} onNavigate={setActiveView}/>
      ) : null}

      {activeView === "carts" ? (
        <div className="view-stack">
          <StatGrid items={[
            { icon: <ShoppingCart/>, label: "Carrinhos ativos", value: reservationKpis.carts, onOpen: openReservationsModal, emphasis: true },
            { icon: <UserCheck/>, label: "Peças reservadas", value: reservationKpis.reserved, onOpen: openReservationsModal },
            { icon: <AlertTriangle/>, label: "Excedente solicitado", value: reservationKpis.excess, onOpen: openReservationsModal },
            { icon: <Send/>, label: "Cotações em andamento", value: reservationKpis.quoted, onOpen: () => openReservationsModal("Cotações em andamento"), emphasis: true }
          ]}/>
          <section className="overview-grid reservations-overview-grid">
            <div className="reservations-table-wrap">
              <MetricTable
                title="Carrinhos ativos"
                subtitle="Uma linha por cliente; clique para ver todos os produtos e quantidades"
                rows={activeCartRows}
                columns={ACTIVE_CART_COLUMNS}
                empty="Nenhum carrinho ativo neste momento."
                icon={<ShoppingCart size={18}/>}
                onOpen={openReservationsModal}
              />
            </div>
            <article className="panel reservation-rules-panel">
              <div className="panel-head"><h2><UserCheck size={18}/> Como ler</h2><span>Atualização automática</span></div>
              <div className="reservation-rule-list">
                <div><i className="active"/><span><strong>No carrinho</strong>Reserva temporária renovada enquanto o cliente está ativo.</span></div>
                <div><i className="quoted"/><span><strong>Cotação enviada</strong>Reserva ampliada para o atendimento comercial.</span></div>
                <div><i className="warning"/><span><strong>Sob consulta</strong>Quantidade pedida acima do estoque disponível; não bloqueia a cotação.</span></div>
              </div>
            </article>
          </section>
        </div>
      ) : null}

      {activeView === "offers" ? (
        <div className="view-stack">
          <StatGrid items={[
            { icon: <Send/>, label: "Ofertas criadas", value: offerCreatedEvents.length, onOpen: openOffersModal },
            { icon: <Eye/>, label: "Aberturas", value: offerOpenedEvents.length, onOpen: openOffersModal },
            { icon: <ShoppingCart/>, label: "Cotações de oferta", value: offerQuoteEvents.length, onOpen: openOffersModal, emphasis: true },
            { icon: <TrendingUp/>, label: "Valor das ofertas", value: money(offerQuoteTotal), onOpen: openOffersModal, emphasis: true }
          ]}/>
          <section className="overview-grid offer-overview-grid">
            <article className="panel decision-panel">
              <div className="panel-head"><h2><TrendingUp size={18}/> Conversão das ofertas</h2><span>{offerOpenedEvents.length ? percent(offerQuoteEvents.length / offerOpenedEvents.length) : "0%"}</span></div>
              <div className="offer-steps">
                <div><span>1</span><strong>Links criados</strong><b>{offerCreatedEvents.length}</b></div>
                <div><span>2</span><strong>Links abertos</strong><b>{offerOpenedEvents.length}</b></div>
                <div><span>3</span><strong>Cotações enviadas</strong><b>{offerQuoteEvents.length}</b></div>
              </div>
            </article>
            <RecentEvents title="Atividade das ofertas" events={sortEventsDesc(offerEvents).slice(0, 8)} empty="Nenhuma oferta especial no período." detailFn={(event) => `${EVENT_LABELS[event.event] || event.event} · ${event.specialOfferId || "-"}`} onOpen={openOffersModal}/>
          </section>
          <div className="offers-table-wrap">
            <MetricTable title="Ofertas por cliente" subtitle="Condição interna, abertura e resultado comercial" rows={offers.slice(0, 30)} columns={OFFER_COLUMNS.slice(0, 7)} empty="Nenhuma oferta registrada neste período." icon={<Send size={18}/>} onOpen={openOffersModal}/>
          </div>
        </div>
      ) : null}

      {activeView === "quality" ? (
        <div className="view-stack quality-view">
          <StatGrid items={[
            { icon: <AlertTriangle/>, label: "Nomes de teste/não identificados", value: cleanupCandidates.length },
            { icon: <Trash2/>, label: "Eventos candidatos", value: cleanupCandidates.reduce((sum, item) => sum + item.eventCount, 0) },
            { icon: <Building2/>, label: "Empresas reais preservadas", value: new Set(events.map((event) => normalizeCompany(event.companyName)).filter((name) => !cleanupReason(name))).size, emphasis: true },
            { icon: <Filter/>, label: "Grupos possivelmente duplicados", value: duplicateCompanyGroups.length }
          ]}/>
          <section className="quality-grid">
            <article className="panel cleanup-panel">
              <div className="panel-head">
                <div><h2><Eraser size={18}/> Limpeza seletiva segura</h2><p>Somente nomes reconhecidos como teste ou acesso não identificado podem ser excluídos.</p></div>
                <span>{selectedCleanupKeys.length} selecionado(s)</span>
              </div>
              <div className="quality-actions">
                <button type="button" className="refresh" onClick={() => setSelectedCleanupKeys(cleanupCandidates.map((item) => item.companyKey || "__empty__"))}>Selecionar todos</button>
                <button type="button" className="refresh" onClick={() => setSelectedCleanupKeys([])}>Desmarcar</button>
                <button type="button" className="refresh" onClick={exportCleanupBackup} disabled={!selectedCleanupKeys.length}><Download size={15}/> Backup CSV</button>
              </div>
              <div className="cleanup-list">
                {cleanupCandidates.length ? cleanupCandidates.map((item) => {
                  const key = item.companyKey || "__empty__";
                  return (
                    <label className="cleanup-row" key={key}>
                      <input type="checkbox" checked={selectedCleanupKeys.includes(key)} onChange={(event) => setSelectedCleanupKeys((current) => event.target.checked ? [...new Set([...current, key])] : current.filter((value) => value !== key))}/>
                      <span><strong>{item.companyName || "Sem empresa informada"}</strong><small>{item.reason} · {dateTime(item.lastAt)}</small></span>
                      <b>{item.eventCount} eventos</b>
                    </label>
                  );
                }) : <EmptyState message="Nenhum dado de teste ou não identificado foi encontrado."/>}
              </div>
              <div className="quality-confirm">
                <span className="secure-operation"><UserCheck size={16}/> Operação protegida pela sessão administrativa</span>
                <button className="danger-button" type="button" onClick={handleSelectiveCleanup} disabled={isCleaning || !selectedCleanupKeys.length}>{isCleaning ? <RefreshCw className="spin" size={17}/> : <Trash2 size={17}/>} Excluir somente selecionados</button>
              </div>
              <p className="quality-note"><strong>Proteção:</strong> antes de excluir, o servidor cria uma aba de backup na planilha. Empresas reais são recusadas mesmo que sejam enviadas por engano.</p>
            </article>

            <article className="panel duplicates-panel">
              <div className="panel-head"><div><h2><Building2 size={18}/> Possíveis duplicidades</h2><p>Variações de pontuação, acento ou razão social.</p></div><span>{duplicateCompanyGroups.length} grupos</span></div>
              <div className="duplicate-list">
                {duplicateCompanyGroups.length ? duplicateCompanyGroups.map((group) => (
                  <div className="duplicate-row" key={group.key}>
                    <strong>Nome principal: {group.targetName}</strong>
                    <span>{group.variants.map((variant) => `${variant.name} (${variant.count})`).join(" · ")}</span>
                  </div>
                )) : <EmptyState message="Nenhuma possível duplicidade detectada."/>}
              </div>
              <button className="refresh merge-button" type="button" onClick={handleMergeDuplicates} disabled={isCleaning || !duplicateCompanyGroups.length}><Filter size={16}/> Unificar nomes sugeridos</button>
              <p className="quality-note">A versão com mais eventos vira o nome principal. Um backup separado também é criado antes dessa alteração.</p>
            </article>
          </section>
          {qualityStatus ? <div className="quality-status" role="status">{qualityStatus}</div> : null}
        </div>
      ) : null}

      {activeView === "events" ? (
        <div className="view-stack">
          <section className="panel">
            <div className="panel-head"><h2><UserCheck size={18}/> Eventos recentes</h2><span>{filtered.length} filtrados</span></div>
            <div className="event-table">
              <div className="event-head"><span>Hora</span><span>Evento</span><span>Empresa</span><span>Consultor</span><span>Detalhe</span></div>
              {sortEventsDesc(filtered).slice(0, 30).map((event) => (
                <div className="event-row" key={`${event.id}-${event.timestamp}`}><span>{dateTime(event.timestamp)}</span><strong>{EVENT_LABELS[event.event] || event.event}</strong><span>{event.companyName}</span><span>{event.consultant.toUpperCase()}</span><span title={eventDetail(event)}>{eventDetail(event)}</span></div>
              ))}
              {!filtered.length ? <p className="empty">{EMPTY_LIST_MESSAGE}</p> : null}
            </div>
          </section>
          <details className="admin-details">
            <summary>Exportação técnica</summary>
            <div className="admin-details-content">
              <button type="button" className="refresh" onClick={exportRawCsv}><Download size={16}/> Exportar CSV bruto</button>
              <small>A limpeza segura e seletiva fica na área Qualidade.</small>
            </div>
          </details>
        </div>
      ) : null}

      {activeModal ? <HistoryModal key={activeModal.id} modal={activeModal} onClose={() => setActiveModal(null)}/> : null}
      {selectedClient ? (
        <ClientProfileModal
          client={selectedClient}
          events={events.filter((event) => companyKey(event.companyName) === selectedClient.companyKey)}
          reservations={reservations.filter((item) => companyKey(item.company) === selectedClient.companyKey)}
          tasks={crmTasks.map(normalizeCrmTask).filter((item) => item.companyKey === selectedClient.companyKey)}
          activities={crmActivities.map(normalizeCrmActivity).filter((item) => item.companyKey === selectedClient.companyKey)}
          onClose={() => setSelectedClient(null)}
          onSave={saveClientProfile}
          onSaveTask={saveCrmTask}
          onCompleteTask={completeCrmTask}
          onOutcome={recordClientOutcome}
          isSaving={isSavingCrm}
        />
      ) : null}
      {toast ? <div className={`toast ${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>{toast.message}</div> : null}
    </main>
  );

}

function SectionTitle({ title, subtitle }) {
  return <div className="section-title"><h2>{title}</h2>{subtitle ? <span>{subtitle}</span> : null}</div>;
}

function cardKeyHandler(onOpen) {
  return (event) => {
    if (!onOpen) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };
}

function Rank({ title, rows = [], empty = EMPTY_LIST_MESSAGE, formatValue = (value) => value, onOpen }) {
  return (
    <article className={`panel ${onOpen ? "clickable-card" : ""}`} role={onOpen ? "button" : undefined} tabIndex={onOpen ? 0 : undefined} onClick={onOpen} onKeyDown={cardKeyHandler(onOpen)}>
      <div className="panel-head"><h2>{title}</h2><span>{rows.length ? `${rows.length} itens` : ""}</span></div>
      <div className="rank">
        {rows.length ? rows.slice(0, 10).map(([name, count], index) => (
          <div className="rank-row" key={`${name}-${index}`}>
            <span className="pos">{index + 1}</span>
            <strong title={name}>{name || "-"}</strong>
            <b>{formatValue(count)}</b>
          </div>
        )) : <EmptyState message={empty} />}
      </div>
    </article>
  );
}

function ExecutiveBrief({ urgent, carts, due, alerts }) {
  const message = urgent
    ? `Hoje existem ${urgent} ação(ões) que merecem atendimento imediato.`
    : carts
      ? `${carts} cliente(s) estão montando carrinho agora; acompanhe antes da reserva expirar.`
      : due
        ? `A prioridade de hoje é concluir ${due} retorno(s) comercial(is).`
        : "A operação está sob controle. Use o momento para reativar clientes e revisar oportunidades.";
  return (
    <section className="executive-brief">
      <div><span>Resumo de hoje</span><h2>{message}</h2><p>{alerts.length ? `${alerts.length} alerta(s) operacional(is) monitorado(s).` : "Nenhuma anomalia crítica detectada."}</p></div>
      <i className={urgent ? "urgent" : "ok"}><TrendingUp size={26}/></i>
    </section>
  );
}

function AlertCenter({ alerts = [], onNavigate }) {
  return (
    <article className="panel alert-center">
      <div className="panel-head"><div><h2><AlertTriangle size={18}/> Alertas que pedem decisão</h2><p>Somente sinais que podem virar venda, atraso ou ruptura.</p></div><span>{alerts.length}</span></div>
      <div className="alert-list">
        {alerts.length ? alerts.slice(0, 6).map((alert, index) => (
          <button type="button" key={`${alert.title}-${index}`} className={`alert-row alert-${alert.level}`} onClick={() => onNavigate(alert.view)}>
            <i/><span><strong>{alert.title}</strong><small>{alert.detail}</small></span><b>Ver →</b>
          </button>
        )) : <EmptyState message="Nenhum alerta operacional no momento."/>}
      </div>
    </article>
  );
}

function GoalPanel({ target = 0, result = 0, won = 0, lost = 0, onSave }) {
  const [value, setValue] = useState(target ? String(target) : "");
  useEffect(() => setValue(target ? String(target) : ""), [target]);
  const progress = target ? Math.min(100, Math.round((result / target) * 100)) : 0;
  return (
    <article className="panel goal-panel">
      <div className="panel-head"><div><h2><TrendingUp size={18}/> Resultado do mês</h2><p>Fechamentos registrados no CRM, sem alterar preços.</p></div><span>{progress}%</span></div>
      <strong className="goal-result">{money(result)}</strong>
      <div className="goal-track"><i style={{ width: `${progress}%` }}/></div>
      <div className="goal-meta"><span><b>{won}</b> ganhos</span><span><b>{lost}</b> perdas</span><span>Meta: <b>{target ? money(target) : "não definida"}</b></span></div>
      {onSave ? <form className="goal-form" onSubmit={(event) => { event.preventDefault(); onSave(value); }}>
        <label>Meta mensal <CurrencyInput value={value} onChange={setValue} placeholder="R$ 100.000,00"/></label>
        <button type="submit">Salvar meta</button>
      </form> : <p className="goal-readonly">Meta definida pela administração.</p>}
    </article>
  );
}

function PipelineBoard({ rows = [], onOpen, onMove }) {
  const [moving, setMoving] = useState("");
  async function move(client, status) {
    if (client.statusKey === status) return;
    setMoving(client.companyKey);
    try { await onMove(client, status); } finally { setMoving(""); }
  }
  return (
    <section className="pipeline-board">
      {PIPELINE_STAGES.map((stage) => {
        const stageRows = rows.filter((row) => row.statusKey === stage.key);
        const stageValue = stageRows.reduce((sum, row) => sum + safeNumber(row.expectedValue || row.quoteTotalNumber), 0);
        return (
          <article className={`pipeline-column stage-${stage.key}`} key={stage.key} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
            event.preventDefault();
            const key = event.dataTransfer.getData("text/plain");
            const client = rows.find((row) => row.companyKey === key);
            if (client) move(client, stage.key);
          }}>
            <header><span>{stage.label}</span><b>{stageRows.length}</b><small>{money(stageValue)}</small></header>
            <div className="pipeline-cards">
              {stageRows.map((client) => (
                <button type="button" draggable key={client.companyKey} className="pipeline-card" onDragStart={(event) => event.dataTransfer.setData("text/plain", client.companyKey)} onClick={() => onOpen(client)} disabled={moving === client.companyKey}>
                  <strong>{client.company}</strong><span>{client.owner || "Sem responsável"}</span><small>{client.itemCount || 0} item(ns)</small><b>{client.expectedValue ? money(client.expectedValue) : client.quoteTotal}</b>
                </button>
              ))}
              {!stageRows.length ? <p className="pipeline-empty">Solte um cliente aqui</p> : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function ProductIntelligenceView({ hot = [], quoted = [], missing = [], stock = [], onOpenHot, onOpenQuoted, onOpenMissing }) {
  const [tab, setTab] = useState("hot");
  const tabs = [
    ["hot", "Mais procurados", hot.length],
    ["quoted", "Mais cotados", quoted.length],
    ["stock", "Demanda x estoque", stock.length],
    ["missing", "Não encontrados", missing.length]
  ];
  const rows = tab === "hot" ? hot : tab === "quoted" ? quoted : tab === "stock" ? stock : missing;
  function splitLabel(label) {
    const text = String(label || "");
    const index = text.indexOf(" - ");
    return index < 0 ? { code: "-", name: text || "-" } : { code: text.slice(0, index), name: text.slice(index + 3) };
  }
  return <article className="panel product-intelligence">
    <div className="panel-head"><div><h2><Flame size={18}/> Inteligência de produtos</h2><p>Uma leitura por vez, com código e descrição sempre visíveis.</p></div><button type="button" className="refresh" onClick={tab === "hot" ? onOpenHot : tab === "quoted" ? onOpenQuoted : tab === "missing" ? onOpenMissing : undefined} disabled={tab === "stock"}>Abrir relatório completo</button></div>
    <nav className="product-tabs">{tabs.map(([key, label, count]) => <button type="button" key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><span>{label}</span><b>{count}</b></button>)}</nav>
    <div className="product-readable-table">
      <div className="product-readable-head"><span>Produto / termo</span><span>{tab === "missing" ? "Ocorrências" : "Aberturas"}</span><span>{tab === "stock" ? "Estoque" : "Carrinhos"}</span><span>{tab === "stock" ? "Disponível" : "Cotações"}</span><span>Sinal</span></div>
      {rows.slice(0, 50).map((row, index) => {
        const label = tab === "missing" ? row.search : tab === "stock" ? `${row.productCode} - ${row.productName}` : row.product;
        const product = splitLabel(label);
        const first = tab === "missing" ? row.count : tab === "stock" ? row.demandScore : row.views;
        const second = tab === "missing" ? row.companies : tab === "stock" ? row.stockQty : row.carts;
        const third = tab === "missing" ? row.consultants : tab === "stock" ? row.availableQty : row.quotes;
        const signal = tab === "missing" ? `${row.companies || 0} empresa(s)` : tab === "stock" ? row.signal : `${row.score || 0} pts`;
        return <div className="product-readable-row" key={row.id || `${label}-${index}`}><span><b>{product.code}</b><small>{product.name}</small></span><strong>{first || 0}</strong><strong>{second || 0}</strong><strong>{third || 0}</strong><em>{signal}</em></div>;
      })}
      {!rows.length ? <EmptyState message="Sem dados para esta leitura no período."/> : null}
    </div>
  </article>;
}

function DemandStockTable({ rows = [] }) {
  return (
    <article className="panel demand-stock-panel">
      <div className="panel-head"><div><h2><Flame size={18}/> Demanda x estoque</h2><p>Combina aberturas, carrinhos, cotações, estoque e reservas ativas.</p></div><span>{rows.length} produto(s)</span></div>
      <div className="demand-stock-table">
        <div className="demand-stock-head"><span>Produto</span><span>Demanda</span><span>Estoque</span><span>Reservado</span><span>Disponível</span><span>Sinal</span></div>
        {rows.length ? rows.map((row) => <div key={row.id} className="demand-stock-row"><span><strong>{row.productCode}</strong><small>{row.productName}</small></span><b>{row.demandScore}</b><b>{row.stockQty}</b><b>{row.reservedQty}</b><b>{row.availableQty}</b><span className={`stock-signal ${row.signal.includes("prioritária") || row.signal.includes("sem disponibilidade") ? "critical" : row.signal.includes("pressão") ? "warning" : "normal"}`}>{row.signal}</span></div>) : <EmptyState message="Aguardando sinais de produto e snapshot do catálogo."/>}
      </div>
    </article>
  );
}

function CatalogHealthView({ health = {}, demandRows = [], onNavigate }) {
  const latest = health.latest;
  const snapshots = health.snapshots || [];
  const age = latest ? Date.now() - new Date(latest.createdAt).getTime() : Infinity;
  const freshness = !latest ? "Aguardando integração" : latest.status === "error" ? "Falha" : age > 36 * 60 * 60 * 1000 ? "Atrasado" : "Atualizado";
  return (
    <div className="view-stack catalog-view">
      <StatGrid items={[
        { icon: <RefreshCw/>, label: "Situação da atualização", value: freshness, emphasis: freshness === "Atualizado" },
        { icon: <Building2/>, label: "Produtos monitorados", value: safeNumber(latest?.productCount) },
        { icon: <ShoppingCart/>, label: "Com estoque", value: safeNumber(latest?.inStockCount) },
        { icon: <AlertTriangle/>, label: "Sem imagem", value: safeNumber(latest?.missingImageCount) }
      ]}/>
      <section className="catalog-grid">
        <article className="panel catalog-summary">
          <div className="panel-head"><div><h2><RefreshCw size={18}/> Atualização diária</h2><p>O catálogo envia o estoque automaticamente após cada publicação na Vercel.</p></div><span className={`health-badge health-${freshness.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{freshness}</span></div>
          {latest ? <><div className="catalog-facts"><div><span>Última execução</span><strong>{dateTime(latest.createdAt)}</strong></div><div><span>Duração</span><strong>{safeNumber(latest.durationMs)} ms</strong></div><div><span>Novos</span><strong>{safeNumber(latest.newCount)}</strong></div><div><span>Removidos</span><strong>{safeNumber(latest.removedCount)}</strong></div><div><span>Estoques alterados</span><strong>{safeNumber(latest.changedStockCount)}</strong></div><div><span>Sem estoque</span><strong>{safeNumber(latest.outOfStockCount)}</strong></div></div><button type="button" className="refresh catalog-action" onClick={() => onNavigate?.("products")}>Analisar produtos e demanda →</button></> : <div className="catalog-integration-empty"><AlertTriangle size={20}/><div><strong>Integração pronta, aguardando a próxima publicação</strong><p>Configure o mesmo <code>CATALOG_SYNC_TOKEN</code> nos dois projetos e faça um novo deploy do Catálogo. O primeiro snapshot será enviado sozinho.</p></div></div>}
        </article>
        <article className="panel snapshot-history">
          <div className="panel-head"><div><h2><CalendarDays size={18}/> Histórico</h2><p>Últimas execuções recebidas.</p></div><span>{snapshots.length}</span></div>
          <div>{snapshots.slice(0, 8).map((item) => <div className="snapshot-row" key={item.snapshotId}><i className={item.status === "error" ? "error" : "success"}/><span><strong>{dateTime(item.createdAt)}</strong><small>{item.source || "Atualização diária"}</small></span><b>{safeNumber(item.productCount)} produtos</b></div>)}{!snapshots.length ? <p className="empty">Sem execuções registradas.</p> : null}</div>
        </article>
      </section>
      <DemandStockTable rows={demandRows.slice(0, 50)}/>
    </div>
  );
}

function OpportunityList({ rows = [], onOpen, activeFilter = "all", onClear }) {
  const [level, setLevel] = useState("all");
  const [query, setQuery] = useState("");
  const visibleRows = rows.filter((row) => {
    const matchesLevel = level === "all" || row.level === level || (level === "priority" && row.priority >= 80);
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [row.company, row.reason, row.interest, row.owner].join(" ").toLowerCase().includes(needle);
    return matchesLevel && matchesQuery;
  });

  return (
    <article className="panel opportunity-panel">
      <div className="panel-head opportunity-head">
        <div><h2><AlertTriangle size={18}/> Fila comercial inteligente</h2><p>Ordenada pela chance e urgência. Abra um cliente para registrar o próximo passo.</p></div>
        <span>{visibleRows.length} oportunidade(s)</span>
      </div>
      {activeFilter !== "all" ? <div className="active-list-filter"><span>Filtro do card aplicado</span><button type="button" onClick={onClear}>Ver todas as ações</button></div> : null}
      <div className="table-tools">
        <label><Search size={14}/> Buscar <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="cliente, peça ou motivo"/></label>
        <label><Filter size={14}/> Prioridade
          <select value={level} onChange={(event) => setLevel(event.target.value)}>
            <option value="all">Todas</option><option value="priority">Alta ou urgente</option><option value="urgent">Urgente</option><option value="hot">Quente</option><option value="high">Alta</option><option value="medium">Média</option><option value="cold">Reativação</option>
          </select>
        </label>
      </div>
      <div className="opportunity-list">
        {visibleRows.length ? visibleRows.map((row) => (
          <button type="button" className="opportunity-row" key={row.id} onClick={() => onOpen(row)}>
            <span className={`priority-dot ${row.level}`}>{row.priority}</span>
            <span className="opportunity-client"><strong>{row.company}</strong><small>{row.owner || "Sem responsável"} · último sinal {row.lastEvent}</small></span>
            <span className="opportunity-reason"><strong>{row.reason}</strong><small>Interesse: {row.interest}</small></span>
            <span className={`crm-status status-${row.statusKey}`}>{row.status}</span>
            <span className="row-open">Ver cliente →</span>
          </button>
        )) : <EmptyState message="Nenhuma oportunidade corresponde aos filtros atuais."/>}
      </div>
    </article>
  );
}

function ClientCrmTable({ rows = [], onOpen }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const visibleRows = rows.filter((row) => {
    const needle = query.trim().toLowerCase();
    return (status === "all" || row.statusKey === status) && (!needle || row._search.includes(needle));
  });

  return (
    <article className="panel crm-table-panel">
      <div className="panel-head">
        <div><h2><Building2 size={18}/> Carteira de clientes</h2><p>Clique em qualquer linha para abrir histórico, anotações e próximo contato.</p></div>
        <span>{visibleRows.length} cliente(s)</span>
      </div>
      <div className="table-tools">
        <label><Search size={14}/> Buscar <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="empresa, responsável ou tag"/></label>
        <label><Filter size={14}/> Etapa
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Todas</option>{PIPELINE_STAGES.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}<option value="active">Cliente ativo</option><option value="cold">Frio</option>
          </select>
        </label>
      </div>
      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead><tr><th>Cliente</th><th>Etapa</th><th>Responsável</th><th>Score</th><th>Carrinho</th><th>Cotações</th><th>Valor cotado</th><th>Próximo contato</th></tr></thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} tabIndex="0" onClick={() => onOpen(row)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(row); }}>
                <td><strong>{row.company}</strong><small>{row.lastEvent}</small></td>
                <td><span className={`crm-status status-${row.statusKey}`}>{row.status}</span></td>
                <td>{row.owner || "-"}</td><td>{row.score}</td><td>{row.activeCartQty || "-"}</td><td>{row.quotes}</td><td>{row.quoteTotal}</td><td>{row.nextContact}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visibleRows.length ? <EmptyState message="Nenhum cliente corresponde aos filtros atuais."/> : null}
      </div>
    </article>
  );
}

function LegacyClientProfileModal({ client, events = [], reservations = [], tasks = [], activities = [], onClose, onSave, onSaveTask, onCompleteTask, onOutcome, isSaving }) {
  const initialContactDate = crmContactDate(client.nextContactAt);
  const initialDate = initialContactDate ? localDateInput(initialContactDate) : "";
  const [form, setForm] = useState({
    companyName: client.company,
    phone: client.phone || "",
    status: client.statusKey || "new",
    owner: client.owner || "",
    nextContactAt: initialDate,
    tags: client.tags || "",
    notes: client.notes || "",
    expectedValue: client.expectedValue || "",
    lastOutcome: client.lastOutcome || "",
    lostReason: client.lostReason || ""
  });
  const [taskForm, setTaskForm] = useState({ title: "Retornar contato", dueAt: localDateInput(new Date()), priority: "normal" });
  const [outcome, setOutcome] = useState({ type: "won", value: client.expectedValue || "", reason: "", note: "" });
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const recentEvents = sortEventsDesc(events).slice(0, 12);
  const products = [...new Set([...client.topProducts, ...reservations.map((item) => item.product).filter(Boolean)])].slice(0, 8);

  useEffect(() => {
    function handleKeyDown(event) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await onSave({ ...form, companyKey: client.companyKey });
    } catch (saveError) {
      setError(saveError.message || "Não foi possível salvar.");
    }
  }

  async function handleTask(event) {
    event.preventDefault();
    setBusyAction("task");
    try {
      await onSaveTask({ ...taskForm, companyKey: client.companyKey, companyName: client.company, owner: form.owner || client.owner });
      setTaskForm((current) => ({ ...current, title: "Retornar contato" }));
    } finally { setBusyAction(""); }
  }

  async function handleOutcome(event) {
    event.preventDefault();
    setBusyAction("outcome");
    try { await onOutcome({ ...client, ...form }, outcome); } finally { setBusyAction(""); }
  }

  const whatsappDigits = String(form.phone || "").replace(/\D/g, "");

  return (
    <div className="modal-backdrop crm-modal-backdrop" onMouseDown={onClose}>
      <section className="client-modal" role="dialog" aria-modal="true" aria-labelledby="client-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="client-modal-header">
          <div><span className="eyebrow">Cliente 360</span><h2 id="client-modal-title">{client.company}</h2><p>{client.owner || "Sem responsável"} · último sinal {client.lastEvent}</p></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar"><X size={18}/></button>
        </header>
        <div className="client-summary-grid">
          <div><span>Score</span><strong>{client.score}</strong></div><div><span>Ações</span><strong>{client.totalActions}</strong></div><div><span>Produtos abertos</span><strong>{client.productOpen}</strong></div><div><span>Cotações</span><strong>{client.quotes}</strong></div><div><span>Valor cotado</span><strong>{client.quoteTotal}</strong></div><div><span>Reservado agora</span><strong>{client.activeCartQty || 0}</strong></div>
        </div>
        <div className="client-modal-body">
          <form className="client-form" onSubmit={handleSubmit}>
            <h3>Dados comerciais</h3>
            <label>Etapa
              <select value={form.status} onChange={(event) => update("status", event.target.value)}>{PIPELINE_STAGES.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</select>
            </label>
            <label>Telefone / WhatsApp <input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="(00) 00000-0000"/></label>
            <label>Responsável <input value={form.owner} onChange={(event) => update("owner", event.target.value)} placeholder="Nome do responsável"/></label>
            <label>Próximo contato <input type="date" value={form.nextContactAt} onChange={(event) => update("nextContactAt", event.target.value)}/></label>
            <label>Valor esperado <input inputMode="decimal" value={form.expectedValue} onChange={(event) => update("expectedValue", event.target.value)} placeholder="Ex.: 2500"/></label>
            <label>Tags <input value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="ex.: funilaria, atacado, prioridade"/></label>
            <label className="notes-label">Anotações <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Contexto da negociação, necessidade e combinado com o cliente."/></label>
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="crm-save" disabled={isSaving}>{isSaving ? <RefreshCw className="spin" size={16}/> : <UserCheck size={16}/>} {isSaving ? "Salvando..." : "Salvar ficha"}</button>
            {whatsappDigits ? <a className="whatsapp-link" href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer"><Send size={16}/> Abrir conversa no WhatsApp</a> : null}
          </form>
          <div className="client-history">
            <section><h3>Interesses principais</h3><div className="tag-list">{products.length ? products.map((product) => <span key={product}>{product}</span>) : <small>Nenhum produto identificado.</small>}</div></section>
            <section className="client-tasks"><h3>Tarefas e retornos</h3>
              <form className="task-form" onSubmit={handleTask}><input value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} required/><input type="date" value={taskForm.dueAt} onChange={(event) => setTaskForm((current) => ({ ...current, dueAt: event.target.value }))}/><select value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select><button disabled={busyAction === "task"}>Adicionar</button></form>
              <div className="task-list">{tasks.filter((task) => task.status === "open").map((task) => <div key={task.taskId}><span><strong>{task.title}</strong><small>{task.dueAt ? dateOnly(task.dueAt) : "Sem prazo"} · {task.owner || "Sem responsável"}</small></span><button type="button" onClick={() => onCompleteTask(task.taskId)}>Concluir</button></div>)}{!tasks.some((task) => task.status === "open") ? <small>Nenhuma tarefa aberta.</small> : null}</div>
            </section>
            <section className="outcome-card"><h3>Registrar resultado</h3><form onSubmit={handleOutcome}><select value={outcome.type} onChange={(event) => setOutcome((current) => ({ ...current, type: event.target.value }))}><option value="won">Pedido fechado</option><option value="lost">Oportunidade perdida</option></select><input inputMode="decimal" value={outcome.value} onChange={(event) => setOutcome((current) => ({ ...current, value: event.target.value }))} placeholder="Valor"/>{outcome.type === "lost" ? <select value={outcome.reason} onChange={(event) => setOutcome((current) => ({ ...current, reason: event.target.value }))} required><option value="">Motivo da perda</option>{LOST_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select> : null}<input value={outcome.note} onChange={(event) => setOutcome((current) => ({ ...current, note: event.target.value }))} placeholder="Observação"/><button disabled={busyAction === "outcome"}>{busyAction === "outcome" ? "Registrando..." : "Registrar"}</button></form></section>
            <section><h3>Linha do tempo</h3><div className="client-timeline">{activities.slice(0, 8).map((activity) => <div key={activity.activityId}><i className={`activity-${activity.type}`}/><span><strong>{activity.type === "won" ? "Pedido fechado" : activity.type === "lost" ? "Perda registrada" : activity.type === "stage_change" ? "Etapa alterada" : "Atividade CRM"}</strong><small>{activity.note || activity.reason || `${crmStatusLabel(activity.stageFrom)} → ${crmStatusLabel(activity.stageTo)}`}</small></span><time>{activity.createdAtLabel}</time></div>)}{recentEvents.map((event) => <div key={`${event.id}-${event.timestamp}`}><i/><span><strong>{EVENT_LABELS[event.event] || event.event}</strong><small>{eventDetail(event)}</small></span><time>{dateTime(event.timestamp)}</time></div>)}{!activities.length && !recentEvents.length ? <EmptyState message="Sem eventos para este cliente."/> : null}</div></section>
          </div>
        </div>
      </section>
    </div>
  );
}

function buildClientInterestRows(events = [], reservations = []) {
  const map = new Map();
  function get(product) {
    const code = productCode(product);
    const name = productName(product);
    const key = `${code}|${name}`;
    if (!code && !name) return null;
    if (!map.has(key)) map.set(key, { id: key, code: code || "-", name: name || "Produto sem descrição", quantity: 0, value: 0, opens: 0, carts: 0, quotes: 0, reserved: 0 });
    return map.get(key);
  }
  events.forEach((event) => {
    const products = event.event === "whatsapp_quote" ? quoteProducts(event) : [productFromEvent(event)];
    products.forEach((product) => {
      const row = get(product);
      if (!row) return;
      if (event.event === "product_open") row.opens += 1;
      if (event.event === "add_to_cart") { const qty = productQuantity(product, event.quantity || 1); row.carts += qty; row.quantity += qty; }
      if (event.event === "whatsapp_quote") { const qty = productQuantity(product, 1); row.quotes += qty; row.quantity += qty; row.value += productValue(product, event); }
    });
  });
  reservations.forEach((reservation) => {
    const row = get({ productCode: reservation.productCode, productName: reservation.product });
    if (!row) return;
    row.reserved += safeNumber(reservation.reservedNumber ?? reservation.reservedQty);
    row.quantity = Math.max(row.quantity, safeNumber(reservation.requestedNumber ?? reservation.requestedQty));
  });
  return [...map.values()].sort((a, b) => b.quotes - a.quotes || b.carts - a.carts || b.opens - a.opens || a.code.localeCompare(b.code, "pt-BR"));
}

function ClientProfileModal({ client, events = [], reservations = [], tasks = [], activities = [], onClose, onSave, onSaveTask, onCompleteTask, onOutcome, isSaving }) {
  const initialContactDate = crmContactDate(client.nextContactAt);
  const [tab, setTab] = useState(client.initialTab || "summary");
  const [form, setForm] = useState({
    companyName: client.company, phone: client.phone || "", status: client.statusKey || "new", owner: client.owner || "",
    nextContactAt: initialContactDate ? localDateInput(initialContactDate) : "", tags: client.tags || "", notes: client.notes || "",
    expectedValue: client.expectedValue || "", lastOutcome: client.lastOutcome || "", lostReason: client.lostReason || ""
  });
  const [taskForm, setTaskForm] = useState({ title: "Retornar contato", dueAt: localDateInput(new Date()), priority: "normal" });
  const [outcome, setOutcome] = useState({ type: "won", value: client.expectedValue || "", reason: "", note: "" });
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const interestRows = useMemo(() => buildClientInterestRows(events, reservations), [events, reservations]);
  const quoteEvents = useMemo(() => sortEventsDesc(events.filter((event) => event.event === "whatsapp_quote")), [events]);
  const timelineEvents = useMemo(() => sortEventsDesc(events).slice(0, 25), [events]);
  const openTasks = tasks.filter((task) => task.status === "open");
  const whatsappDigits = String(form.phone || "").replace(/\D/g, "");

  useEffect(() => {
    function keydown(event) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [onClose]);

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  async function handleSubmit(event) {
    event.preventDefault(); setError("");
    try { await onSave({ ...form, companyKey: client.companyKey }); } catch (saveError) { setError(saveError.message || "Não foi possível salvar."); }
  }
  async function handleTask(event) {
    event.preventDefault(); setBusyAction("task");
    try { await onSaveTask({ ...taskForm, companyKey: client.companyKey, companyName: client.company, owner: form.owner || client.owner }); setTaskForm((current) => ({ ...current, title: "Retornar contato" })); }
    finally { setBusyAction(""); }
  }
  async function handleOutcome(event) {
    event.preventDefault(); setBusyAction("outcome");
    try { await onOutcome({ ...client, ...form }, outcome); } finally { setBusyAction(""); }
  }

  const tabs = [
    ["summary", "Resumo"], ["interests", `Interesses (${interestRows.length})`], ["cart", `Carrinho e cotações (${reservations.length + quoteEvents.length})`],
    ["tasks", `Tarefas (${openTasks.length})`], ["history", "Histórico"]
  ];

  return <div className="modal-backdrop crm-modal-backdrop" onMouseDown={onClose}>
    <section className="client-modal client-modal-v2" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
      <header className="client-modal-header"><div><span className="eyebrow">Cliente 360</span><h2>{client.company}</h2><p>{client.owner || "Sem responsável"} · último sinal {client.lastEvent}</p></div><button type="button" className="modal-close" onClick={onClose}><X size={18}/></button></header>
      <div className="client-summary-grid"><div><span>Score</span><strong>{client.score}</strong></div><div><span>Ações</span><strong>{client.totalActions}</strong></div><div><span>Itens</span><strong>{client.itemCount || interestRows.length}</strong></div><div><span>Cotações</span><strong>{client.quotes}</strong></div><div><span>Valor cotado</span><strong>{client.quoteTotal}</strong></div><div><span>Reservado agora</span><strong>{client.activeCartQty || 0}</strong></div></div>
      <nav className="client-tabs">{tabs.map(([key, label]) => <button key={key} type="button" className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}</nav>
      <div className="client-tab-content">
        {tab === "summary" ? <form className="client-form client-form-v2" onSubmit={handleSubmit}>
          <div className="client-form-grid">
            <label>Etapa<select value={form.status} onChange={(event) => update("status", event.target.value)}>{PIPELINE_STAGES.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</select></label>
            <label>Telefone / WhatsApp<input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="(00) 00000-0000"/></label>
            <label>Responsável<input value={form.owner} onChange={(event) => update("owner", event.target.value)} placeholder="Nome do responsável"/></label>
            <label>Próximo contato<DatePickerField value={form.nextContactAt} onChange={(value) => update("nextContactAt", value)}/></label>
            <label>Valor esperado<CurrencyInput value={form.expectedValue} onChange={(value) => update("expectedValue", value)} placeholder="R$ 2.500,00"/></label>
            <label>Tags<input value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="funilaria, atacado, prioridade"/></label>
            <label className="notes-label">Anotações<textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Contexto da negociação, necessidade e combinado com o cliente."/></label>
          </div>{error ? <p className="form-error">{error}</p> : null}<div className="client-form-actions"><button type="submit" className="crm-save" disabled={isSaving}><UserCheck size={16}/> {isSaving ? "Salvando..." : "Salvar ficha"}</button>{whatsappDigits ? <a className="whatsapp-link" href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer"><Send size={16}/> Abrir WhatsApp</a> : null}</div>
        </form> : null}

        {tab === "interests" ? <section className="client-tab-panel"><div className="tab-panel-head"><div><h3>Interesses principais</h3><p>Produtos organizados por código, descrição, quantidade e valor cotado.</p></div></div><div className="interest-table"><div className="interest-table-head"><span>Código</span><span>Descrição</span><span>Qtd.</span><span>Sinais</span><span>Valor cotado</span></div>{interestRows.map((row) => <div className="interest-table-row" key={row.id}><b>{row.code}</b><span>{row.name}</span><strong>{row.quantity || row.reserved || 1}</strong><small>{row.opens} abertura(s) · {row.carts} carrinho · {row.quotes} cotado(s){row.reserved ? ` · ${row.reserved} reservado(s)` : ""}</small><b>{money(row.value)}</b></div>)}{!interestRows.length ? <EmptyState message="Nenhum produto identificado para este cliente."/> : null}</div></section> : null}

        {tab === "cart" ? <section className="client-tab-panel"><div className="tab-panel-head"><div><h3>Carrinho e cotações</h3><p>O que está reservado agora e o histórico de cotações enviadas.</p></div></div><div className="cart-detail-grid"><article><h4>Reserva ativa</h4>{reservations.map((item, index) => <div className="cart-detail-row" key={`${item.productCode}-${index}`}><span><b>{item.productCode || "-"}</b><small>{item.product || "Produto sem descrição"}</small></span><strong>{safeNumber(item.reservedNumber)} reservada(s)</strong>{safeNumber(item.excessNumber) ? <em>{safeNumber(item.excessNumber)} sob consulta</em> : null}</div>)}{!reservations.length ? <EmptyState message="Nenhum item reservado agora."/> : null}</article><article><h4>Cotações enviadas</h4>{quoteEvents.map((event) => <div className="quote-detail-row" key={`${event.id}-${event.timestamp}`}><span><b>{quoteItemsCount(event)} item(ns) · {money(event.cartTotal || event.total)}</b><small>{quoteProductsSummary(event)}</small></span><time>{dateTime(event.timestamp)}</time></div>)}{!quoteEvents.length ? <EmptyState message="Nenhuma cotação enviada."/> : null}</article></div></section> : null}

        {tab === "tasks" ? <section className="client-tab-panel"><div className="tab-panel-head"><div><h3>Tarefas e retornos</h3><p>Defina o próximo passo e seja avisado quando o prazo chegar.</p></div></div><form className="task-form task-form-v2" onSubmit={handleTask}><label>Ação<input value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} required/></label><label>Data<DatePickerField value={taskForm.dueAt} onChange={(value) => setTaskForm((current) => ({ ...current, dueAt: value }))} required/></label><label>Prioridade<select value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label><button disabled={busyAction === "task"}>Adicionar tarefa</button></form><div className="task-list task-list-v2">{openTasks.map((task) => <div key={task.taskId}><span><strong>{task.title}</strong><small>{task.dueAt ? dateOnly(task.dueAt) : "Sem prazo"} · {task.owner || "Sem responsável"}</small></span><button type="button" onClick={() => onCompleteTask(task.taskId)}>Concluir</button></div>)}{!openTasks.length ? <EmptyState message="Nenhuma tarefa aberta."/> : null}</div><section className="outcome-card"><h3>Registrar resultado</h3><form onSubmit={handleOutcome}><select value={outcome.type} onChange={(event) => setOutcome((current) => ({ ...current, type: event.target.value }))}><option value="won">Pedido fechado</option><option value="lost">Oportunidade perdida</option></select><CurrencyInput value={outcome.value} onChange={(value) => setOutcome((current) => ({ ...current, value }))} placeholder="R$ 0,00"/>{outcome.type === "lost" ? <select value={outcome.reason} onChange={(event) => setOutcome((current) => ({ ...current, reason: event.target.value }))} required><option value="">Motivo da perda</option>{LOST_REASONS.map((reason) => <option key={reason}>{reason}</option>)}</select> : null}<input value={outcome.note} onChange={(event) => setOutcome((current) => ({ ...current, note: event.target.value }))} placeholder="Observação"/><button disabled={busyAction === "outcome"}>{busyAction === "outcome" ? "Registrando..." : "Registrar"}</button></form></section></section> : null}

        {tab === "history" ? <section className="client-tab-panel"><div className="tab-panel-head"><div><h3>Linha do tempo</h3><p>Tarefas, mudanças de etapa, buscas, produtos e cotações.</p></div></div><div className="client-timeline">{activities.slice(0, 15).map((activity) => <div key={activity.activityId}><i className={`activity-${activity.type}`}/><span><strong>{activity.type === "won" ? "Pedido fechado" : activity.type === "lost" ? "Perda registrada" : activity.type === "stage_change" ? "Etapa alterada" : "Atividade CRM"}</strong><small>{activity.note || activity.reason || `${crmStatusLabel(activity.stageFrom)} → ${crmStatusLabel(activity.stageTo)}`}</small></span><time>{activity.createdAtLabel}</time></div>)}{timelineEvents.map((event) => <div key={`${event.id}-${event.timestamp}`}><i/><span><strong>{EVENT_LABELS[event.event] || event.event}</strong><small>{eventDetail(event)}</small></span><time>{dateTime(event.timestamp)}</time></div>)}{!activities.length && !timelineEvents.length ? <EmptyState message="Sem eventos para este cliente."/> : null}</div></section> : null}
      </div>
    </section>
  </div>;
}

function MetricTable({ title, subtitle, rows = [], columns = [], empty = EMPTY_LIST_MESSAGE, icon, onOpen }) {
  return (
    <RankingTable
      title={title}
      subtitle={subtitle}
      rows={rows}
      columns={columns}
      empty={empty}
      icon={icon}
      onOpen={onOpen}
      onKeyDown={cardKeyHandler(onOpen)}
      EmptyStateComponent={EmptyState}
    />
  );
}


function RecentEvents({ events, title = "Buscas recentes", empty = EMPTY_LIST_MESSAGE, detailFn = (event) => event.query || "Busca sem texto", onOpen }) {
  return (
    <article className={`panel ${onOpen ? "clickable-card" : ""}`} role={onOpen ? "button" : undefined} tabIndex={onOpen ? 0 : undefined} onClick={onOpen} onKeyDown={cardKeyHandler(onOpen)}>
      <div className="panel-head"><h2>{title}</h2><span>{events.length ? `${events.length} recentes` : ""}</span></div>
      <div className="timeline">
        {events.length ? events.map((event) => (
          <div className="timeline-row" key={`${event.id}-${event.timestamp}`}>
            <i className={`dot ${event.event}`}/>
            <div>
              <strong>{event.companyName}</strong>
              <span>{detailFn(event)}</span>
            </div>
            <time>{dateTime(event.timestamp)}</time>
          </div>
        )) : <EmptyState message={empty} />}
      </div>
    </article>
  );
}

function HistoryModal({ modal, onClose }) {
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("all");
  const [consultant, setConsultant] = useState("all");

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const hasCompany = modal.filters?.company !== false && modal.rows.some((row) => row.company);
  const hasConsultant = modal.filters?.consultant !== false && modal.rows.some((row) => row.consultant);
  const companyOptions = useMemo(() => {
    const values = [...new Set(modal.rows.map((row) => row.company).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ["all", ...values];
  }, [modal.rows]);
  const consultantOptions = useMemo(() => {
    const values = [...new Set(modal.rows.map((row) => row.consultant).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ["all", ...values];
  }, [modal.rows]);

  const visibleRows = modal.rows.filter((row) => {
    const okQuery = !query.trim() || String(row._search || "").includes(query.trim().toLowerCase());
    const okCompany = !hasCompany || company === "all" || row.company === company;
    const okConsultant = !hasConsultant || consultant === "all" || row.consultant === consultant;
    return okQuery && okCompany && okConsultant;
  });

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="history-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="eyebrow">Histórico</span>
            <h2 id="history-modal-title">{modal.title}</h2>
            {modal.description ? <p>{modal.description}</p> : null}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar modal"><X size={18}/></button>
        </header>

        <div className="modal-summary">
          <strong>{modal.totalLabel || `${modal.rows.length} registros`}</strong>
          <span>{visibleRows.length} na lista filtrada</span>
          <button
            type="button"
            className="modal-export"
            onClick={() => exportRowsCsv({
              fileName: `zconnect-${slugifyFilePart(modal.title)}-${fileDateStamp()}.csv`,
              columns: modal.columns,
              rows: visibleRows
            })}
          >
            <Download size={15}/> Exportar lista
          </button>
        </div>

        <div className="modal-filters">
          <label className="modal-search"><Search size={15}/> Buscar
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="empresa, produto, evento..." />
          </label>
          {hasCompany ? (
            <label><Building2 size={15}/> Empresa
              <select value={company} onChange={(event) => setCompany(event.target.value)}>
                {companyOptions.map((item) => <option key={item} value={item}>{item === "all" ? "Todas" : item}</option>)}
              </select>
            </label>
          ) : null}
          {hasConsultant ? (
            <label><UserCheck size={15}/> Consultor
              <select value={consultant} onChange={(event) => setConsultant(event.target.value)}>
                {consultantOptions.map((item) => <option key={item} value={item}>{item === "all" ? "Todos" : item}</option>)}
              </select>
            </label>
          ) : null}
        </div>

        <div className="modal-table-wrap">
          <table className="modal-table">
            <thead>
              <tr>
                {modal.columns.map((column) => <th key={column.key} className={column.className}>{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id || row.company || row.consultant || row._search}>
                  {modal.columns.map((column) => {
                    const value = row[column.key] ?? "-";
                    return <td key={column.key} className={column.className} title={String(value)}>{value}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleRows.length ? <p className="empty modal-empty">{modal.empty}</p> : null}
        </div>
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
