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
  const raw = String(value || "0").trim().replace(/[^0-9,.-]/g, "");
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  return Number(normalized) || 0;
}

export {
  normalizeConsultant,
  normalizeCompany,
  safeNumber
};
