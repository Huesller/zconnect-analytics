import { normalizeConsultant, normalizeCompany, safeNumber } from "../../shared/normalization.js";

const EVENT_ALIASES = {
  view_product: "product_open",
  search_no_result: "search_no_results",
  sem_resultado: "search_no_results",
  whatsapp_checkout: "whatsapp_quote",
  whatsapp_order: "whatsapp_quote"
};

function normalizeEvent(value) {
  const event = String(value || "").trim();
  return EVENT_ALIASES[event] || event;
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
  const rawResultsCount = readField(row, ["resultsCount", "results", "resultCount"], null);

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
    resultsCount: safeNumber(rawResultsCount),
    resultsCountKnown: rawResultsCount !== null && rawResultsCount !== "",
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

export {
  normalizeEvent,
  readField,
  parseProducts,
  eventTimestamp,
  normalizeObjectEvent,
  normalizeArrayEvent,
  parseEvents
};
