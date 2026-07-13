const EVENTS_SHEET = "EVENTS";
const OFFERS_SHEET = "OFFERS";
const RESERVATIONS_SHEET = "RESERVATIONS";
const ACTIVE_RESERVATION_TTL_MS = 20 * 60 * 1000;
const QUOTED_RESERVATION_TTL_MS = 60 * 60 * 1000;
const RESERVATION_HISTORY_RETENTION_MS = 48 * 60 * 60 * 1000;

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
  return Number(String(value || "0").replace(/\./g, "").replace(",", ".")) || 0;
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

function clearEvents_(data) {
  const configuredPin = String(PropertiesService.getScriptProperties().getProperty("ANALYTICS_ADMIN_PIN") || "").trim();
  const requestedPin = String(data.pin || data.adminPin || data.admin_pin || "").trim();

  if (configuredPin && requestedPin !== configuredPin) {
    return { ok: false, error: "invalid_pin" };
  }

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
  if (action === "clear_events" || action === "reset" || action === "clear") return jsonOutput(clearEvents_(data));

  return jsonOutput({ ok: false, error: "invalid_action" });
}

function doGet(e) {
  const action = e && e.parameter && (e.parameter.action || e.parameter.mode);

  if (action === "events") return jsonOutput(readEvents_());
  if (action === "summary") return jsonOutput(getSummary_());
  if (action === "resolve_offer_short") return jsonOutput(resolveShortOffer_((e.parameter || {}).code));
  if (action === "reservations_public") return jsonOutput(getPublicReservations_((e.parameter || {}).sessionId));
  if (action === "reservations_admin") return jsonOutput(getAdminReservations_());
  if (action === "clear_events" || action === "reset" || action === "clear") return jsonOutput(clearEvents_(e.parameter || {}));

  if (action === "track") {
    const params = e.parameter || {};
    return jsonOutput(appendEvent_(params));
  }

  return jsonOutput({ ok: true, service: "Z Connect Analytics V9.1 + Reservas V1" });
}
