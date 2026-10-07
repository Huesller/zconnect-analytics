import { normalizeConsultant, normalizeCompany, safeNumber } from "../../../shared/normalization.js";
import { productFromEvent, productLabel, productQuantity, productValue, quoteProducts, quoteProductsSummary, quoteItemsCount } from "../../../shared/product-utils.js";
import { money, percent } from "../../../shared/formatting.js";
import { dateTime } from "../../../shared/dates.js";
import { commercialEventScore } from "../../commercial-intelligence/engine/commercial-engine.js";
function sheetTitle(title, subtitle = "") {
  const rows = [{ values: [title], styleId: "title" }];
  if (subtitle) rows.push({ values: [subtitle], styleId: "subtitle" });
  rows.push({ values: [] });
  return rows;
}

function tableRows(title, columns, rows) {
  return [
    ...sheetTitle(title),
    { values: columns.map((column) => column.label), styleId: "header" },
    ...rows.map((row) => ({ values: columns.map((column) => row[column.key] ?? "") }))
  ];
}

function rawEventRows(events) {
  const columns = [
    { key: "timestamp", label: "Timestamp" },
    { key: "event", label: "Evento" },
    { key: "companyName", label: "Empresa" },
    { key: "consultant", label: "Consultor" },
    { key: "query", label: "Busca" },
    { key: "productCode", label: "Código" },
    { key: "productName", label: "Produto" },
    { key: "brand", label: "Marca" },
    { key: "quantity", label: "Qtd." },
    { key: "price", label: "Preço" },
    { key: "itemsCount", label: "Itens" },
    { key: "cartTotal", label: "Valor cotado" }
  ];

  return {
    columns,
    rows: events.map((event) => ({
      ...event,
      event: EVENT_LABELS[event.event] || event.event,
      companyName: normalizeCompany(event.companyName),
      consultant: normalizeConsultant(event.consultant).toUpperCase(),
      timestamp: dateTime(event.timestamp),
      productName: productLabel(productFromEvent(event)) === "Produto não informado" ? "" : productLabel(productFromEvent(event)),
      cartTotal: event.cartTotal || event.total ? money(event.cartTotal || event.total) : ""
    }))
  };
}


function sortEventsDesc(events) {
  return [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function resultLabel(event) {
  if (event.event === "search_no_results") return "Sem resultado";
  if (event.resultsCount > 0) return `${event.resultsCount} resultado${event.resultsCount === 1 ? "" : "s"}`;
  return "Com resultado";
}

function eventHistoryRows(events, options = {}) {
  const { expandQuoteProducts = false } = options;

  return sortEventsDesc(events).flatMap((event) => {
    const expandedProducts = expandQuoteProducts && event.event === "whatsapp_quote"
      ? quoteProducts(event)
      : [null];

    return expandedProducts.map((expandedProduct, index) => {
      const product = expandedProduct || productFromEvent(event);
      const isQuote = event.event === "whatsapp_quote";
      const productText = isQuote && !expandedProduct
        ? quoteProductsSummary(event)
        : productLabel(product);
      const quantity = expandedProduct
        ? productQuantity(product, 1)
        : (isQuote ? quoteItemsCount(event) : event.quantity);
      const numericValue = isQuote && !expandedProduct
        ? safeNumber(event.cartTotal || event.total)
        : productValue(product, event);
      const row = {
        id: `${event.id}-${event.timestamp}-${index}`,
        timestamp: event.timestamp,
        dateTime: dateTime(event.timestamp),
        company: event.companyName,
        consultant: event.consultant.toUpperCase(),
        event: EVENT_LABELS[event.event] || event.event,
        product: productText === "Produto não informado" ? "-" : productText,
        search: event.query || "-",
        result: resultLabel(event),
        value: (numericValue || isQuote) ? money(numericValue) : "-",
        quantity: quantity ? String(quantity) : "-",
        items: quoteItemsCount(event) ? String(quoteItemsCount(event)) : "-",
        _search: ""
      };

      row._search = [
        row.dateTime,
        row.company,
        row.consultant,
        row.event,
        row.product,
        row.search,
        row.result,
        row.value,
        row.quantity
      ].join(" ").toLowerCase();

      return row;
    });
  });
}

function companyActivityRows(events) {
  const map = new Map();

  events.forEach((event) => {
    const company = normalizeCompany(event.companyName);
    if (!map.has(company)) {
      map.set(company, {
        company,
        totalActions: 0,
        accesses: 0,
        searches: 0,
        productOpen: 0,
        added: 0,
        quotes: 0,
        quotedItemsQty: 0,
        score: 0,
        quoteTotalNumber: 0,
        lastEventDate: null
      });
    }

    const row = map.get(company);
    row.totalActions += 1;
    row.score += commercialEventScore(event);
    if (event.event === "page_view") row.accesses += 1;
    if (event.event === "search" || event.event === "search_no_results") row.searches += 1;
    if (event.event === "product_open") row.productOpen += 1;
    if (event.event === "add_to_cart") row.added += productQuantity(productFromEvent(event), event.quantity || 1);
    if (event.event === "whatsapp_quote") {
      row.quotes += 1;
      row.quoteTotalNumber += safeNumber(event.cartTotal || event.total);
    }

    const currentDate = new Date(event.timestamp);
    if (!Number.isNaN(currentDate.getTime()) && (!row.lastEventDate || currentDate > row.lastEventDate)) {
      row.lastEventDate = currentDate;
    }
  });

  return [...map.values()]
    .sort((a, b) => b.score - a.score || b.quotes - a.quotes || b.totalActions - a.totalActions)
    .map((row, index) => {
      const quoteRateNumber = row.productOpen ? row.quotes / row.productOpen : 0;
      const formatted = {
        ...row,
        id: `company-${index}-${row.company}`,
        position: index + 1,
        quoteRate: percent(quoteRateNumber),
        quoteTotal: money(row.quoteTotalNumber),
        lastEvent: row.lastEventDate ? dateTime(row.lastEventDate) : "-",
        _search: ""
      };
      formatted._search = [
        formatted.company,
        formatted.totalActions,
        formatted.accesses,
        formatted.searches,
        formatted.productOpen,
        formatted.added,
        formatted.quotes,
        formatted.score,
        formatted.quoteRate,
        formatted.quoteTotal,
        formatted.lastEvent
      ].join(" ").toLowerCase();
      return formatted;
    });
}



export {
  sheetTitle,
  tableRows,
  rawEventRows,
  sortEventsDesc,
  resultLabel,
  eventHistoryRows,
  companyActivityRows
};
