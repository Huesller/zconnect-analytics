function companyKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAnonymousCompany(value) {
  const company = String(value || "").trim().toLowerCase();

  return company === "não identificado" ||
    company === "nao identificado" ||
    company === "empresa não informada" ||
    company === "empresa nao informada" ||
    company === "não informada" ||
    company === "nao informada";
}

function cleanupReason(value) {
  const key = companyKey(value);

  if (
    !key ||
    [
      "nao identificado",
      "empresa nao informada",
      "nao informada",
      "anonimo",
      "visitante",
      "sem empresa"
    ].includes(key)
  ) {
    return "Empresa não identificada";
  }

  if (key.split(" ").some((token) => /^(teste|testes|test|testing)\d*$/.test(token))) {
    return "Nome de teste";
  }

  return "";
}

function duplicateCompanyKey(value) {
  return companyKey(value)
    .replace(/\b(ltda|eireli|mei|me|sa)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export {
  companyKey,
  isAnonymousCompany,
  cleanupReason,
  duplicateCompanyKey
};
