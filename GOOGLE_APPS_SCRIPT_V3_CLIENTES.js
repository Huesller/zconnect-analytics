const EVENTS_SHEET = "EVENTS";
const OFFERS_SHEET = "OFFERS";
const RESERVATIONS_SHEET = "RESERVATIONS";
const CRM_CLIENTS_SHEET = "CRM_CLIENTS";
const CRM_TASKS_SHEET = "CRM_TASKS";
const CRM_ACTIVITIES_SHEET = "CRM_ACTIVITIES";
const CRM_SETTINGS_SHEET = "CRM_SETTINGS";
const CATALOG_SNAPSHOTS_SHEET = "CATALOG_SNAPSHOTS";
const CATALOG_PRODUCTS_SHEET = "CATALOG_PRODUCTS";
const ACTIVE_RESERVATION_TTL_MS = 20 * 60 * 1000;
const QUOTED_RESERVATION_TTL_MS = 60 * 60 * 1000;
const RESERVATION_HISTORY_RETENTION_MS = 48 * 60 * 60 * 1000;
const ADMIN_LOCK_WAIT_MS = 7000;

const OFFER_HEADERS = [
  "createdAt",
  "shortCode",
  "clientSlug",
  "signedToken",
  "offerId",
  "clientName",
  "seller",
  "expiresAt"
];

const EVENT_HEADERS = [
  "createdAt",
  "timestamp",
  "event",
  "consultant",
  "consultor",
  "companyName",
  "empresa",
  "company",
  "query",
  "productCode",
  "productName",
  "brand",
  "price",
  "quantity",
  "total",
  "itemsCount",
  "cartTotal",
  "products",
  "page",
  "referrer",
  "userAgent",
  "sessionId",
  "eventId",
  "clientId",
  "searchTimeMs",
  "resultsCount",
  "specialOffer",
  "specialOfferId",
  "specialOfferSigned",
  "specialOfferActive",
  "specialOfferExpired",
  "specialOfferClient",
  "specialOfferSeller",
  "specialOfferMode",
  "specialOfferDiscount",
  "specialOfferFactor",
  "specialOfferExpiresAt",
  "specialOfferSource"
];

const RESERVATION_HEADERS = [
  "createdAt",
  "updatedAt",
  "expiresAt",
  "sessionId",
  "companyName",
  "consultant",
  "productCode",
  "productName",
  "brand",
  "stockQty",
  "requestedQty",
  "reservedQty",
  "excessQty",
  "status",
  "quotedAt"
];

const CRM_CLIENT_HEADERS = [
  "companyKey",
  "companyName",
  "customerCode",
  "contactName",
  "phone",
  "email",
  "city",
  "segment",
  "status",
  "owner",
  "nextContactAt",
  "tags",
  "notes",
  "expectedValue",
  "lastOutcome",
  "lostReason",
  "actionDoneAt",
  "archivedAt",
  "createdAt",
  "updatedAt"
];

const CRM_TASK_HEADERS = [
  "taskId",
  "companyKey",
  "companyName",
  "title",
  "dueAt",
  "owner",
  "priority",
  "status",
  "createdAt",
  "completedAt"
];

const CRM_ACTIVITY_HEADERS = [
  "activityId",
  "companyKey",
  "companyName",
  "type",
  "stageFrom",
  "stageTo",
  "value",
  "reason",
  "note",
  "owner",
  "createdAt",
  "updatedAt",
  "deletedAt"
];

const CRM_SETTING_HEADERS = ["key", "value", "updatedAt"];

const CATALOG_SNAPSHOT_HEADERS = [
  "snapshotId",
  "createdAt",
  "source",
  "status",
  "durationMs",
  "productCount",
  "inStockCount",
  "outOfStockCount",
  "missingImageCount",
  "newCount",
  "removedCount",
  "changedStockCount",
  "errorMessage"
];

const CATALOG_PRODUCT_HEADERS = [
  "productCode",
  "productName",
  "brand",
  "stockQty",
  "previousStockQty",
  "restockedAt",
  "hasImage",
  "updatedAt"
];

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getEventsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(EVENTS_SHEET);
  if (!sheet) sheet = ss.insertSheet(EVENTS_SHEET);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(EVENT_HEADERS);
    return sheet;
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  let changed = false;

  EVENT_HEADERS.forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      currentHeaders.push(header);
      changed = true;
    }
  });

  if (changed) {
    sheet.getRange(1, 1, 1, currentHeaders.length).setValues([currentHeaders]);
  }

  return sheet;
}

function getOffersSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(OFFERS_SHEET);
  if (!sheet) sheet = ss.insertSheet(OFFERS_SHEET);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(OFFER_HEADERS);
    return sheet;
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  let changed = false;

  OFFER_HEADERS.forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      currentHeaders.push(header);
      changed = true;
    }
  });

  if (changed) sheet.getRange(1, 1, 1, currentHeaders.length).setValues([currentHeaders]);
  return sheet;
}

function getReservationsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(RESERVATIONS_SHEET);
  if (!sheet) sheet = ss.insertSheet(RESERVATIONS_SHEET);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(RESERVATION_HEADERS);
    return sheet;
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  let changed = false;

  RESERVATION_HEADERS.forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      currentHeaders.push(header);
      changed = true;
    }
  });

  if (changed) sheet.getRange(1, 1, 1, currentHeaders.length).setValues([currentHeaders]);
  return sheet;
}

function getCrmClientsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CRM_CLIENTS_SHEET);
  if (!sheet) sheet = ss.insertSheet(CRM_CLIENTS_SHEET);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(CRM_CLIENT_HEADERS);
    return sheet;
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  let changed = false;
  CRM_CLIENT_HEADERS.forEach(function(header) {
    if (headers.indexOf(header) === -1) {
      headers.push(header);
      changed = true;
    }
  });
  if (changed) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function getStructuredSheet_(sheetName, requiredHeaders) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(requiredHeaders);
    sheet.setFrozenRows(1);
    return sheet;
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  let changed = false;
  requiredHeaders.forEach(function(header) {
    if (headers.indexOf(header) === -1) {
      headers.push(header);
      changed = true;
    }
  });
  if (changed) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

function getCrmTasksSheet_() {
  return getStructuredSheet_(CRM_TASKS_SHEET, CRM_TASK_HEADERS);
}

function getCrmActivitiesSheet_() {
  return getStructuredSheet_(CRM_ACTIVITIES_SHEET, CRM_ACTIVITY_HEADERS);
}

function getCrmSettingsSheet_() {
  return getStructuredSheet_(CRM_SETTINGS_SHEET, CRM_SETTING_HEADERS);
}

function getCatalogSnapshotsSheet_() {
  return getStructuredSheet_(CATALOG_SNAPSHOTS_SHEET, CATALOG_SNAPSHOT_HEADERS);
}

function getCatalogProductsSheet_() {
  return getStructuredSheet_(CATALOG_PRODUCTS_SHEET, CATALOG_PRODUCT_HEADERS);
}

function normalizeShortCode_(value) {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-HJ-NP-Z2-9]{8}$/.test(code) ? code : "";
}

function normalizeClientSlug_(value) {
  const slug = String(value || "").trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9-]{0,39}$/.test(slug) ? slug : "";
}

function findOfferRowByCode_(sheet, code) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const headers = getHeaders_(sheet);
  const codeColumn = headers.indexOf("shortCode") + 1;
  if (!codeColumn) return 0;

  const match = sheet
    .getRange(2, codeColumn, lastRow - 1, 1)
    .createTextFinder(code)
    .matchEntireCell(true)
    .findNext();

  return match ? match.getRow() : 0;
}

function createShortOffer_(data) {
  const shortCode = normalizeShortCode_(data.shortCode || data.code);
  const clientSlug = normalizeClientSlug_(data.clientSlug);
  const signedToken = String(data.signedToken || data.token || "").trim();
  const offerId = String(data.offerId || "").trim().slice(0, 80);
  const clientName = String(data.clientName || "").trim().replace(/\s+/g, " ").slice(0, 100);
  const seller = normalizeConsultor_(data.seller || data.consultant || data.consultor);
  const expiresAt = String(data.expiresAt || "").trim();

  if (!shortCode || !clientSlug || !offerId || !clientName) {
    return { ok: false, error: "invalid_offer_reference" };
  }
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(signedToken) || signedToken.length > 1200) {
    return { ok: false, error: "invalid_signed_token" };
  }

  const sheet = getOffersSheet_();
  if (findOfferRowByCode_(sheet, shortCode)) {
    return { ok: false, error: "short_code_collision" };
  }

  const record = {
    createdAt: new Date(),
    shortCode: shortCode,
    clientSlug: clientSlug,
    signedToken: signedToken,
    offerId: offerId,
    clientName: clientName,
    seller: seller,
    expiresAt: expiresAt
  };
  const headers = getHeaders_(sheet);
  sheet.appendRow(headers.map(function(header) { return record[header] !== undefined ? record[header] : ""; }));

  return { ok: true, shortCode: shortCode, clientSlug: clientSlug };
}

function resolveShortOffer_(code) {
  const shortCode = normalizeShortCode_(code);
  if (!shortCode) return { ok: false, error: "invalid_short_code" };

  const sheet = getOffersSheet_();
  const rowNumber = findOfferRowByCode_(sheet, shortCode);
  if (!rowNumber) return { ok: false, error: "offer_not_found" };

  const headers = getHeaders_(sheet);
  const values = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const item = {};
  headers.forEach(function(header, index) { item[header] = values[index]; });

  return {
    ok: true,
    token: String(item.signedToken || ""),
    clientSlug: String(item.clientSlug || ""),
    offerId: String(item.offerId || "")
  };
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return {};
  }
}

function normalizeConsultor_(value) {
  const slug = String(value || "sem_consultor").toLowerCase().trim();
  if (slug === "ivoney") return "ney";
  return slug || "sem_consultor";
}

function normalizeCompany_(data) {
  return String(data.companyName || data.empresa || data.company || data.cliente || data.clientName || "").trim();
}

function normalizeEvent_(value) {
  const event = String(value || "").trim();
  const aliases = {
    view_product: "product_open",
    search_no_result: "search_no_results",
    sem_resultado: "search_no_results",
    whatsapp_checkout: "whatsapp_quote",
    whatsapp_order: "whatsapp_quote"
  };

  return aliases[event] || event;
}

function number_(value) {
  if (typeof value === "number") return value;
  const raw = String(value || "0").trim().replace(/[^0-9,.-]/g, "");
  const normalized = raw.indexOf(",") >= 0 ? raw.replace(/\./g, "").replace(",", ".") : raw;
  return Number(normalized) || 0;
}

function serializeProducts_(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch (err) {
    return String(value);
  }
}

function getHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
}

function appendEvent_(data) {
  const sheet = getEventsSheet_();
  const headers = getHeaders_(sheet);
  const consultor = normalizeConsultor_(data.consultor || data.consultant || data.consultant_slug);
  const companyName = normalizeCompany_(data);
  const clientId = data.clientId || data.clienteId || data.customerId || data.sessionId || "";
  const event = normalizeEvent_(data.event);
  const timestamp = data.timestamp || data.createdAt || new Date().toISOString();
  const total = number_(data.total || data.cart_total || data.cartTotal || 0);
  const quantity = number_(data.quantity || data.quantidade || data.itemsCount || 0);
  const itemsCount = number_(data.itemsCount || data.itemCount || data.quantity || data.quantidade || 0);
  const cartTotal = number_(data.cartTotal || data.cart_total || data.total || 0);

  const record = {
    createdAt: timestamp ? new Date(timestamp) : new Date(),
    timestamp: timestamp,
    event: event,
    consultant: consultor,
    consultor: consultor,
    query: data.query || data.busca || "",
    productCode: data.productCode || data.codigo || data.product_code || "",
    productName: data.productName || data.descricao || data.product_name || "",
    brand: data.brand || data.marca || data.fabricante || "",
    price: number_(data.price || data.preco || 0),
    quantity: quantity,
    total: total,
    itemsCount: itemsCount,
    cartTotal: cartTotal,
    products: serializeProducts_(data.products || data.items || data.productList || ""),
    page: data.page || "",
    referrer: data.referrer || "",
    userAgent: data.userAgent || "",
    sessionId: data.sessionId || "",
    eventId: data.eventId || "",
    clientId: clientId,
    companyName: companyName,
    empresa: companyName,
    company: companyName,
    searchTimeMs: number_(data.searchTimeMs || data.search_time || data.elapsedMs || 0),
    resultsCount: number_(data.resultsCount || data.results || data.resultCount || 0),
    specialOffer: Boolean(data.specialOffer),
    specialOfferId: String(data.specialOfferId || ""),
    specialOfferSigned: Boolean(data.specialOfferSigned),
    specialOfferActive: Boolean(data.specialOfferActive),
    specialOfferExpired: Boolean(data.specialOfferExpired),
    specialOfferClient: String(data.specialOfferClient || data.clientName || ""),
    specialOfferSeller: normalizeConsultor_(data.specialOfferSeller || ""),
    specialOfferMode: String(data.specialOfferMode || ""),
    specialOfferDiscount: number_(data.specialOfferDiscount || 0),
    specialOfferFactor: number_(data.specialOfferFactor || 0),
    specialOfferExpiresAt: String(data.specialOfferExpiresAt || ""),
    specialOfferSource: String(data.specialOfferSource || "")
  };

  const row = headers.map(function(header) {
    return record[header] !== undefined ? record[header] : "";
  });

  sheet.appendRow(row);

  return { ok: true };
}

function readEvents_() {
  const sheet = getEventsSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const rows = values.slice(1).map(function(row, index) {
    const item = { id: "row-" + (index + 2) };

    headers.forEach(function(header, columnIndex) {
      item[header] = row[columnIndex];
    });

    item.consultant = item.consultant || item.consultor || "";
    item.event = normalizeEvent_(item.event);
    item.timestamp = item.timestamp || item.createdAt || "";
    item.companyName = item.companyName || item.empresa || item.company || "";
    item.clientId = item.clientId || item.clienteId || item.sessionId || "";
    item.itemsCount = item.itemsCount || item.quantity || "";
    item.cartTotal = item.cartTotal || item.total || "";

    return item;
  });

  return { ok: true, events: rows };
}

function getSummary_() {
  const events = readEvents_().events;
  const companies = {};
  events.forEach(function(event) {
    const company = event.companyName || event.empresa || "Empresa não informada";
    if (!companies[company]) {
      companies[company] = {
        companyName: company,
        clientId: event.clientId || "",
        searches: 0,
        views: 0,
        carts: 0,
        whats: 0,
        noResult: 0,
        lastAt: event.createdAt
      };
    }

    if (event.event === "search") companies[company].searches++;
    if (event.event === "product_open") companies[company].views++;
    if (event.event === "add_to_cart") companies[company].carts++;
    if (event.event === "whatsapp_quote") companies[company].whats++;
    if (event.event === "search_no_results") companies[company].noResult++;

    if (new Date(event.createdAt) > new Date(companies[company].lastAt)) {
      companies[company].lastAt = event.createdAt;
    }
  });

  return {
    ok: true,
    totalEvents: events.length,
    companies: Object.keys(companies).map(function(key) { return companies[key]; })
  };
}

function normalizeReservationSessionId_(value) {
  const sessionId = String(value || "").trim();
  return /^[A-Za-z0-9:_-]{6,120}$/.test(sessionId) ? sessionId : "";
}

function positiveInteger_(value, maximum) {
  const parsed = Math.floor(Number(value));
  if (!isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, maximum || 9999);
}

function reservationDate_(value) {
  const date = value instanceof Date ? value : new Date(value || 0);
  return isNaN(date.getTime()) ? new Date(0) : date;
}

function normalizeReservationItems_(value) {
  const source = Array.isArray(value) ? value : [];
  const byCode = {};

  source.slice(0, 80).forEach(function(item) {
    const productCode = String(item && (item.productCode || item.code) || "").trim().slice(0, 80);
    if (!productCode) return;

    byCode[productCode] = {
      productCode: productCode,
      productName: String(item.productName || item.name || "").trim().replace(/\s+/g, " ").slice(0, 220),
      brand: String(item.brand || "").trim().replace(/\s+/g, " ").slice(0, 80),
      stockQty: positiveInteger_(item.stockQty !== undefined ? item.stockQty : item.stock, 99999),
      requestedQty: positiveInteger_(item.requestedQty !== undefined ? item.requestedQty : item.quantity, 9999)
    };
  });

  return Object.keys(byCode).map(function(code) { return byCode[code]; });
}

function readReservationRecords_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  return {
    headers: headers,
    records: values.slice(1).map(function(row, index) {
      const record = { __rowNumber: index + 2 };
      headers.forEach(function(header, columnIndex) { record[header] = row[columnIndex]; });
      return record;
    })
  };
}

function reservationIsHolding_(record, now) {
  const status = String(record.status || "").toLowerCase();
  if (status !== "active" && status !== "quoted") return false;
  return reservationDate_(record.expiresAt).getTime() > now.getTime();
}

function expireReservations_(records, now) {
  let changed = false;
  records.forEach(function(record) {
    const status = String(record.status || "").toLowerCase();
    if ((status === "active" || status === "quoted") && !reservationIsHolding_(record, now)) {
      record.status = "expired";
      record.reservedQty = 0;
      record.excessQty = 0;
      changed = true;
    }
  });
  return changed;
}

function writeReservationRecords_(sheet, headers, records) {
  const previousRows = Math.max(0, sheet.getLastRow() - 1);
  if (records.length) {
    const rows = records.map(function(record) {
      return headers.map(function(header) {
        return record[header] !== undefined ? record[header] : "";
      });
    });
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  const surplusRows = Math.max(0, previousRows - records.length);
  if (surplusRows) sheet.deleteRows(records.length + 2, surplusRows);
}

function buildPublicReservationsFromRecords_(records, ownSessionId, now) {
  const byCode = {};

  records.forEach(function(record) {
    if (!reservationIsHolding_(record, now)) return;
    const productCode = String(record.productCode || "").trim();
    if (!productCode) return;

    if (!byCode[productCode]) {
      byCode[productCode] = {
        productCode: productCode,
        productName: String(record.productName || ""),
        stockQty: positiveInteger_(record.stockQty, 99999),
        totalReservedQty: 0,
        activeCarts: 0,
        ownRequestedQty: 0,
        ownReservedQty: 0,
        ownExcessQty: 0,
        ownStatus: "",
        ownExpiresAt: "",
        __sessions: {}
      };
    }

    const item = byCode[productCode];
    item.stockQty = Math.max(item.stockQty, positiveInteger_(record.stockQty, 99999));
    item.totalReservedQty += positiveInteger_(record.reservedQty, 9999);
    const rowSessionId = String(record.sessionId || "");
    if (!item.__sessions[rowSessionId]) {
      item.__sessions[rowSessionId] = true;
      item.activeCarts++;
    }
    if (rowSessionId === ownSessionId) {
      item.ownRequestedQty += positiveInteger_(record.requestedQty, 9999);
      item.ownReservedQty += positiveInteger_(record.reservedQty, 9999);
      item.ownExcessQty += positiveInteger_(record.excessQty, 9999);
      item.ownStatus = String(record.status || "active");
      item.ownExpiresAt = reservationDate_(record.expiresAt).toISOString();
    }
  });

  return Object.keys(byCode).map(function(code) {
    const item = byCode[code];
    delete item.__sessions;
    item.availableNow = Math.max(0, item.stockQty - item.totalReservedQty);
    item.otherReservedQty = Math.max(0, item.totalReservedQty - item.ownReservedQty);
    item.availableForSession = Math.max(0, item.stockQty - item.otherReservedQty);
    return item;
  });
}

function syncReservations_(data) {
  const sessionId = normalizeReservationSessionId_(data.sessionId);
  if (!sessionId) return { ok: false, error: "invalid_session" };

  const items = normalizeReservationItems_(data.items);
  const companyName = normalizeCompany_(data).replace(/\s+/g, " ").slice(0, 120);
  const consultant = normalizeConsultor_(data.consultant || data.consultor);
  const now = new Date();
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
  } catch (err) {
    return { ok: false, error: "reservation_busy" };
  }

  try {
    const sheet = getReservationsSheet_();
    const loaded = readReservationRecords_(sheet);
    let records = loaded.records;
    expireReservations_(records, now);
    records = records.filter(function(record) {
      if (reservationIsHolding_(record, now)) return true;
      const lastActivity = reservationDate_(record.updatedAt || record.createdAt).getTime();
      return lastActivity > now.getTime() - RESERVATION_HISTORY_RETENTION_MS;
    });

    const requestedCodes = {};
    const ownByCode = {};
    records.forEach(function(record) {
      if (String(record.sessionId || "") !== sessionId) return;
      const code = String(record.productCode || "");
      if (code && !ownByCode[code]) ownByCode[code] = record;
      else if (code && reservationIsHolding_(record, now)) {
        record.status = "released";
        record.reservedQty = 0;
        record.excessQty = 0;
      }
    });

    items.forEach(function(item) {
      requestedCodes[item.productCode] = true;
      let reservedByOthers = 0;
      records.forEach(function(record) {
        if (String(record.productCode || "") !== item.productCode) return;
        if (String(record.sessionId || "") === sessionId) return;
        if (reservationIsHolding_(record, now)) {
          reservedByOthers += positiveInteger_(record.reservedQty, 9999);
        }
      });

      const availableForSession = Math.max(0, item.stockQty - reservedByOthers);
      const reservedQty = Math.min(item.requestedQty, availableForSession);
      const excessQty = Math.max(0, item.requestedQty - reservedQty);
      const record = ownByCode[item.productCode] || {};
      if (!record.createdAt) record.createdAt = now;
      record.updatedAt = now;
      record.expiresAt = new Date(now.getTime() + ACTIVE_RESERVATION_TTL_MS);
      record.sessionId = sessionId;
      record.companyName = companyName;
      record.consultant = consultant;
      record.productCode = item.productCode;
      record.productName = item.productName;
      record.brand = item.brand;
      record.stockQty = item.stockQty;
      record.requestedQty = item.requestedQty;
      record.reservedQty = reservedQty;
      record.excessQty = excessQty;
      record.status = "active";
      record.quotedAt = "";

      if (!ownByCode[item.productCode]) {
        records.push(record);
        ownByCode[item.productCode] = record;
      }
    });

    Object.keys(ownByCode).forEach(function(code) {
      if (requestedCodes[code]) return;
      const record = ownByCode[code];
      if (reservationIsHolding_(record, now)) {
        record.updatedAt = now;
        record.expiresAt = now;
        record.reservedQty = 0;
        record.excessQty = 0;
        record.status = "released";
      }
    });

    writeReservationRecords_(sheet, loaded.headers, records);
    return {
      ok: true,
      ttlMinutes: 20,
      products: buildPublicReservationsFromRecords_(records, sessionId, now)
    };
  } finally {
    lock.releaseLock();
  }
}

function quoteReservations_(data) {
  const sessionId = normalizeReservationSessionId_(data.sessionId);
  if (!sessionId) return { ok: false, error: "invalid_session" };

  const now = new Date();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return { ok: false, error: "reservation_busy" };
  }

  try {
    const sheet = getReservationsSheet_();
    const loaded = readReservationRecords_(sheet);
    expireReservations_(loaded.records, now);
    let quotedRows = 0;

    loaded.records.forEach(function(record) {
      if (String(record.sessionId || "") !== sessionId || !reservationIsHolding_(record, now)) return;
      record.status = "quoted";
      record.updatedAt = now;
      record.quotedAt = now;
      record.expiresAt = new Date(now.getTime() + QUOTED_RESERVATION_TTL_MS);
      quotedRows++;
    });

    writeReservationRecords_(sheet, loaded.headers, loaded.records);
    return {
      ok: true,
      quotedRows: quotedRows,
      ttlMinutes: 60,
      products: buildPublicReservationsFromRecords_(loaded.records, sessionId, now)
    };
  } finally {
    lock.releaseLock();
  }
}

function releaseReservations_(data) {
  const sessionId = normalizeReservationSessionId_(data.sessionId);
  if (!sessionId) return { ok: false, error: "invalid_session" };

  const now = new Date();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return { ok: false, error: "reservation_busy" };
  }

  try {
    const sheet = getReservationsSheet_();
    const loaded = readReservationRecords_(sheet);
    loaded.records.forEach(function(record) {
      if (String(record.sessionId || "") !== sessionId || !reservationIsHolding_(record, now)) return;
      record.status = "released";
      record.updatedAt = now;
      record.expiresAt = now;
      record.reservedQty = 0;
      record.excessQty = 0;
    });
    writeReservationRecords_(sheet, loaded.headers, loaded.records);
    return { ok: true, products: buildPublicReservationsFromRecords_(loaded.records, sessionId, now) };
  } finally {
    lock.releaseLock();
  }
}

function getPublicReservations_(sessionIdValue) {
  const sessionId = normalizeReservationSessionId_(sessionIdValue);
  const now = new Date();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return { ok: false, error: "reservation_busy" };
  }

  try {
    const sheet = getReservationsSheet_();
    const loaded = readReservationRecords_(sheet);
    const changed = expireReservations_(loaded.records, now);
    if (changed) writeReservationRecords_(sheet, loaded.headers, loaded.records);
    return {
      ok: true,
      ttlMinutes: 20,
      serverTime: now.toISOString(),
      products: buildPublicReservationsFromRecords_(loaded.records, sessionId, now)
    };
  } finally {
    lock.releaseLock();
  }
}

function getAdminReservations_() {
  const now = new Date();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return { ok: false, error: "reservation_busy" };
  }

  try {
    const sheet = getReservationsSheet_();
    const loaded = readReservationRecords_(sheet);
    const changed = expireReservations_(loaded.records, now);
    if (changed) writeReservationRecords_(sheet, loaded.headers, loaded.records);

    const reservations = loaded.records.filter(function(record) {
      return reservationIsHolding_(record, now);
    }).map(function(record, index) {
      return {
        id: "reservation-" + (record.__rowNumber || index + 2),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        expiresAt: record.expiresAt,
        sessionId: String(record.sessionId || ""),
        companyName: String(record.companyName || ""),
        consultant: String(record.consultant || ""),
        productCode: String(record.productCode || ""),
        productName: String(record.productName || ""),
        brand: String(record.brand || ""),
        stockQty: positiveInteger_(record.stockQty, 99999),
        requestedQty: positiveInteger_(record.requestedQty, 9999),
        reservedQty: positiveInteger_(record.reservedQty, 9999),
        excessQty: positiveInteger_(record.excessQty, 9999),
        status: String(record.status || "active"),
        quotedAt: record.quotedAt || ""
      };
    }).sort(function(a, b) {
      return reservationDate_(b.updatedAt).getTime() - reservationDate_(a.updatedAt).getTime();
    });

    return { ok: true, serverTime: now.toISOString(), reservations: reservations };
  } finally {
    lock.releaseLock();
  }
}

function normalizeCompanyKey_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanupReason_(companyName) {
  const key = normalizeCompanyKey_(companyName);
  const anonymous = {
    "": true,
    "nao identificado": true,
    "empresa nao informada": true,
    "nao informada": true,
    "anonimo": true,
    "visitante": true,
    "sem empresa": true
  };
  if (anonymous[key]) return "Empresa não identificada";

  const tokens = key.split(" ");
  const hasTestToken = tokens.some(function(token) {
    return /^(teste|testes|test|testing)\d*$/.test(token);
  });
  if (hasTestToken) return "Nome de teste";
  return "";
}

function validateAdminAccess_(data) {
  const properties = PropertiesService.getScriptProperties();
  const configuredToken = String(properties.getProperty("ANALYTICS_ADMIN_TOKEN") || "").trim();
  const requestedToken = String((data || {}).adminToken || (data || {}).admin_token || "").trim();
  return Boolean(configuredToken && requestedToken === configuredToken);
}

function validateCatalogSync_(data) {
  const properties = PropertiesService.getScriptProperties();
  const configuredToken = String(properties.getProperty("CATALOG_SYNC_TOKEN") || properties.getProperty("ANALYTICS_ADMIN_TOKEN") || "").trim();
  const requestedToken = String((data || {}).syncToken || (data || {}).adminToken || "").trim();
  return Boolean(configuredToken && requestedToken === configuredToken);
}

function uniqueId_(prefix) {
  return String(prefix || "ID") + "-" + Utilities.getUuid().replace(/-/g, "").slice(0, 18).toUpperCase();
}

function readStructuredRows_(sheet, idPrefix) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  return values.slice(1).map(function(row, index) {
    const item = { id: String(idPrefix || "row") + "-" + (index + 2) };
    headers.forEach(function(header, columnIndex) { item[header] = row[columnIndex]; });
    return item;
  });
}

function appendCrmActivity_(record) {
  const sheet = getCrmActivitiesSheet_();
  const now = new Date();
  const normalized = {
    activityId: String(record.activityId || uniqueId_("ACT")),
    companyKey: normalizeCompanyKey_(record.companyKey || record.companyName),
    companyName: String(record.companyName || "").trim().replace(/\s+/g, " ").slice(0, 120),
    type: String(record.type || "note").trim().slice(0, 40),
    stageFrom: String(record.stageFrom || "").trim().slice(0, 40),
    stageTo: String(record.stageTo || "").trim().slice(0, 40),
    value: number_(record.value || 0),
    reason: String(record.reason || "").trim().slice(0, 180),
    note: String(record.note || "").trim().slice(0, 1000),
    owner: String(record.owner || "").trim().slice(0, 80),
    createdAt: record.createdAt || now,
    updatedAt: record.updatedAt || "",
    deletedAt: record.deletedAt || ""
  };
  const headers = getHeaders_(sheet);
  sheet.appendRow(headers.map(function(header) { return normalized[header] !== undefined ? normalized[header] : ""; }));
  return normalized;
}

function readCrmClients_() {
  const sheet = getCrmClientsSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const clients = values.slice(1).map(function(row, index) {
    const item = { id: "crm-" + (index + 2) };
    headers.forEach(function(header, columnIndex) { item[header] = row[columnIndex]; });
    return item;
  }).filter(function(item) { return String(item.companyKey || "").trim(); });
  return { ok: true, clients: clients };
}

function readCrmTasks_() {
  const tasks = readStructuredRows_(getCrmTasksSheet_(), "task")
    .filter(function(item) { return String(item.taskId || "").trim(); })
    .sort(function(a, b) { return reservationDate_(b.createdAt).getTime() - reservationDate_(a.createdAt).getTime(); });
  return { ok: true, tasks: tasks };
}

function readCrmActivities_() {
  const activities = readStructuredRows_(getCrmActivitiesSheet_(), "activity")
    .filter(function(item) { return String(item.activityId || "").trim() && !String(item.deletedAt || "").trim(); })
    .sort(function(a, b) { return reservationDate_(b.createdAt).getTime() - reservationDate_(a.createdAt).getTime(); })
    .slice(0, 5000);
  return { ok: true, activities: activities };
}

function readCrmSettings_() {
  const rows = readStructuredRows_(getCrmSettingsSheet_(), "setting");
  const settings = {};
  rows.forEach(function(item) { if (item.key) settings[String(item.key)] = item.value; });
  return { ok: true, settings: settings };
}

function upsertCrmClient_(data) {
  const companyName = String(data.companyName || "").trim().replace(/\s+/g, " ").slice(0, 120);
  const companyKey = normalizeCompanyKey_(data.companyKey || companyName);
  if (!companyKey || cleanupReason_(companyName)) return { ok: false, error: "invalid_company" };

  const allowedStatuses = ["new", "contact", "quoted", "negotiation", "waiting", "won", "active", "cold", "lost"];
  const status = allowedStatuses.indexOf(String(data.status || "")) >= 0 ? String(data.status) : "new";
  const customerCode = String(data.customerCode || "").trim().replace(/\s+/g, " ").slice(0, 80);
  const contactName = String(data.contactName || "").trim().replace(/\s+/g, " ").slice(0, 120);
  const phone = String(data.phone || "").replace(/[^0-9+]/g, "").slice(0, 20);
  const email = String(data.email || "").trim().toLowerCase().slice(0, 180);
  const city = String(data.city || "").trim().replace(/\s+/g, " ").slice(0, 120);
  const segment = String(data.segment || "").trim().replace(/\s+/g, " ").slice(0, 120);
  const ownerRaw = String(data.owner || data.consultant || "").trim();
  const owner = ownerRaw ? normalizeConsultor_(ownerRaw).slice(0, 80) : "";
  const nextContactAt = String(data.nextContactAt || "").trim().slice(0, 40);
  const tags = String(data.tags || "").trim().replace(/\s+/g, " ").slice(0, 240);
  const notes = String(data.notes || "").trim().slice(0, 3000);
  const expectedValue = Math.max(0, number_(data.expectedValue || 0));
  const lastOutcome = String(data.lastOutcome || "").trim().slice(0, 40);
  const lostReason = String(data.lostReason || "").trim().slice(0, 180);
  const now = new Date();
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
  } catch (err) {
    return { ok: false, error: "crm_busy" };
  }

  try {
    const sheet = getCrmClientsSheet_();
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(String);
    const keyIndex = headers.indexOf("companyKey");
    let rowNumber = 0;
    let previousStatus = "";
    let previousRecord = {};
    for (let index = 1; index < values.length; index++) {
      if (normalizeCompanyKey_(values[index][keyIndex]) === companyKey) {
        rowNumber = index + 1;
        const statusIndex = headers.indexOf("status");
        previousStatus = statusIndex >= 0 ? String(values[index][statusIndex] || "") : "";
        headers.forEach(function(header, columnIndex) { previousRecord[header] = values[index][columnIndex]; });
        break;
      }
    }

    const existingCreatedAt = rowNumber
      ? sheet.getRange(rowNumber, headers.indexOf("createdAt") + 1).getValue()
      : now;
    const record = {
      companyKey: companyKey,
      companyName: companyName,
      customerCode: customerCode,
      contactName: contactName,
      phone: phone,
      email: email,
      city: city,
      segment: segment,
      status: status,
      owner: owner,
      nextContactAt: nextContactAt,
      tags: tags,
      notes: notes,
      expectedValue: expectedValue,
      lastOutcome: lastOutcome,
      lostReason: lostReason,
      actionDoneAt: data.actionDoneAt !== undefined ? String(data.actionDoneAt || "") : (previousRecord.actionDoneAt || ""),
      archivedAt: data.archivedAt !== undefined ? String(data.archivedAt || "") : (previousRecord.archivedAt || ""),
      createdAt: existingCreatedAt || now,
      updatedAt: now
    };
    const row = headers.map(function(header) { return record[header] !== undefined ? record[header] : ""; });
    if (rowNumber) sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
    else sheet.appendRow(row);
    if (previousStatus && previousStatus !== status) {
      appendCrmActivity_({
        companyKey: companyKey,
        companyName: companyName,
        type: "stage_change",
        stageFrom: previousStatus,
        stageTo: status,
        owner: owner,
        note: String(data.activityNote || "Etapa atualizada no CRM").slice(0, 1000)
      });
    }
    return { ok: true, client: record };
  } finally {
    lock.releaseLock();
  }
}

function upsertCrmTask_(data) {
  const companyName = String(data.companyName || "").trim().replace(/\s+/g, " ").slice(0, 120);
  const companyKey = normalizeCompanyKey_(data.companyKey || companyName);
  const title = String(data.title || "").trim().replace(/\s+/g, " ").slice(0, 220);
  if (!companyKey || !title || cleanupReason_(companyName)) return { ok: false, error: "invalid_task" };
  const taskId = String(data.taskId || uniqueId_("TASK")).trim().slice(0, 80);
  const priority = ["low", "normal", "high", "urgent"].indexOf(String(data.priority || "")) >= 0 ? String(data.priority) : "normal";
  const requestedStatus = String(data.status || "open");
  const status = ["open", "done", "cancelled"].indexOf(requestedStatus) >= 0 ? requestedStatus : "open";
  const now = new Date();
  const record = {
    taskId: taskId,
    companyKey: companyKey,
    companyName: companyName,
    title: title,
    dueAt: String(data.dueAt || "").trim().slice(0, 40),
    owner: String(data.owner || "").trim().slice(0, 80),
    priority: priority,
    status: status,
    createdAt: data.createdAt || now,
    completedAt: status === "done" ? (data.completedAt || now) : ""
  };
  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (err) { return { ok: false, error: "task_busy" }; }
  try {
    const sheet = getCrmTasksSheet_();
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(String);
    const idIndex = headers.indexOf("taskId");
    let rowNumber = 0;
    for (let index = 1; index < values.length; index++) {
      if (String(values[index][idIndex] || "") === taskId) {
        rowNumber = index + 1;
        const createdIndex = headers.indexOf("createdAt");
        if (createdIndex >= 0 && values[index][createdIndex]) record.createdAt = values[index][createdIndex];
        break;
      }
    }
    const row = headers.map(function(header) { return record[header] !== undefined ? record[header] : ""; });
    if (rowNumber) sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
    else sheet.appendRow(row);
    return { ok: true, task: record };
  } finally { lock.releaseLock(); }
}

function completeCrmTask_(data) {
  const taskId = String(data.taskId || "").trim();
  if (!taskId) return { ok: false, error: "invalid_task" };
  const sheet = getCrmTasksSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idIndex = headers.indexOf("taskId");
  const statusIndex = headers.indexOf("status");
  const completedIndex = headers.indexOf("completedAt");
  for (let index = 1; index < values.length; index++) {
    if (String(values[index][idIndex] || "") !== taskId) continue;
    sheet.getRange(index + 1, statusIndex + 1).setValue("done");
    sheet.getRange(index + 1, completedIndex + 1).setValue(new Date());
    return { ok: true, taskId: taskId };
  }
  return { ok: false, error: "task_not_found" };
}

function cancelCrmTask_(data) {
  const taskId = String(data.taskId || "").trim();
  if (!taskId) return { ok: false, error: "invalid_task" };
  const sheet = getCrmTasksSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idIndex = headers.indexOf("taskId");
  const statusIndex = headers.indexOf("status");
  const completedIndex = headers.indexOf("completedAt");
  for (let index = 1; index < values.length; index++) {
    if (String(values[index][idIndex] || "") !== taskId) continue;
    sheet.getRange(index + 1, statusIndex + 1).setValue("cancelled");
    if (completedIndex >= 0) sheet.getRange(index + 1, completedIndex + 1).setValue(new Date());
    return { ok: true, taskId: taskId };
  }
  return { ok: false, error: "task_not_found" };
}

function recordCrmActivity_(data) {
  const companyName = String(data.companyName || "").trim().replace(/\s+/g, " ").slice(0, 120);
  const companyKey = normalizeCompanyKey_(data.companyKey || companyName);
  if (!companyKey || cleanupReason_(companyName)) return { ok: false, error: "invalid_company" };
  const activity = appendCrmActivity_({
    companyKey: companyKey,
    companyName: companyName,
    type: data.type,
    stageFrom: data.stageFrom,
    stageTo: data.stageTo,
    value: data.value,
    reason: data.reason,
    note: data.note,
    owner: data.owner
  });
  return { ok: true, activity: activity };
}

function updateCrmActivity_(data) {
  const activityId = String(data.activityId || "").trim();
  if (!activityId) return { ok: false, error: "invalid_activity" };
  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (err) { return { ok: false, error: "activity_busy" }; }
  try {
    const sheet = getCrmActivitiesSheet_();
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(String);
    const idIndex = headers.indexOf("activityId");
    for (let index = 1; index < values.length; index++) {
      if (String(values[index][idIndex] || "") !== activityId) continue;
      const record = {};
      headers.forEach(function(header, columnIndex) { record[header] = values[index][columnIndex]; });
      record.type = String(data.type || record.type || "note").trim().slice(0, 40);
      record.note = String(data.note || "").trim().slice(0, 1000);
      record.updatedAt = new Date();
      const row = headers.map(function(header) { return record[header] !== undefined ? record[header] : ""; });
      sheet.getRange(index + 1, 1, 1, headers.length).setValues([row]);
      return { ok: true, activity: record };
    }
    return { ok: false, error: "activity_not_found" };
  } finally { lock.releaseLock(); }
}

function deleteCrmActivity_(data) {
  const activityId = String(data.activityId || "").trim();
  if (!activityId) return { ok: false, error: "invalid_activity" };
  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (err) { return { ok: false, error: "activity_busy" }; }
  try {
    const sheet = getCrmActivitiesSheet_();
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(String);
    const idIndex = headers.indexOf("activityId");
    const deletedIndex = headers.indexOf("deletedAt");
    for (let index = 1; index < values.length; index++) {
      if (String(values[index][idIndex] || "") !== activityId) continue;
      sheet.getRange(index + 1, deletedIndex + 1).setValue(new Date());
      return { ok: true, activityId: activityId };
    }
    return { ok: false, error: "activity_not_found" };
  } finally { lock.releaseLock(); }
}

function completeCrmAction_(data) {
  data.actionDoneAt = new Date();
  return upsertCrmClient_(data);
}

function archiveCrmClient_(data) {
  data.archivedAt = new Date();
  return upsertCrmClient_(data);
}

function updateCrmSettings_(data) {
  const allowedKeys = { monthlyTarget: true, targetMonth: true, companyDisplayName: true };
  const updates = data.settings && typeof data.settings === "object" ? data.settings : {};
  const keys = Object.keys(updates).filter(function(key) { return allowedKeys[key]; });
  if (!keys.length) return { ok: false, error: "no_settings" };
  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (err) { return { ok: false, error: "settings_busy" }; }
  try {
    const sheet = getCrmSettingsSheet_();
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(String);
    const keyIndex = headers.indexOf("key");
    keys.forEach(function(key) {
      let rowNumber = 0;
      for (let index = 1; index < values.length; index++) {
        if (String(values[index][keyIndex]) === key) { rowNumber = index + 1; break; }
      }
      const record = { key: key, value: String(updates[key]).slice(0, 240), updatedAt: new Date() };
      const row = headers.map(function(header) { return record[header] !== undefined ? record[header] : ""; });
      if (rowNumber) sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
      else sheet.appendRow(row);
    });
    return readCrmSettings_();
  } finally { lock.releaseLock(); }
}

function normalizeCatalogProducts_(value) {
  const source = Array.isArray(value) ? value : [];
  const byCode = {};
  source.slice(0, 10000).forEach(function(item) {
    const code = String(item && (item.productCode || item.code || item.codigo) || "").trim().slice(0, 80);
    if (!code) return;
    byCode[code] = {
      productCode: code,
      productName: String(item.productName || item.name || item.descricao || "").trim().replace(/\s+/g, " ").slice(0, 240),
      brand: String(item.brand || item.marca || "").trim().replace(/\s+/g, " ").slice(0, 80),
      stockQty: Math.max(0, number_(item.stockQty !== undefined ? item.stockQty : (item.stock !== undefined ? item.stock : item.estoque))),
      previousStockQty: 0,
      restockedAt: "",
      hasImage: Boolean(item.hasImage !== undefined ? item.hasImage : (item.image || item.imagem || item.imageUrl)),
      updatedAt: new Date()
    };
  });
  return Object.keys(byCode).map(function(code) { return byCode[code]; });
}

function createRestockTasks_(restockedProducts) {
  if (!restockedProducts.length) return { tasks: 0, clients: 0 };
  const productMap = {};
  restockedProducts.forEach(function(product) { productMap[String(product.productCode)] = product; });
  const eventSheet = getEventsSheet_();
  const eventValues = eventSheet.getDataRange().getValues();
  const eventHeaders = eventValues[0].map(String);
  const codeIndex = eventHeaders.indexOf("productCode");
  const companyIndex = eventHeaders.indexOf("companyName");
  const consultantIndex = eventHeaders.indexOf("consultant");
  const eventIndex = eventHeaders.indexOf("event");
  const interested = {};
  eventValues.slice(1).forEach(function(row) {
    const code = codeIndex >= 0 ? String(row[codeIndex] || "").trim() : "";
    if (!productMap[code]) return;
    const eventName = eventIndex >= 0 ? String(row[eventIndex] || "") : "";
    if (["product_open", "add_to_cart", "whatsapp_quote", "search"].indexOf(eventName) < 0) return;
    const companyName = companyIndex >= 0 ? String(row[companyIndex] || "").trim() : "";
    const companyKey = normalizeCompanyKey_(companyName);
    if (!companyKey || cleanupReason_(companyName)) return;
    const key = code + "|" + companyKey;
    interested[key] = {
      companyKey: companyKey,
      companyName: companyName,
      owner: consultantIndex >= 0 ? normalizeConsultor_(row[consultantIndex]) : "",
      product: productMap[code]
    };
  });

  const taskSheet = getCrmTasksSheet_();
  const taskHeaders = getHeaders_(taskSheet);
  const existingTasks = readStructuredRows_(taskSheet, "task");
  const existingKeys = {};
  existingTasks.forEach(function(task) {
    if (String(task.status || "") !== "open") return;
    existingKeys[normalizeCompanyKey_(task.companyKey || task.companyName) + "|" + String(task.title || "")] = true;
  });
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "America/Sao_Paulo", "yyyy-MM-dd");
  const rows = [];
  let clients = 0;
  Object.keys(interested).slice(0, 500).forEach(function(key) {
    const item = interested[key];
    const title = "Reposição disponível: " + item.product.productCode + " - " + item.product.productName;
    const taskKey = item.companyKey + "|" + title;
    if (existingKeys[taskKey]) return;
    existingKeys[taskKey] = true;
    clients++;
    const task = {
      taskId: uniqueId_("TASK"), companyKey: item.companyKey, companyName: item.companyName,
      title: title.slice(0, 220), dueAt: today, owner: item.owner, priority: "high", status: "open",
      createdAt: new Date(), completedAt: ""
    };
    rows.push(taskHeaders.map(function(header) { return task[header] !== undefined ? task[header] : ""; }));
    appendCrmActivity_({
      companyKey: item.companyKey, companyName: item.companyName, type: "stock_restored", owner: item.owner,
      note: (item.product.productCode + " - " + item.product.productName + " voltou ao estoque com " + item.product.stockQty + " unidade(s).").slice(0, 1000)
    });
  });
  if (rows.length) writeRowsInChunks_(taskSheet, taskSheet.getLastRow() + 1, rows);
  return { tasks: rows.length, clients: clients };
}

function syncCatalogSnapshot_(data) {
  if (!validateCatalogSync_(data)) return { ok: false, error: "invalid_sync_token" };
  const products = normalizeCatalogProducts_(data.products);
  const status = String(data.status || "success").toLowerCase() === "error" ? "error" : "success";
  if (status === "success" && !products.length) return { ok: false, error: "empty_catalog" };
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (err) { return { ok: false, error: "catalog_busy" }; }
  try {
    const productSheet = getCatalogProductsSheet_();
    const previous = readStructuredRows_(productSheet, "catalog");
    const previousMap = {};
    previous.forEach(function(item) { if (item.productCode) previousMap[String(item.productCode)] = item; });
    const currentMap = {};
    const restockedProducts = [];
    products.forEach(function(item) {
      const previousItem = previousMap[item.productCode] || {};
      const previousStock = number_(previousItem.stockQty || 0);
      item.previousStockQty = previousStock;
      item.restockedAt = previousStock <= 0 && item.stockQty > 0 ? new Date() : (previousItem.restockedAt || "");
      if (previousMap[item.productCode] && previousStock <= 0 && item.stockQty > 0) restockedProducts.push(item);
      currentMap[item.productCode] = item;
    });
    let newCount = 0;
    let changedStockCount = 0;
    products.forEach(function(item) {
      if (!previousMap[item.productCode]) newCount++;
      else if (number_(previousMap[item.productCode].stockQty) !== item.stockQty) changedStockCount++;
    });
    const removedCount = Object.keys(previousMap).filter(function(code) { return !currentMap[code]; }).length;

    if (status === "success") {
      const headers = getHeaders_(productSheet);
      const previousRows = Math.max(0, productSheet.getLastRow() - 1);
      if (previousRows) productSheet.getRange(2, 1, previousRows, headers.length).clearContent();
      const rows = products.map(function(item) { return headers.map(function(header) { return item[header] !== undefined ? item[header] : ""; }); });
      if (rows.length) writeRowsInChunks_(productSheet, 2, rows);
    }

    const inStockCount = products.filter(function(item) { return item.stockQty > 0; }).length;
    const missingImageCount = products.filter(function(item) { return !item.hasImage; }).length;
    const restockResult = status === "success" ? createRestockTasks_(restockedProducts) : { tasks: 0, clients: 0 };
    const snapshot = {
      snapshotId: uniqueId_("SNAP"),
      createdAt: new Date(),
      source: String(data.source || "catalog-daily-update").slice(0, 100),
      status: status,
      durationMs: Math.max(0, number_(data.durationMs || 0)),
      productCount: products.length || number_(data.productCount || 0),
      inStockCount: inStockCount,
      outOfStockCount: Math.max(0, products.length - inStockCount),
      missingImageCount: missingImageCount,
      newCount: newCount,
      removedCount: removedCount,
      changedStockCount: changedStockCount,
      errorMessage: String(data.errorMessage || "").slice(0, 500)
    };
    const snapshotSheet = getCatalogSnapshotsSheet_();
    const snapshotHeaders = getHeaders_(snapshotSheet);
    snapshotSheet.appendRow(snapshotHeaders.map(function(header) { return snapshot[header] !== undefined ? snapshot[header] : ""; }));
    return { ok: true, snapshot: snapshot, restockedProducts: restockedProducts.length, restockTasks: restockResult.tasks };
  } finally { lock.releaseLock(); }
}

function readCatalogHealth_() {
  const snapshots = readStructuredRows_(getCatalogSnapshotsSheet_(), "snapshot")
    .filter(function(item) { return item.snapshotId; })
    .sort(function(a, b) { return reservationDate_(b.createdAt).getTime() - reservationDate_(a.createdAt).getTime(); })
    .slice(0, 120);
  const products = readStructuredRows_(getCatalogProductsSheet_(), "catalog")
    .filter(function(item) { return item.productCode; });
  return { ok: true, snapshots: snapshots, products: products, latest: snapshots[0] || null };
}

function getCompanyFromEventRow_(row, headers) {
  const indexes = ["companyName", "empresa", "company"].map(function(header) { return headers.indexOf(header); });
  for (let index = 0; index < indexes.length; index++) {
    const columnIndex = indexes[index];
    if (columnIndex >= 0 && row[columnIndex] !== "" && row[columnIndex] !== null && row[columnIndex] !== undefined) {
      return String(row[columnIndex]).trim();
    }
  }
  return "";
}

function previewCleanupCandidates_() {
  const sheet = getEventsSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const createdAtIndex = headers.indexOf("createdAt");
  const candidates = {};

  values.slice(1).forEach(function(row) {
    const companyName = getCompanyFromEventRow_(row, headers);
    const reason = cleanupReason_(companyName);
    if (!reason) return;
    const companyKey = normalizeCompanyKey_(companyName);
    const candidateKey = companyKey || "__empty__";
    if (!candidates[candidateKey]) {
      candidates[candidateKey] = {
        companyKey: companyKey,
        companyName: companyName || "Empresa não informada",
        reason: reason,
        eventCount: 0,
        firstAt: "",
        lastAt: ""
      };
    }
    const item = candidates[candidateKey];
    item.eventCount++;
    const createdAt = createdAtIndex >= 0 ? row[createdAtIndex] : "";
    const date = reservationDate_(createdAt);
    if (date.getTime() > 0) {
      if (!item.firstAt || date < reservationDate_(item.firstAt)) item.firstAt = date;
      if (!item.lastAt || date > reservationDate_(item.lastAt)) item.lastAt = date;
    }
  });

  const list = Object.keys(candidates).map(function(key) { return candidates[key]; })
    .sort(function(a, b) { return b.eventCount - a.eventCount; });
  return {
    ok: true,
    candidates: list,
    candidateEvents: list.reduce(function(total, item) { return total + item.eventCount; }, 0)
  };
}

function writeRowsInChunks_(sheet, startRow, rows) {
  const chunkSize = 1000;
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize);
    sheet.getRange(startRow + offset, 1, chunk.length, chunk[0].length).setValues(chunk);
  }
}

function createCleanupBackup_(headers, rows, label) {
  if (!rows.length) return "";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const timezone = Session.getScriptTimeZone() || "America/Sao_Paulo";
  const stamp = Utilities.formatDate(new Date(), timezone, "yyyyMMdd-HHmmss");
  let name = ("BACKUP_" + label + "_" + stamp).slice(0, 95);
  let suffix = 1;
  while (ss.getSheetByName(name)) {
    name = ("BACKUP_" + label + "_" + stamp + "_" + suffix).slice(0, 99);
    suffix++;
  }
  const backup = ss.insertSheet(name);
  backup.getRange(1, 1, 1, headers.length).setValues([headers]);
  writeRowsInChunks_(backup, 2, rows);
  backup.setFrozenRows(1);
  return name;
}

function replaceEventRows_(sheet, headers, rows) {
  const previousRows = Math.max(0, sheet.getLastRow() - 1);
  if (previousRows) sheet.getRange(2, 1, previousRows, headers.length).clearContent();
  if (rows.length) writeRowsInChunks_(sheet, 2, rows);
}

function cleanupSelectedCompanies_(data) {
  if (!validateAdminAccess_(data)) return { ok: false, error: "unauthorized" };
  const requestedKeys = Array.isArray(data.companyKeys) ? data.companyKeys.slice(0, 100) : [];
  const selected = {};
  requestedKeys.forEach(function(value) {
    const key = normalizeCompanyKey_(value);
    selected[key || "__empty__"] = true;
  });
  if (!Object.keys(selected).length) return { ok: false, error: "no_companies_selected" };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(ADMIN_LOCK_WAIT_MS);
  } catch (err) {
    return { ok: false, error: "cleanup_busy" };
  }

  try {
    const sheet = getEventsSheet_();
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(String);
    const keep = [];
    const removed = [];
    const removedCompanies = {};

    values.slice(1).forEach(function(row) {
      const companyName = getCompanyFromEventRow_(row, headers);
      const companyKey = normalizeCompanyKey_(companyName) || "__empty__";
      const isAllowedCandidate = Boolean(cleanupReason_(companyName));
      if (selected[companyKey] && isAllowedCandidate) {
        removed.push(row);
        removedCompanies[companyName || "Empresa não informada"] = true;
      } else {
        keep.push(row);
      }
    });
    if (!removed.length) return { ok: false, error: "nothing_to_cleanup" };

    const backupSheet = createCleanupBackup_(headers, removed, "LIMPEZA");
    replaceEventRows_(sheet, headers, keep);
    return {
      ok: true,
      removedEvents: removed.length,
      removedCompanies: Object.keys(removedCompanies),
      backupSheet: backupSheet
    };
  } finally {
    lock.releaseLock();
  }
}

function mergeCompanies_(data) {
  if (!validateAdminAccess_(data)) return { ok: false, error: "unauthorized" };
  const merges = Array.isArray(data.merges) ? data.merges.slice(0, 50) : [];
  if (!merges.length) return { ok: false, error: "no_merges_selected" };

  const normalizedMerges = merges.map(function(item) {
    return {
      sourceName: String(item.sourceName || "").trim().replace(/\s+/g, " ").slice(0, 120),
      targetName: String(item.targetName || "").trim().replace(/\s+/g, " ").slice(0, 120)
    };
  }).filter(function(item) {
    return item.sourceName && item.targetName && item.sourceName !== item.targetName && !cleanupReason_(item.targetName);
  });
  if (!normalizedMerges.length) return { ok: false, error: "invalid_merges" };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(ADMIN_LOCK_WAIT_MS);
  } catch (err) {
    return { ok: false, error: "merge_busy" };
  }

  try {
    const sheet = getEventsSheet_();
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(String);
    const companyColumns = ["companyName", "empresa", "company"]
      .map(function(header) { return headers.indexOf(header); })
      .filter(function(index) { return index >= 0; });
    const changedRows = [];
    const mergeBySource = {};
    normalizedMerges.forEach(function(item) { mergeBySource[item.sourceName.toLowerCase()] = item.targetName; });

    values.slice(1).forEach(function(row) {
      const companyName = getCompanyFromEventRow_(row, headers);
      const targetName = mergeBySource[String(companyName || "").trim().replace(/\s+/g, " ").toLowerCase()];
      if (!targetName || targetName === String(companyName || "").trim().replace(/\s+/g, " ")) return;
      changedRows.push(row.slice());
      companyColumns.forEach(function(columnIndex) { row[columnIndex] = targetName; });
    });
    const backupSheets = [];
    if (changedRows.length) {
      const backupSheet = createCleanupBackup_(headers, changedRows, "UNIFICACAO_EVENTOS");
      if (backupSheet) backupSheets.push(backupSheet);
      replaceEventRows_(sheet, headers, values.slice(1));
    }

    [
      { sheet: getCrmClientsSheet_(), nameHeader: "companyName", keyHeader: "companyKey", label: "CRM_CLIENTS" },
      { sheet: getCrmTasksSheet_(), nameHeader: "companyName", keyHeader: "companyKey", label: "CRM_TASKS" },
      { sheet: getCrmActivitiesSheet_(), nameHeader: "companyName", keyHeader: "companyKey", label: "CRM_ACTIVITIES" },
      { sheet: getReservationsSheet_(), nameHeader: "companyName", keyHeader: "", label: "RESERVATIONS" },
      { sheet: getOffersSheet_(), nameHeader: "clientName", keyHeader: "", label: "OFFERS" }
    ].forEach(function(config) {
      const structuredSheet = config.sheet;
      const structuredValues = structuredSheet.getDataRange().getValues();
      if (structuredValues.length < 2) return;
      const structuredHeaders = structuredValues[0].map(String);
      const nameIndex = structuredHeaders.indexOf(config.nameHeader);
      const keyIndex = config.keyHeader ? structuredHeaders.indexOf(config.keyHeader) : -1;
      if (nameIndex < 0) return;
      const structuredChanged = [];
      structuredValues.slice(1).forEach(function(row) {
        const currentName = String(row[nameIndex] || "").trim().replace(/\s+/g, " ");
        const targetName = mergeBySource[currentName.toLowerCase()];
        if (!targetName || targetName === currentName) return;
        structuredChanged.push(row.slice());
        row[nameIndex] = targetName;
        if (keyIndex >= 0) row[keyIndex] = normalizeCompanyKey_(targetName);
      });
      if (!structuredChanged.length) return;
      const structuredBackup = createCleanupBackup_(structuredHeaders, structuredChanged, "UNIFICACAO_" + config.label);
      if (structuredBackup) backupSheets.push(structuredBackup);
      let outputRows = structuredValues.slice(1);
      if (config.label === "CRM_CLIENTS") {
        const uniqueRows = [];
        const rowByKey = {};
        outputRows.forEach(function(row, index) {
          const key = normalizeCompanyKey_(keyIndex >= 0 ? row[keyIndex] : row[nameIndex]) || ("__row_" + index);
          if (rowByKey[key] === undefined) {
            rowByKey[key] = uniqueRows.length;
            uniqueRows.push(row);
            return;
          }
          const targetRow = uniqueRows[rowByKey[key]];
          row.forEach(function(value, columnIndex) {
            if ((targetRow[columnIndex] === "" || targetRow[columnIndex] === null) && value !== "" && value !== null) targetRow[columnIndex] = value;
          });
        });
        outputRows = uniqueRows;
      }
      replaceEventRows_(structuredSheet, structuredHeaders, outputRows);
      changedRows.push.apply(changedRows, structuredChanged);
    });
    if (!changedRows.length) return { ok: false, error: "nothing_to_merge" };
    return { ok: true, mergedEvents: changedRows.length, backupSheet: backupSheets.join(", "), backupSheets: backupSheets };
  } finally {
    lock.releaseLock();
  }
}

function deleteCompanyData_(data) {
  if (!validateAdminAccess_(data)) return { ok: false, error: "unauthorized" };
  const selected = {};
  (Array.isArray(data.companyKeys) ? data.companyKeys.slice(0, 100) : []).forEach(function(value) {
    const key = normalizeCompanyKey_(value);
    if (key) selected[key] = true;
  });
  if (!Object.keys(selected).length) return { ok: false, error: "no_companies_selected" };

  const allowedScopes = {
    events: true,
    crm_clients: true,
    crm_tasks: true,
    crm_activities: true,
    reservations: true,
    offers: true
  };
  const scopes = (Array.isArray(data.scopes) ? data.scopes.slice(0, 10) : [])
    .map(String)
    .filter(function(scope) { return allowedScopes[scope]; });
  if (!scopes.length) return { ok: false, error: "no_delete_scopes" };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(ADMIN_LOCK_WAIT_MS);
  } catch (err) {
    return { ok: false, error: "delete_busy" };
  }

  try {
    const configs = {
      events: { sheet: getEventsSheet_(), nameHeader: "", keyHeader: "", label: "EXCLUSAO_EVENTOS" },
      crm_clients: { sheet: getCrmClientsSheet_(), nameHeader: "companyName", keyHeader: "companyKey", label: "EXCLUSAO_CRM_CLIENTS" },
      crm_tasks: { sheet: getCrmTasksSheet_(), nameHeader: "companyName", keyHeader: "companyKey", label: "EXCLUSAO_CRM_TASKS" },
      crm_activities: { sheet: getCrmActivitiesSheet_(), nameHeader: "companyName", keyHeader: "companyKey", label: "EXCLUSAO_CRM_ACTIVITIES" },
      reservations: { sheet: getReservationsSheet_(), nameHeader: "companyName", keyHeader: "", label: "EXCLUSAO_RESERVATIONS" },
      offers: { sheet: getOffersSheet_(), nameHeader: "clientName", keyHeader: "", label: "EXCLUSAO_OFFERS" }
    };
    const removedByScope = {};
    const backupSheets = [];
    let totalRemoved = 0;

    scopes.forEach(function(scope) {
      const config = configs[scope];
      const sheet = config.sheet;
      const values = sheet.getDataRange().getValues();
      if (!values.length) { removedByScope[scope] = 0; return; }
      const headers = values[0].map(String);
      const nameIndex = config.nameHeader ? headers.indexOf(config.nameHeader) : -1;
      const keyIndex = config.keyHeader ? headers.indexOf(config.keyHeader) : -1;
      const keep = [];
      const removed = [];
      values.slice(1).forEach(function(row) {
        let key = "";
        if (scope === "events") key = normalizeCompanyKey_(getCompanyFromEventRow_(row, headers));
        else if (keyIndex >= 0) key = normalizeCompanyKey_(row[keyIndex] || (nameIndex >= 0 ? row[nameIndex] : ""));
        else if (nameIndex >= 0) key = normalizeCompanyKey_(row[nameIndex]);
        if (key && selected[key]) removed.push(row);
        else keep.push(row);
      });
      removedByScope[scope] = removed.length;
      if (!removed.length) return;
      const backupSheet = createCleanupBackup_(headers, removed, config.label);
      if (backupSheet) backupSheets.push(backupSheet);
      replaceEventRows_(sheet, headers, keep);
      totalRemoved += removed.length;
    });

    return {
      ok: true,
      totalRemoved: totalRemoved,
      removedByScope: removedByScope,
      backupSheets: backupSheets
    };
  } finally {
    lock.releaseLock();
  }
}

function clearEvents_(data) {
  if (!validateAdminAccess_(data)) return { ok: false, error: "unauthorized" };

  const sheet = getEventsSheet_();
  const lastRow = sheet.getLastRow();
  const rowsToDelete = Math.max(0, lastRow - 1);

  if (rowsToDelete > 0) {
    sheet.deleteRows(2, rowsToDelete);
  }

  return { ok: true, cleared: true, clearedRows: rowsToDelete };
}

function doPost(e) {
  const data = parseBody_(e);
  const action = data.action || "track";

  if (action === "track") return jsonOutput(appendEvent_(data));
  if (action === "create_offer_short") return jsonOutput(createShortOffer_(data));
  if (action === "sync_reservations") return jsonOutput(syncReservations_(data));
  if (action === "quote_reservations") return jsonOutput(quoteReservations_(data));
  if (action === "release_reservations") return jsonOutput(releaseReservations_(data));
  if (action === "catalog_snapshot") return jsonOutput(syncCatalogSnapshot_(data));

  const adminActions = {
    upsert_crm_client: true,
    upsert_crm_task: true,
    complete_crm_task: true,
    cancel_crm_task: true,
    complete_crm_action: true,
    archive_crm_client: true,
    record_crm_activity: true,
    update_crm_activity: true,
    delete_crm_activity: true,
    update_crm_settings: true,
    cleanup_selected_companies: true,
    merge_companies: true,
    delete_company_data: true,
    clear_events: true,
    reset: true,
    clear: true
  };
  if (adminActions[action] && !validateAdminAccess_(data)) return jsonOutput({ ok: false, error: "unauthorized" });

  if (action === "upsert_crm_client") return jsonOutput(upsertCrmClient_(data));
  if (action === "upsert_crm_task") return jsonOutput(upsertCrmTask_(data));
  if (action === "complete_crm_task") return jsonOutput(completeCrmTask_(data));
  if (action === "cancel_crm_task") return jsonOutput(cancelCrmTask_(data));
  if (action === "complete_crm_action") return jsonOutput(completeCrmAction_(data));
  if (action === "archive_crm_client") return jsonOutput(archiveCrmClient_(data));
  if (action === "record_crm_activity") return jsonOutput(recordCrmActivity_(data));
  if (action === "update_crm_activity") return jsonOutput(updateCrmActivity_(data));
  if (action === "delete_crm_activity") return jsonOutput(deleteCrmActivity_(data));
  if (action === "update_crm_settings") return jsonOutput(updateCrmSettings_(data));
  if (action === "cleanup_selected_companies") return jsonOutput(cleanupSelectedCompanies_(data));
  if (action === "merge_companies") return jsonOutput(mergeCompanies_(data));
  if (action === "delete_company_data") return jsonOutput(deleteCompanyData_(data));
  if (action === "clear_events" || action === "reset" || action === "clear") return jsonOutput(clearEvents_(data));

  return jsonOutput({ ok: false, error: "invalid_action" });
}

function doGet(e) {
  const action = e && e.parameter && (e.parameter.action || e.parameter.mode);
  const params = e && e.parameter ? e.parameter : {};

  if (action === "resolve_offer_short") return jsonOutput(resolveShortOffer_((e.parameter || {}).code));
  if (action === "reservations_public") return jsonOutput(getPublicReservations_((e.parameter || {}).sessionId));
  if (action === "track") return jsonOutput(appendEvent_(params));

  const adminReads = {
    events: true,
    summary: true,
    reservations_admin: true,
    crm_clients: true,
    crm_tasks: true,
    crm_activities: true,
    crm_settings: true,
    catalog_health: true,
    cleanup_candidates: true,
    clear_events: true,
    reset: true,
    clear: true
  };
  if (adminReads[action] && !validateAdminAccess_(params)) return jsonOutput({ ok: false, error: "unauthorized" });

  if (action === "events") return jsonOutput(readEvents_());
  if (action === "summary") return jsonOutput(getSummary_());
  if (action === "reservations_admin") return jsonOutput(getAdminReservations_());
  if (action === "crm_clients") return jsonOutput(readCrmClients_());
  if (action === "crm_tasks") return jsonOutput(readCrmTasks_());
  if (action === "crm_activities") return jsonOutput(readCrmActivities_());
  if (action === "crm_settings") return jsonOutput(readCrmSettings_());
  if (action === "catalog_health") return jsonOutput(readCatalogHealth_());
  if (action === "cleanup_candidates") return jsonOutput(previewCleanupCandidates_());
  if (action === "clear_events" || action === "reset" || action === "clear") return jsonOutput(clearEvents_(params));

  return jsonOutput({ ok: true, service: "Z Connect Analytics CRM 12.1 + Reservas V1" });
}
