import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
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

const ANALYTICS_API_URL =
  import.meta.env.VITE_ANALYTICS_API_URL ||
  "https://script.google.com/macros/s/AKfycbxcISxjVLPj5mBz0oem-5FrDjL0fOf2NtX6Ry5prry2AIWce5Tsn2NwRinB2tQKMs0T/exec";

const ADMIN_PIN = String(import.meta.env.VITE_ANALYTICS_ADMIN_PIN || "").trim();
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
  whatsapp_quote: "Cotação WhatsApp"
};

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
  return Number(String(value || "0").replace(/\./g, "").replace(",", ".")) || 0;
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
    companyName: normalizeCompany(readField(row, ["companyName", "empresa", "company", "cliente", "clientName", "nomeEmpresa"])),
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
    resultsCount: safeNumber(readField(row, ["resultsCount", "results", "resultCount"]))
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
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw new Error("Não foi possível carregar os eventos.");
  const text = await response.text();
  try {
    return parseEvents(JSON.parse(text));
  } catch {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(1).map((line) => line.split(","));
    return parseEvents(rows);
  }
}

async function clearEvents(pin) {
  const body = JSON.stringify({ action: "clear_events", pin });
  const readResetError = (data, fallback) => {
    if (data?.error === "invalid_pin") return "PIN inválido.";
    return data?.error || fallback || "Falha ao limpar eventos.";
  };

  try {
    const response = await fetch(ANALYTICS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body
    });
    const data = await response.json();
    if (!data.ok) throw new Error(readResetError(data));
    return data;
  } catch (error) {
    const fallbackUrl = `${ANALYTICS_API_URL}?action=clear_events&pin=${encodeURIComponent(pin || "")}&cache=${Date.now()}`;
    const response = await fetch(fallbackUrl, { method: "GET" });
    const data = await response.json();
    if (!data.ok) throw new Error(readResetError(data, error.message));
    return data;
  }
}

function isSamePeriod(dateLike, selected) {
  if (selected === "all") return true;
  const d = new Date(dateLike);
  const now = new Date();
  if (Number.isNaN(d.getTime())) return false;
  if (selected === "today") return d.toDateString() === now.toDateString();

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


function periodLabel(value) {
  const labels = {
    today: "Hoje",
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    all: "Tudo"
  };
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
      value: topConsultant.consultant,
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

function App() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("Carregando eventos reais...");
  const [period, setPeriod] = useState("today");
  const [consultant, setConsultant] = useState("all");
  const [company, setCompany] = useState("all");
  const [adminPin, setAdminPin] = useState("");
  const [resetStatus, setResetStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  async function load(options = {}) {
    const silent = options?.silent === true;
    if (!silent) setStatus("Carregando eventos reais...");
    setIsLoading(true);
    try {
      const data = await fetchEvents();
      setEvents(data);
      setLastUpdatedAt(new Date());
      setStatus(data.length ? `Eventos carregados: ${data.length}` : EMPTY_PERIOD_MESSAGE);
    } catch (error) {
      setEvents([]);
      setStatus(error.message || "Não consegui carregar os eventos.");
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(message, type = "success") {
    setToast({ id: Date.now(), message, type });
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const consultants = useMemo(() => {
    return ["all", ...new Set(events.map((event) => normalizeConsultant(event.consultant)))];
  }, [events]);

  const companies = useMemo(() => {
    const names = [...new Set(events.map((event) => normalizeCompany(event.companyName)))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ["all", ...names];
  }, [events]);

  const periodFiltered = useMemo(() => events.filter((event) => isSamePeriod(event.createdAt, period)), [events, period]);

  const filtered = useMemo(() => periodFiltered.filter((event) => {
    const okConsultant = consultant === "all" || normalizeConsultant(event.consultant) === consultant;
    const okCompany = company === "all" || normalizeCompany(event.companyName) === company;
    return okConsultant && okCompany;
  }), [periodFiltered, consultant, company]);

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

  const activityScope = useMemo(() => events.filter((event) => {
    const okConsultant = consultant === "all" || normalizeConsultant(event.consultant) === consultant;
    const okCompany = company === "all" || normalizeCompany(event.companyName) === company;
    return okConsultant && okCompany;
  }), [events, consultant, company]);

  const dormantCompanies = useMemo(() => dormantCompanyRows(activityScope).slice(0, 20), [activityScope]);
  const commercialInsights = useMemo(() => commercialInsightRows({
    companyActivity,
    consultantActivity,
    dormantCompanies,
    noResultDemand,
    commercialProducts
  }), [companyActivity, consultantActivity, dormantCompanies, noResultDemand, commercialProducts]);

  const funnel = [
    ["Acessos", kpis.pageViews],
    ["Buscas", kpis.searches],
    ["Produtos abertos", kpis.productOpen],
    ["Adicionados", kpis.added],
    ["Cotações WhatsApp", kpis.quotes]
  ];
  const lastUpdatedLabel = lastUpdatedAt ? timeOnly(lastUpdatedAt) : "--:--";

  function openModal(config) {
    setActiveModal({
      id: `${config.title}-${Date.now()}`,
      empty: EMPTY_LIST_MESSAGE,
      ...config
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
      { values: ["Período", periodLabel(period)] },
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

  async function handleReset() {
    if (isResetting) return;

    setResetStatus("");
    const pinToSend = adminPin.trim();

    if (ADMIN_PIN && !pinToSend) {
      setResetStatus("Informe o PIN admin.");
      return;
    }

    if (ADMIN_PIN && pinToSend !== ADMIN_PIN) {
      setResetStatus("PIN inválido.");
      showToast(RESET_ERROR_MESSAGE, "error");
      return;
    }

    const confirmed = window.confirm("Tem certeza que deseja apagar todos os dados de analytics?");
    if (!confirmed) return;

    try {
      setIsResetting(true);
      setResetStatus("Limpando eventos...");
      await clearEvents(ADMIN_PIN ? pinToSend : "");
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

  return (
    <main className="app">
      <section className="hero">
        <div>
          <span className="eyebrow">Z Connect Analytics</span>
          <h1>Analytics comercial diário</h1>
          <p>Leitura objetiva dos eventos do catálogo por empresa, busca, produto, consultor e cotação.</p>
        </div>
        <div className="hero-actions">
          <button onClick={() => load()} className="refresh" disabled={isLoading || isResetting}>
            <RefreshCw className={isLoading ? "spin" : undefined} size={17}/> {isLoading ? "Atualizando..." : "Atualizar"}
          </button>
          <button onClick={exportExecutiveReport} className="refresh primary-export"><Download size={17}/> Relatório executivo</button>
          <button onClick={exportRawCsv} className="refresh"><Download size={17}/> CSV bruto</button>
        </div>
      </section>

      <section className="toolbar compact-toolbar">
        <div className="status">
          <span>{status}</span>
          <small>Última atualização: {lastUpdatedLabel}</small>
        </div>
        <label><CalendarDays size={15}/> Período
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="today">Hoje</option>
            <option value="7d">7 dias</option>
            <option value="30d">30 dias</option>
            <option value="all">Tudo</option>
          </select>
        </label>
        <label><Filter size={15}/> Consultor
          <select value={consultant} onChange={(event) => setConsultant(event.target.value)}>
            {consultants.map((item) => <option key={item} value={item}>{item === "all" ? "Todos" : item.toUpperCase()}</option>)}
          </select>
        </label>
        <label><Building2 size={15}/> Empresa
          <select value={company} onChange={(event) => setCompany(event.target.value)}>
            {companies.map((item) => <option key={item} value={item}>{item === "all" ? "Todas" : item}</option>)}
          </select>
        </label>
      </section>

      {!filtered.length ? <div className="empty-state">{EMPTY_PERIOD_MESSAGE}</div> : null}

      <SectionTitle title="Visão geral" subtitle="Resumo do período filtrado" />
      <section className="kpi-grid">
        <Kpi icon={<Users/>} label="Acessos" value={kpis.pageViews} onOpen={() => openEventModal("Acessos", byType.pageViews)}/>
        <Kpi icon={<Search/>} label="Buscas" value={kpis.searches} onOpen={() => openSearchModal("Buscas", byType.searches)}/>
        <Kpi icon={<AlertTriangle/>} label="Sem resultado" value={kpis.noResults} onOpen={() => openSearchModal("Buscas sem resultado", byType.noResults)}/>
        <Kpi icon={<Eye/>} label="Produtos abertos" value={kpis.productOpen} onOpen={() => openEventModal("Produtos abertos", byType.productOpen)}/>
        <Kpi icon={<ShoppingCart/>} label="Adicionados" value={kpis.added} onOpen={() => openEventModal("Produtos adicionados", byType.added)}/>
        <Kpi icon={<XCircle/>} label="Removidos" value={kpis.removed} onOpen={() => openEventModal("Produtos removidos", byType.removed)}/>
        <Kpi icon={<Trash2/>} label="Carrinhos limpos" value={kpis.cleared} onOpen={() => openEventModal("Carrinhos limpos", byType.cleared)}/>
        <Kpi icon={<Send/>} label="Cotações WhatsApp" value={kpis.quotes} onOpen={() => openQuoteModal()}/>
      </section>

      <SectionTitle title="Funil" subtitle="Do acesso até a cotação" />
      <section className="main-grid funnel-grid">
        <article className="panel">
          <div className="panel-head">
            <h2><TrendingUp size={18}/> Funil</h2>
            <span>Acesso até cotação</span>
          </div>
          <div className="heat funnel-compact">
            {funnel.map(([label, value]) => {
              const max = Math.max(1, funnel[0][1]);
              return <div key={label} className="bar-row"><span>{label}</span><div><i style={{width:`${Math.max(4, Math.min(100, (value / max) * 100))}%`}}/></div><b>{value}</b></div>;
            })}
          </div>
        </article>
        <ValueCard title="Valor cotado" value={money(kpis.quoteTotal)} sub={`${kpis.quotes} cotações WhatsApp no filtro atual`} icon={<Send/>} onOpen={() => openQuoteModal("Valor cotado")}/>
      </section>

      <SectionTitle title="Empresas" subtitle="Quem mais movimenta o catálogo" />
      <section className="columns">
        <Rank title="Clientes mais ativos" rows={companyActiveRank} empty={EMPTY_LIST_MESSAGE} onOpen={openCompanyModal}/>
        <Rank title="Clientes que mais pesquisaram" rows={companySearchRank} empty={EMPTY_LIST_MESSAGE} onOpen={() => openSearchModal("Buscas por empresa", allSearchEvents)}/>
        <Rank title="Clientes que mais enviaram cotações" rows={companyQuoteRank} empty={EMPTY_LIST_MESSAGE} onOpen={() => openQuoteModal("Cotações por empresa")}/>
        <ValueCard title="Valor total cotado" value={money(kpis.quoteTotal)} sub={`${kpis.quotes} cotações WhatsApp`} icon={<Send/>} onOpen={() => openQuoteModal("Valor total cotado")}/>
      </section>

      <SectionTitle title="Inteligência comercial P1.2" subtitle="Ranking de clientes, consultores e clientes esfriando" />
      <InsightStrip insights={commercialInsights} />
      <section className="commercial-grid">
        <MetricTable
          title="Ranking de empresas"
          subtitle="Score = acesso×1 + busca×2 + produto×3 + carrinho×5 + cotação×15"
          rows={companyActivity.filter((row) => !isAnonymousCompany(row.company)).slice(0, 20)}
          columns={COMPANY_COMMERCIAL_COLUMNS.slice(1, 7)}
          empty={EMPTY_LIST_MESSAGE}
          icon={<Building2 size={18}/>}
          onOpen={openCompanyModal}
        />
        <MetricTable
          title="Empresas adormecidas"
          subtitle="Queda dos últimos 30 dias contra os 30 dias anteriores"
          rows={dormantCompanies}
          columns={DORMANT_COMPANY_COLUMNS.slice(1, 6)}
          empty="Nenhuma empresa adormecida encontrada."
          icon={<AlertTriangle size={18}/>}
          onOpen={openDormantCompanyModal}
        />
        <MetricTable
          title="Ranking de consultores"
          subtitle="Performance por consultor/link no filtro atual"
          rows={consultantActivity.slice(0, 20)}
          columns={CONSULTANT_COMMERCIAL_COLUMNS.slice(1, 7)}
          empty={EMPTY_LIST_MESSAGE}
          icon={<UserCheck size={18}/>}
          onOpen={openConsultantModal}
        />
      </section>

      <SectionTitle title="Buscas" subtitle="Demanda declarada e oportunidades sem resultado" />
      <section className="columns">
        <Rank title="Top buscas" rows={searchRank} empty={EMPTY_LIST_MESSAGE} onOpen={() => openSearchModal("Top buscas", allSearchEvents)}/>
        <Rank title="Buscas sem resultado" rows={noResultRank} empty={EMPTY_LIST_MESSAGE} onOpen={() => openSearchModal("Buscas sem resultado", byType.noResults)}/>
        <Rank title="Buscas por empresa" rows={searchByCompanyRank} empty={EMPTY_LIST_MESSAGE} onOpen={() => openSearchModal("Buscas por empresa", allSearchEvents)}/>
        <RecentEvents events={sortEventsDesc(allSearchEvents).slice(0, 10)} empty={EMPTY_LIST_MESSAGE} onOpen={() => openSearchModal("Buscas recentes", allSearchEvents)} />
      </section>

      <SectionTitle title="Inteligência comercial P1.1" subtitle="Ranking de demanda, cotação e oportunidades de compra" />
      <section className="commercial-grid">
        <MetricTable
          title="Produtos mais quentes"
          subtitle="Score = aberturas + carrinhos×3 + cotações×10"
          rows={hotProducts}
          columns={HOT_PRODUCT_COLUMNS.slice(1, 6)}
          empty={EMPTY_LIST_MESSAGE}
          icon={<Flame size={18}/>}
          onOpen={openHotProductsModal}
        />
        <MetricTable
          title="Produtos mais cotados"
          subtitle="Itens com maior sinal comercial via WhatsApp"
          rows={quotedProducts}
          columns={QUOTED_PRODUCT_COLUMNS.slice(1, 4)}
          empty={EMPTY_LIST_MESSAGE}
          icon={<Send size={18}/>}
          onOpen={openQuotedProductsModal}
        />
        <MetricTable
          title="Demandas sem resultado"
          subtitle="Buscas que viraram oportunidade de estoque/cadastro"
          rows={noResultDemand.slice(0, 20)}
          columns={NO_RESULT_DEMAND_COLUMNS.slice(1, 4)}
          empty={EMPTY_LIST_MESSAGE}
          icon={<AlertTriangle size={18}/>}
          onOpen={openNoResultDemandModal}
        />
      </section>

      <SectionTitle title="Produtos" subtitle="Interesse, carrinho e itens cotados" />
      <section className="columns">
        <Rank title="Produtos mais abertos" rows={productOpenRank} empty={EMPTY_LIST_MESSAGE} onOpen={() => openEventModal("Produtos mais abertos", byType.productOpen)}/>
        <Rank title="Produtos mais adicionados" rows={productAddedRank} empty={EMPTY_LIST_MESSAGE} onOpen={() => openEventModal("Produtos mais adicionados", byType.added)}/>
        <Rank title="Produtos mais removidos" rows={productRemovedRank} empty={EMPTY_LIST_MESSAGE} onOpen={() => openEventModal("Produtos removidos", byType.removed)}/>
        <Rank title="Produtos mais cotados" rows={productQuotedRank} empty={EMPTY_LIST_MESSAGE} onOpen={() => openEventModal("Produtos mais cotados", byType.quotes, { expandQuoteProducts: true })}/>
      </section>

      <SectionTitle title="Consultores" subtitle="Origem comercial das interações" />
      <section className="columns">
        <ValueCard title="Consultores" value={consultantActivity.length} sub="Ativos no filtro atual" icon={<UserCheck/>} onOpen={openConsultantModal}/>
        <Rank title="Acessos por consultor" rows={consultantAccessRank} empty={EMPTY_LIST_MESSAGE} onOpen={openConsultantModal}/>
        <Rank title="Buscas por consultor" rows={consultantSearchRank} empty={EMPTY_LIST_MESSAGE} onOpen={openConsultantModal}/>
        <Rank title="Cotações por consultor" rows={consultantQuoteRank} empty={EMPTY_LIST_MESSAGE} onOpen={openConsultantModal}/>
        <Rank title="Valor total cotado" rows={consultantValueRank} empty={EMPTY_LIST_MESSAGE} formatValue={money} onOpen={openConsultantModal}/>
      </section>

      <SectionTitle title="Cotações" subtitle="Sinais mais próximos de cotação" />
      <section className="columns">
        <ValueCard title="Cotações WhatsApp" value={kpis.quotes} sub={`Total estimado ${money(kpis.quoteTotal)}`} icon={<Send/>} onOpen={() => openQuoteModal()}/>
        <Rank title="Empresas que cotaram" rows={companyQuoteRank} empty={EMPTY_LIST_MESSAGE} onOpen={() => openQuoteModal("Empresas que cotaram")}/>
        <Rank title="Produtos cotados" rows={productQuotedRank} empty={EMPTY_LIST_MESSAGE} onOpen={() => openEventModal("Produtos cotados", byType.quotes, { expandQuoteProducts: true })}/>
        <RecentEvents
          title="Cotações recentes"
          empty={EMPTY_LIST_MESSAGE}
          events={sortEventsDesc(byType.quotes).slice(0, 10)}
          detailFn={(event) => `${quoteItemsCount(event)} itens - ${money(event.cartTotal || event.total)}`}
          onOpen={() => openQuoteModal("Cotações recentes")}
        />
      </section>

      <SectionTitle title="Administração" subtitle="Rotina de limpeza para testes" />
      <section className="admin-grid">
        <article className="panel admin-panel">
          <div className="panel-head">
            <h2><Eraser size={18}/> Reset de dados</h2>
            <span>Ambiente controlado</span>
          </div>
          <p className="admin-copy">Use apenas para limpar eventos de teste antes de iniciar uma nova rodada.</p>
          {ADMIN_PIN ? (
            <label className="admin-pin">PIN
              <input value={adminPin} onChange={(event) => setAdminPin(event.target.value)} type="password" placeholder="PIN admin" disabled={isResetting} />
            </label>
          ) : null}
          <button className="danger-button" type="button" onClick={handleReset} disabled={isResetting} aria-busy={isResetting}>
            {isResetting ? <RefreshCw className="spin" size={17}/> : <Eraser size={17}/>}
            {isResetting ? "Limpando..." : "Limpar dados de teste"}
          </button>
          {resetStatus ? <small className="admin-status">{resetStatus}</small> : null}
          {!ADMIN_PIN ? <small className="admin-status">Sem PIN configurado no painel: reset liberado temporariamente para apresentação.</small> : null}
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2><UserCheck size={18}/> Eventos recentes</h2>
          <span>{filtered.length} eventos filtrados</span>
        </div>
        <div className="event-table">
          <div className="event-head">
            <span>Hora</span><span>Evento</span><span>Empresa</span><span>Consultor</span><span>Detalhe</span>
          </div>
          {sortEventsDesc(filtered).slice(0, 20).map((event) => (
            <div className="event-row" key={`${event.id}-${event.timestamp}`}>
              <span>{dateTime(event.timestamp)}</span>
              <strong>{EVENT_LABELS[event.event] || event.event}</strong>
              <span>{event.companyName}</span>
              <span>{event.consultant.toUpperCase()}</span>
              <span title={eventDetail(event)}>{eventDetail(event)}</span>
            </div>
          ))}
          {!filtered.length ? <p className="empty">{EMPTY_LIST_MESSAGE}</p> : null}
        </div>
      </section>

      {activeModal ? <HistoryModal key={activeModal.id} modal={activeModal} onClose={() => setActiveModal(null)} /> : null}
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

function Kpi({ icon, label, value, onOpen }) {
  return (
    <article className={`kpi ${onOpen ? "clickable-card" : ""}`} role={onOpen ? "button" : undefined} tabIndex={onOpen ? 0 : undefined} onClick={onOpen} onKeyDown={cardKeyHandler(onOpen)}>
      <div className="icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ValueCard({ title, value, sub, icon, onOpen }) {
  return (
    <article className={`spotlight ${onOpen ? "clickable-card" : ""}`} role={onOpen ? "button" : undefined} tabIndex={onOpen ? 0 : undefined} onClick={onOpen} onKeyDown={cardKeyHandler(onOpen)}>
      <div className="spot-icon">{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{sub}</p>
    </article>
  );
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
        )) : <p className="empty">{empty}</p>}
      </div>
    </article>
  );
}

function InsightStrip({ insights = [] }) {
  if (!insights.length) return null;

  return (
    <section className="insight-strip">
      {insights.slice(0, 4).map((insight) => (
        <article className={`insight-card ${insight.level || "info"}`} key={insight.id}>
          <span>{insight.title}</span>
          <strong title={insight.value}>{insight.value}</strong>
          <p>{insight.detail}</p>
        </article>
      ))}
    </section>
  );
}

function MetricTable({ title, subtitle, rows = [], columns = [], empty = EMPTY_LIST_MESSAGE, icon, onOpen }) {
  return (
    <article className={`panel metric-panel ${onOpen ? "clickable-card" : ""}`} role={onOpen ? "button" : undefined} tabIndex={onOpen ? 0 : undefined} onClick={onOpen} onKeyDown={cardKeyHandler(onOpen)}>
      <div className="panel-head">
        <h2>{icon}{title}</h2>
        <span>{rows.length ? `${rows.length} itens` : ""}</span>
      </div>
      {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}
      <div className="metric-list">
        {rows.length ? rows.slice(0, 10).map((row, index) => (
          <div className="metric-row" key={row.id || row.product || row.search || index}>
            <span className="pos">{row.position || index + 1}</span>
            {columns.map((column) => (
              <span key={column.key} className={`metric-cell ${column.key === "product" || column.key === "search" ? "metric-name" : ""}`} title={String(row[column.key] ?? "-")}>
                {row[column.key] ?? "-"}
              </span>
            ))}
          </div>
        )) : <p className="empty">{empty}</p>}
      </div>
    </article>
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
        )) : <p className="empty">{empty}</p>}
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
