import { normalizeConsultant, normalizeCompany } from "./normalization.js";
import { isAnonymousCompany } from "./company-utils.js";
import {
  productFromEvent,
  productLabel,
  productQuantity,
  quoteProducts,
  quoteProductsSummary
} from "./product-utils.js";
import {
  startOfDay,
  localDateInput,
  dateTime
} from "./dates.js";
function dateGroupKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "sem-data";
  return localDateInput(date);
}

function dateGroupLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diff = Math.round((today - target) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function groupItemsByDate(items = [], valueFn = (item) => item.timestamp) {
  const groups = new Map();
  items.forEach((item) => {
    const value = valueFn(item);
    const key = dateGroupKey(value);
    if (!groups.has(key)) groups.set(key, { key, label: dateGroupLabel(value), items: [] });
    groups.get(key).items.push(item);
  });
  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
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

function quotedProductRows(rows) {
  return [...rows]
    .filter((row) => row.quotes > 0)
    .sort((a, b) => b.quotes - a.quotes || b.score - a.score)
    .map((row, index) => ({ ...row, position: index + 1 }));
}

function noResultDemandRows(events) {
  const map = new Map();

  events.forEach((event) => {
    const query = String(event.query || "").trim();
    if (!query) return;
    const key = query.toLowerCase();

    if (!map.has(key)) {
      map.set(key, {
        search: query,
        count: 0,
        companiesSet: new Set(),
        consultantsSet: new Set(),
        lastEventDate: null
      });
    }

    const row = map.get(key);
    row.count += 1;
    row.companiesSet.add(normalizeCompany(event.companyName));
    row.consultantsSet.add(normalizeConsultant(event.consultant).toUpperCase());

    const currentDate = new Date(event.timestamp);
    if (!Number.isNaN(currentDate.getTime()) && (!row.lastEventDate || currentDate > row.lastEventDate)) {
      row.lastEventDate = currentDate;
    }
  });

  return [...map.values()]
    .sort((a, b) => b.count - a.count)
    .map((row, index) => {
      const companyNames = [...row.companiesSet].filter((item) => !isAnonymousCompany(item));
      const companies = row.companiesSet.size;
      const consultants = row.consultantsSet.size;
      const formatted = {
        id: `no-result-${index}-${row.search}`,
        position: index + 1,
        search: row.search,
        count: row.count,
        companies,
        companyList: companyNames.slice(0, 3).join(", ") || "-",
        consultants,
        lastEvent: row.lastEventDate ? dateTime(row.lastEventDate) : "-",
        _search: ""
      };
      formatted._search = [
        formatted.position,
        formatted.search,
        formatted.count,
        formatted.companies,
        formatted.consultants,
        formatted.lastEvent
      ].join(" ").toLowerCase();
      return formatted;
    });
}


function periodLabel(value, customStart = "", customEnd = "") {
  const labels = {
    today: "Hoje",
    yesterday: "Ontem",
    week: "Esta semana",
    month: "Este mês",
    last_month: "Mês anterior",
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    all: "Tudo"
  };
  if (value === "custom") {
    const format = (date) => date ? new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR") : "…";
    return `${format(customStart)} até ${format(customEnd)}`;
  }
  return labels[value] || value;
}

function fileDateStamp() {
  const d = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function slugifyFilePart(value) {
  return String(value || "todos")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "todos";
}
export {
  dateGroupKey,
  dateGroupLabel,
  groupItemsByDate,
  eventDetail,
  productRank,
  quotedProductRows,
  noResultDemandRows,
  periodLabel,
  fileDateStamp,
  slugifyFilePart
};
