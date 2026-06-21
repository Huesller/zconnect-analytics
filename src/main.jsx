import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Download,
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
  { key: "company", label: "Empresa", className: "col-company-wide" },
  { key: "totalActions", label: "Total de ações", className: "col-metric" },
  { key: "searches", label: "Buscas", className: "col-metric" },
  { key: "productOpen", label: "Produtos abertos", className: "col-metric" },
  { key: "added", label: "Adicionados", className: "col-metric" },
  { key: "quotes", label: "Cotações", className: "col-metric" },
  { key: "quoteTotal", label: "Valor cotado", className: "col-value" },
  { key: "lastEvent", label: "Último evento", className: "col-time" }
];

const CONSULTANT_ACTIVITY_COLUMNS = [
  { key: "consultant", label: "Consultor", className: "col-company-wide" },
  { key: "totalActions", label: "Total de ações", className: "col-metric" },
  { key: "accesses", label: "Acessos", className: "col-metric" },
  { key: "searches", label: "Buscas", className: "col-metric" },
  { key: "productOpen", label: "Produtos abertos", className: "col-metric" },
  { key: "quotes", label: "Cotações", className: "col-metric" },
  { key: "quoteTotal", label: "Valor cotado", className: "col-value" },
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

  try {
    const response = await fetch(ANALYTICS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "Falha ao limpar eventos.");
    return data;
  } catch (error) {
    const fallbackUrl = `${ANALYTICS_API_URL}?action=clear_events&pin=${encodeURIComponent(pin || "")}&cache=${Date.now()}`;
    const response = await fetch(fallbackUrl, { method: "GET" });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || error.message || "Falha ao limpar eventos.");
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

function localResetAllowed() {
  if (ADMIN_PIN) return true;
  const host = window.location.hostname;
  return import.meta.env.DEV || host === "localhost" || host === "127.0.0.1" || host === "";
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
        searches: 0,
        productOpen: 0,
        added: 0,
        quotes: 0,
        quoteTotalNumber: 0,
        lastEventDate: null
      });
    }

    const row = map.get(company);
    row.totalActions += 1;
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
    .sort((a, b) => b.totalActions - a.totalActions)
    .map((row) => {
      const formatted = {
        ...row,
        quoteTotal: money(row.quoteTotalNumber),
        lastEvent: row.lastEventDate ? dateTime(row.lastEventDate) : "-",
        _search: ""
      };
      formatted._search = [
        formatted.company,
        formatted.totalActions,
        formatted.searches,
        formatted.productOpen,
        formatted.added,
        formatted.quotes,
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
        quoteTotalNumber: 0,
        lastEventDate: null
      });
    }

    const row = map.get(consultant);
    row.totalActions += 1;
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
    .sort((a, b) => b.totalActions - a.totalActions)
    .map((row) => {
      const formatted = {
        ...row,
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
        formatted.quoteTotal,
        formatted.lastEvent
      ].join(" ").toLowerCase();
      return formatted;
    });
}

function App() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("Carregando eventos reais...");
  const [period, setPeriod] = useState("today");
  const [consultant, setConsultant] = useState("all");
  const [company, setCompany] = useState("all");
  const [adminPin, setAdminPin] = useState("");
  const [resetStatus, setResetStatus] = useState("");
  const [activeModal, setActiveModal] = useState(null);

  async function load() {
    setStatus("Carregando eventos reais...");
    try {
      const data = await fetchEvents();
      setEvents(data);
      setStatus(data.length ? `Eventos carregados: ${data.length}` : "Nenhum evento salvo no período.");
    } catch (error) {
      setEvents([]);
      setStatus(error.message || "Não consegui carregar os eventos.");
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);

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

  const consultantAccessRank = useMemo(() => countBy(byType.pageViews, (event) => normalizeConsultant(event.consultant)), [byType.pageViews]);
  const consultantSearchRank = useMemo(() => countBy(allSearchEvents, (event) => normalizeConsultant(event.consultant)), [allSearchEvents]);
  const consultantQuoteRank = useMemo(() => countBy(byType.quotes, (event) => normalizeConsultant(event.consultant)), [byType.quotes]);
  const consultantValueRank = useMemo(() => countBy(byType.quotes, (event) => normalizeConsultant(event.consultant), (event) => event.cartTotal || event.total), [byType.quotes]);
  const consultantActivity = useMemo(() => consultantActivityRows(filtered), [filtered]);

  const funnel = [
    ["Acessos", kpis.pageViews],
    ["Buscas", kpis.searches],
    ["Produtos abertos", kpis.productOpen],
    ["Adicionados", kpis.added],
    ["Cotações WhatsApp", kpis.quotes]
  ];

  function openModal(config) {
    setActiveModal({
      id: `${config.title}-${Date.now()}`,
      empty: "Nenhum registro encontrado para os filtros atuais.",
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
      title: "Clientes mais ativos",
      description: "Resumo completo por empresa no filtro atual.",
      totalLabel: `${filtered.length} ações em ${companyActivity.length} empresa${companyActivity.length === 1 ? "" : "s"}`,
      rows: companyActivity,
      columns: COMPANY_ACTIVITY_COLUMNS,
      filters: { consultant: false }
    });
  }

  function openConsultantModal() {
    openModal({
      title: "Consultores",
      description: "Resumo completo por consultor no filtro atual.",
      totalLabel: `${filtered.length} ações em ${consultantActivity.length} consultor${consultantActivity.length === 1 ? "" : "es"}`,
      rows: consultantActivity,
      columns: CONSULTANT_ACTIVITY_COLUMNS,
      filters: { company: false, consultant: false }
    });
  }

  function exportCsv() {
    const header = [
      "timestamp",
      "event",
      "companyName",
      "consultant",
      "query",
      "productCode",
      "productName",
      "brand",
      "quantity",
      "price",
      "itemsCount",
      "cartTotal",
      "products"
    ];
    const rows = filtered.map((event) => header.map((key) => {
      const value = key === "products" ? JSON.stringify(event.products || []) : event[key];
      return `"${String(value ?? "").replace(/"/g, '""')}"`;
    }).join(";"));
    const csv = [header.join(";"), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zconnect-analytics-${period}-${consultant}-${company}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleReset() {
    setResetStatus("");

    if (!localResetAllowed()) {
      setResetStatus("Reset permitido somente com PIN configurado ou em ambiente local/dev.");
      return;
    }

    if (ADMIN_PIN && adminPin !== ADMIN_PIN) {
      setResetStatus("PIN inválido.");
      return;
    }

    const confirmed = window.confirm("Tem certeza que deseja apagar todos os dados de analytics?");
    if (!confirmed) return;

    try {
      setResetStatus("Limpando eventos...");
      await clearEvents(ADMIN_PIN ? adminPin : "");
      setEvents([]);
      setResetStatus("Dados limpos com sucesso.");
      setStatus("Nenhum evento salvo no período.");
      await load();
    } catch (error) {
      setResetStatus(error.message || "Não foi possível limpar os dados.");
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
          <button onClick={load} className="refresh"><RefreshCw size={17}/> Atualizar</button>
          <button onClick={exportCsv} className="refresh"><Download size={17}/> CSV</button>
        </div>
      </section>

      <section className="toolbar compact-toolbar">
        <div className="status">{status}</div>
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
        <Rank title="Clientes mais ativos" rows={companyActiveRank} empty="Nenhuma ação registrada no filtro atual." onOpen={openCompanyModal}/>
        <Rank title="Clientes que mais pesquisaram" rows={companySearchRank} empty="Nenhuma busca registrada por empresa." onOpen={() => openSearchModal("Buscas por empresa", allSearchEvents)}/>
        <Rank title="Clientes que mais enviaram cotações" rows={companyQuoteRank} empty="Nenhuma cotação registrada por empresa." onOpen={() => openQuoteModal("Cotações por empresa")}/>
        <ValueCard title="Valor total cotado" value={money(kpis.quoteTotal)} sub={`${kpis.quotes} cotações WhatsApp`} icon={<Send/>} onOpen={() => openQuoteModal("Valor total cotado")}/>
      </section>

      <SectionTitle title="Buscas" subtitle="Demanda declarada e oportunidades sem resultado" />
      <section className="columns">
        <Rank title="Top buscas" rows={searchRank} empty="Nenhuma busca registrada no filtro atual." onOpen={() => openSearchModal("Top buscas", allSearchEvents)}/>
        <Rank title="Buscas sem resultado" rows={noResultRank} empty="Nenhuma busca sem resultado no filtro atual." onOpen={() => openSearchModal("Buscas sem resultado", byType.noResults)}/>
        <Rank title="Buscas por empresa" rows={searchByCompanyRank} empty="Nenhuma busca vinculada a empresas." onOpen={() => openSearchModal("Buscas por empresa", allSearchEvents)}/>
        <RecentEvents events={sortEventsDesc(allSearchEvents).slice(0, 10)} empty="Nenhuma busca recente no filtro atual." onOpen={() => openSearchModal("Buscas recentes", allSearchEvents)} />
      </section>

      <SectionTitle title="Produtos" subtitle="Interesse, carrinho e itens cotados" />
      <section className="columns">
        <Rank title="Produtos mais abertos" rows={productOpenRank} empty="Nenhum produto aberto no filtro atual." onOpen={() => openEventModal("Produtos mais abertos", byType.productOpen)}/>
        <Rank title="Produtos mais adicionados" rows={productAddedRank} empty="Nenhum produto adicionado ao carrinho." onOpen={() => openEventModal("Produtos mais adicionados", byType.added)}/>
        <Rank title="Produtos mais removidos" rows={productRemovedRank} empty="Nenhum produto removido do carrinho." onOpen={() => openEventModal("Produtos removidos", byType.removed)}/>
        <Rank title="Produtos mais cotados" rows={productQuotedRank} empty="Nenhum produto enviado para cotação." onOpen={() => openEventModal("Produtos mais cotados", byType.quotes, { expandQuoteProducts: true })}/>
      </section>

      <SectionTitle title="Consultores" subtitle="Origem comercial das interações" />
      <section className="columns">
        <ValueCard title="Consultores" value={consultantActivity.length} sub="Ativos no filtro atual" icon={<UserCheck/>} onOpen={openConsultantModal}/>
        <Rank title="Acessos por consultor" rows={consultantAccessRank} empty="Nenhum acesso vinculado a consultor." onOpen={openConsultantModal}/>
        <Rank title="Buscas por consultor" rows={consultantSearchRank} empty="Nenhuma busca vinculada a consultor." onOpen={openConsultantModal}/>
        <Rank title="Cotações por consultor" rows={consultantQuoteRank} empty="Nenhuma cotação vinculada a consultor." onOpen={openConsultantModal}/>
        <Rank title="Valor total cotado" rows={consultantValueRank} empty="Nenhum valor cotado por consultor." formatValue={money} onOpen={openConsultantModal}/>
      </section>

      <SectionTitle title="Cotações" subtitle="Sinais mais próximos de venda" />
      <section className="columns">
        <ValueCard title="Cotações WhatsApp" value={kpis.quotes} sub={`Total estimado ${money(kpis.quoteTotal)}`} icon={<Send/>} onOpen={() => openQuoteModal()}/>
        <Rank title="Empresas que cotaram" rows={companyQuoteRank} empty="Nenhuma empresa enviou cotação." onOpen={() => openQuoteModal("Empresas que cotaram")}/>
        <Rank title="Produtos cotados" rows={productQuotedRank} empty="Nenhum produto apareceu em cotações." onOpen={() => openEventModal("Produtos cotados", byType.quotes, { expandQuoteProducts: true })}/>
        <RecentEvents
          title="Cotações recentes"
          empty="Sem cotações recentes."
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
              <input value={adminPin} onChange={(event) => setAdminPin(event.target.value)} type="password" placeholder="PIN admin" />
            </label>
          ) : null}
          <button className="danger-button" type="button" onClick={handleReset} disabled={!localResetAllowed()}>
            Limpar dados de teste
          </button>
          {resetStatus ? <small className="admin-status">{resetStatus}</small> : null}
          {!ADMIN_PIN ? <small className="admin-status">Sem PIN configurado: reset liberado somente em local/dev.</small> : null}
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
          {!filtered.length ? <p className="empty">Nenhum evento para os filtros atuais.</p> : null}
        </div>
      </section>

      {activeModal ? <HistoryModal key={activeModal.id} modal={activeModal} onClose={() => setActiveModal(null)} /> : null}
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

function Rank({ title, rows = [], empty, formatValue = (value) => value, onOpen }) {
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

function RecentEvents({ events, title = "Buscas recentes", empty = "Sem buscas recentes.", detailFn = (event) => event.query || "Busca sem texto", onOpen }) {
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
