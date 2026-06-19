function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("EVENTS");
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.event || "",
    data.consultor || "",
    data.query || "",
    data.productCode || "",
    data.productName || "",
    data.brand || "",
    data.price || "",
    data.quantity || "",
    data.total || "",
    data.page || "",
    data.userAgent || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const mode = e && e.parameter && e.parameter.mode;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (mode === "events") {
    const sheet = ss.getSheetByName("EVENTS");
    const values = sheet.getDataRange().getValues();

    const rows = values.slice(1).map(function(row) {
      return {
        createdAt: row[0],
        event: row[1],
        consultor: row[2],
        query: row[3],
        productCode: row[4],
        productName: row[5],
        brand: row[6],
        price: row[7],
        quantity: row[8],
        total: row[9],
        page: row[10],
        userAgent: row[11]
      };
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, events: rows }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "Z Connect Analytics" }))
    .setMimeType(ContentService.MimeType.JSON);
}
