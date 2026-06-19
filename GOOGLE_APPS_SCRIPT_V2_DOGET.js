const EVENTS_SHEET = "EVENTS";

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
    sheet.appendRow([
      "createdAt",
      "event",
      "consultor",
      "query",
      "productCode",
      "productName",
      "brand",
      "price",
      "quantity",
      "total",
      "page",
      "userAgent",
      "sessionId",
      "eventId"
    ]);
  }

  return sheet;
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

function appendEvent_(data) {
  const sheet = getEventsSheet_();
  const consultor = normalizeConsultor_(data.consultor || data.consultant || data.consultant_slug);

  sheet.appendRow([
    data.createdAt ? new Date(data.createdAt) : new Date(),
    data.event || "",
    consultor,
    data.query || "",
    data.productCode || data.codigo || "",
    data.productName || data.descricao || "",
    data.brand || data.marca || "",
    Number(data.price || data.preco || 0),
    Number(data.quantity || data.quantidade || 0),
    Number(data.total || data.cart_total || 0),
    data.page || "",
    data.userAgent || "",
    data.sessionId || "",
    data.eventId || ""
  ]);

  return { ok: true };
}

function readEvents_() {
  const sheet = getEventsSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1).map(function(row, index) {
    return {
      id: "row-" + (index + 2),
      createdAt: row[0],
      event: row[1],
      consultor: row[2],
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
      sessionId: row[12] || "",
      eventId: row[13] || ""
    };
  });

  return { ok: true, events: rows };
}

function doPost(e) {
  const data = parseBody_(e);
  const action = data.action || "track";

  if (action === "track") return jsonOutput(appendEvent_(data));

  return jsonOutput({ ok: false, error: "invalid_action" });
}

function doGet(e) {
  const action = e && e.parameter && (e.parameter.action || e.parameter.mode);

  if (action === "events") return jsonOutput(readEvents_());

  if (action === "track") {
    const params = e.parameter || {};
    return jsonOutput(appendEvent_(params));
  }

  return jsonOutput({ ok: true, service: "Z Connect Analytics V7" });
}
