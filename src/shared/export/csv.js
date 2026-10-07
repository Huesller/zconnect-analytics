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

export {
  csvEscape,
  downloadBlob,
  exportRowsCsv
};
