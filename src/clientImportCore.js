const HEADER_FIELDS = [
  ["customerCode", ["codigo"]],
  ["taxId", ["cpf/cnpj", "cpfcnpj"]],
  ["companyName", ["nome/razao social", "razao social", "nome"]],
  ["phone", ["telefone"]],
  ["city", ["municipio"]],
  ["state", ["uf"]],
  ["address", ["endereco"]],
  ["route", ["rotas", "rota"]],
  ["daysWithoutPurchase", ["s/ comprar", "sem comprar"]]
];

const FALLBACK_RATIOS = {
  customerCode: 0.035, taxId: 0.085, companyName: 0.205, phone: 0.535,
  city: 0.645, state: 0.79, address: 0.825, route: 0.925, daysWithoutPurchase: 0.972
};

const EXCEL_ALIASES = {
  customerCode: ["codigo", "codigo cliente", "cod cliente", "cliente codigo", "customer code"],
  taxId: ["cpf/cnpj", "cpf cnpj", "cnpj", "cpf", "documento"],
  companyName: ["nome/razao social", "nome razao social", "razao social", "nome", "empresa", "cliente"],
  contactName: ["contato", "nome contato", "responsavel contato"],
  phone: ["telefone", "fone", "celular", "whatsapp"],
  email: ["email", "e-mail"],
  city: ["municipio", "cidade"], state: ["uf", "estado"],
  address: ["endereco", "logradouro"], route: ["rotas", "rota"],
  daysWithoutPurchase: ["s/ comprar", "sem comprar", "dias sem comprar", "dias sem compra"]
};

export function normalizedText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function digits(value) { return String(value || "").replace(/\D/g, ""); }

export function formatTaxId(value) {
  const number = digits(value);
  if (number.length === 14) return number.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (number.length === 11) return number.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return String(value || "").replace(/\s+/g, "").trim();
}

export function formatPhone(value) {
  const number = digits(value);
  if (number.length === 11) return number.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (number.length === 10) return number.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanCell(items, compact = false) {
  const value = items.sort((a, b) => b.y - a.y || a.x - b.x).map((item) => item.str).join(compact ? "" : " ");
  return value.replace(/\s+/g, " ").trim();
}

function headerStarts(page) {
  const starts = {};
  HEADER_FIELDS.forEach(([field, aliases]) => {
    const item = page.items.find((candidate) => aliases.some((alias) => normalizedText(candidate.str).includes(alias)));
    starts[field] = item ? item.x : FALLBACK_RATIOS[field] * page.width;
  });
  return starts;
}

function fieldForX(x, starts) {
  const ordered = HEADER_FIELDS.map(([field]) => [field, starts[field]]).sort((a, b) => a[1] - b[1]);
  let selected = ordered[0][0];
  for (const [field, start] of ordered) {
    if (x + 2 >= start) selected = field;
    else break;
  }
  return selected;
}

function looksLikePhone(value) {
  return /^\(?\d{2}\)?[\s-]*\d{3,5}/.test(String(value || "").trim());
}

function semanticRepair(rowItems, codeItem, starts, parsed) {
  const ordered = [...rowItems].sort((a, b) => a.x - b.x || b.y - a.y);
  const taxItems = ordered.filter((item) => { const count = digits(item.str).length; return (count === 11 || count === 14) && !looksLikePhone(item.str); });
  const phoneAnchor = ordered.find((item) => /^\(\d{2}\)/.test(String(item.str || "").trim()));
  const stateAnchor = ordered.find((item) => item.x > (phoneAnchor?.x || starts.phone) && /^[A-Z]{2}$/.test(String(item.str || "").trim().toUpperCase()));
  if (!phoneAnchor || !stateAnchor) return parsed;
  const cityAnchor = ordered.filter((item) => item.x > phoneAnchor.x + 12 && item.x < stateAnchor.x && /[A-Za-zÀ-ÿ]{3}/.test(String(item.str || "")) && !looksLikePhone(item.str)).sort((a, b) => a.x - b.x)[0];
  if (!cityAnchor) return parsed;
  const companyLeft = taxItems.length ? Math.max(...taxItems.map((item) => item.x + 10)) : (starts.taxId + starts.companyName) / 2 - 20;
  const companyItems = ordered.filter((item) => item !== codeItem && !taxItems.includes(item) && item.x > companyLeft && item.x < phoneAnchor.x - 8 && !/^\d{3,8}$/.test(String(item.str || "").trim()));
  const phoneItems = ordered.filter((item) => item.x >= phoneAnchor.x - 2 && item.x < cityAnchor.x - 4 && !companyItems.includes(item));
  const cityItems = ordered.filter((item) => item.x >= cityAnchor.x - 2 && item.x < stateAnchor.x - 3);
  const daysAnchor = ordered.find((item) => /\d+\s*dias?/i.test(String(item.str || "")));
  const routeBoundary = Math.max(stateAnchor.x + 18, (starts.address + starts.route) / 2);
  const afterState = ordered.filter((item) => item.x > stateAnchor.x + 3 && (!daysAnchor || item.x < daysAnchor.x - 2));
  const companyName = cleanCell(companyItems);
  if (!companyName) return parsed;
  return { ...parsed, taxId: formatTaxId(cleanCell(taxItems, true)), companyName, phone: formatPhone(cleanCell(phoneItems, true)), city: cleanCell(cityItems), state: String(stateAnchor.str || "").trim().toUpperCase(), address: cleanCell(afterState.filter((item) => item.x < routeBoundary)), route: cleanCell(afterState.filter((item) => item.x >= routeBoundary)) || parsed.route };
}

export function parseSiggmaPdfPages(pages) {
  if (!pages?.length) return [];
  const starts = headerStarts(pages[0]);
  const rows = [];
  pages.forEach((page) => {
    const codeLimit = (starts.taxId + starts.customerCode) / 2;
    const codes = page.items
      .filter((item) => /^\d{3,8}$/.test(String(item.str || "").trim()) && item.x < codeLimit)
      .sort((a, b) => b.y - a.y);
    codes.forEach((codeItem, index) => {
      const upper = index ? (codes[index - 1].y + codeItem.y) / 2 : codeItem.y + 30;
      const lower = index + 1 < codes.length ? (codeItem.y + codes[index + 1].y) / 2 : codeItem.y - 30;
      const cells = Object.fromEntries(HEADER_FIELDS.map(([field]) => [field, []]));
      const rowItems = page.items.filter((item) => item.y <= upper && item.y > lower);
      rowItems.forEach((item) => {
        const field = fieldForX(item.x, starts);
        if (cells[field]) cells[field].push(item);
      });
      const companyName = cleanCell(cells.companyName).replace(/\s+/g, " ").trim();
      if (!companyName || normalizedText(companyName).includes("razao social")) return;
      const daysText = cleanCell(cells.daysWithoutPurchase);
      const parsed = {
        customerCode: String(codeItem.str).trim(),
        taxId: formatTaxId(cleanCell(cells.taxId, true)),
        companyName,
        contactName: "",
        phone: formatPhone(cleanCell(cells.phone, true)),
        email: "",
        city: cleanCell(cells.city),
        state: cleanCell(cells.state).replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase(),
        address: cleanCell(cells.address),
        route: cleanCell(cells.route),
        daysWithoutPurchase: Number((daysText.match(/\d+/) || [0])[0]),
        source: "pdf"
      };
      const suspiciousShift = !/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(parsed.taxId) && looksLikePhone(parsed.companyName);
      rows.push(suspiciousShift ? semanticRepair(rowItems, codeItem, starts, parsed) : parsed);
    });
  });
  return rows;
}

function headerField(value) {
  const key = normalizedText(value);
  for (const [field, aliases] of Object.entries(EXCEL_ALIASES)) {
    if (aliases.some((alias) => key === alias || key.includes(alias))) return field;
  }
  return null;
}

export function parseExcelMatrix(matrix) {
  const headerIndex = matrix.slice(0, 15).findIndex((row) => {
    const fields = row.map(headerField).filter(Boolean);
    return fields.includes("companyName") && (fields.includes("customerCode") || fields.includes("taxId"));
  });
  if (headerIndex < 0) throw new Error("Não encontrei as colunas Código, CPF/CNPJ e Nome/Razão social.");
  const mapping = matrix[headerIndex].map(headerField);
  return matrix.slice(headerIndex + 1).map((values) => {
    const row = { source: "excel" };
    mapping.forEach((field, index) => { if (field && values[index] !== undefined && values[index] !== null) row[field] = String(values[index]).trim(); });
    row.taxId = formatTaxId(row.taxId);
    row.phone = formatPhone(row.phone);
    row.daysWithoutPurchase = Number(String(row.daysWithoutPurchase || "").replace(/\D/g, "") || 0);
    row.state = String(row.state || "").slice(0, 2).toUpperCase();
    return row;
  }).filter((row) => row.companyName && (row.customerCode || row.taxId));
}

export function classifyImportedClients(rows, existingClients = [], duplicateStrategy = "update") {
  const byKey = new Set(existingClients.map((item) => normalizedText(item.companyKey || item.companyName)).filter(Boolean));
  const byCode = new Set(existingClients.map((item) => normalizedText(item.customerCode)).filter(Boolean));
  const byTax = new Set(existingClients.map((item) => digits(item.taxId)).filter(Boolean));
  const seen = new Set();
  return rows.map((row, index) => {
    const identity = digits(row.taxId) || normalizedText(row.customerCode) || normalizedText(row.companyName);
    const duplicate = byKey.has(normalizedText(row.companyName)) || byCode.has(normalizedText(row.customerCode)) || (digits(row.taxId) && byTax.has(digits(row.taxId)));
    const repeated = seen.has(identity);
    seen.add(identity);
    const valid = Boolean(row.companyName && (row.customerCode || row.taxId)) && !repeated;
    return { ...row, rowNumber: index + 1, valid, duplicate, repeated, action: !valid ? "error" : duplicate && duplicateStrategy === "skip" ? "skip" : duplicate ? "update" : "create" };
  });
}
