import { normalizeConsultant, normalizeCompany, safeNumber } from "../../../shared/normalization.js";
import { companyKey, isAnonymousCompany } from "../../../shared/company-utils.js";
import {
  productFromEvent,
  productLabel,
  productQuantity,
  productValue,
  quoteProducts,
  quoteProductsSummary,
  quoteItemsCount
} from "../../../shared/product-utils.js";
import { money, percent } from "../../../shared/formatting.js";
import { dateTime } from "../../../shared/dates.js";
import { commercialEventScore } from "../../commercial-intelligence/engine/commercial-engine.js";
function consultantActivityRows(events) {
  const map = new Map();

  events.forEach((event) => {
    const consultant = normalizeConsultant(event.consultant).toUpperCase();
    if (!map.has(consultant)) {
      map.set(consultant, {
        consultant,
        totalActions: 0,
        accesses: 0,
        searches: 0,
        productOpen: 0,
        quotes: 0,
        score: 0,
        quoteTotalNumber: 0,
        lastEventDate: null
      });
    }

    const row = map.get(consultant);
    row.totalActions += 1;
    row.score += commercialEventScore(event);
    if (event.event === "page_view") row.accesses += 1;
    if (event.event === "search" || event.event === "search_no_results") row.searches += 1;
    if (event.event === "product_open") row.productOpen += 1;
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
        id: `consultant-${index}-${row.consultant}`,
        position: index + 1,
        quoteRate: percent(quoteRateNumber),
        quoteTotal: money(row.quoteTotalNumber),
        lastEvent: row.lastEventDate ? dateTime(row.lastEventDate) : "-",
        _search: ""
      };
      formatted._search = [
        formatted.consultant,
        formatted.totalActions,
        formatted.accesses,
        formatted.searches,
        formatted.productOpen,
        formatted.quotes,
        formatted.score,
        formatted.quoteRate,
        formatted.quoteTotal,
        formatted.lastEvent
      ].join(" ").toLowerCase();
      return formatted;
    });
}

function dormantCompanyRows(events) {
  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - 30);
  const previousStart = new Date(now);
  previousStart.setDate(previousStart.getDate() - 60);

  const map = new Map();

  events.forEach((event) => {
    const company = normalizeCompany(event.companyName);
    if (isAnonymousCompany(company)) return;

    const eventDate = new Date(event.timestamp);
    if (Number.isNaN(eventDate.getTime()) || eventDate < previousStart) return;

    if (!map.has(company)) {
      map.set(company, {
        company,
        currentScore: 0,
        previousScore: 0,
        currentActions: 0,
        previousActions: 0,
        currentQuotes: 0,
        previousQuotes: 0,
        lastEventDate: null
      });
    }

    const row = map.get(company);
    const score = commercialEventScore(event);

    if (eventDate >= currentStart) {
      row.currentScore += score;
      row.currentActions += 1;
      if (event.event === "whatsapp_quote") row.currentQuotes += 1;
    } else {
      row.previousScore += score;
      row.previousActions += 1;
      if (event.event === "whatsapp_quote") row.previousQuotes += 1;
    }

    if (!row.lastEventDate || eventDate > row.lastEventDate) row.lastEventDate = eventDate;
  });

  return [...map.values()]
    .filter((row) => row.previousScore >= 10 && row.currentScore < row.previousScore)
    .map((row) => {
      const dropNumber = row.previousScore ? (row.previousScore - row.currentScore) / row.previousScore : 0;
      const status = dropNumber >= 0.75 ? "Crítico" : dropNumber >= 0.45 ? "Atenção" : "Monitorar";
      return {
        ...row,
        dropNumber,
        status,
        drop: `-${Math.round(dropNumber * 100)}%`,
        lastEvent: row.lastEventDate ? dateTime(row.lastEventDate) : "-",
        _search: ""
      };
    })
    .sort((a, b) => b.dropNumber - a.dropNumber || b.previousScore - a.previousScore)
    .map((row, index) => {
      const formatted = {
        ...row,
        id: `dormant-${index}-${row.company}`,
        position: index + 1
      };
      formatted._search = [
        formatted.company,
        formatted.status,
        formatted.previousScore,
        formatted.currentScore,
        formatted.drop,
        formatted.previousQuotes,
        formatted.currentQuotes,
        formatted.lastEvent
      ].join(" ").toLowerCase();
      return formatted;
    });
}

function specialOfferRows(events) {
  const offers = new Map();

  events.forEach((event) => {
    const offerId = String(event.specialOfferId || "").trim();
    if (!offerId) return;

    if (!offers.has(offerId)) {
      offers.set(offerId, {
        id: offerId,
        client: event.specialOfferClient || event.companyName || "Cliente não informado",
        consultant: normalizeConsultant(event.specialOfferSeller || event.consultant).toUpperCase(),
        discountNumber: safeNumber(event.specialOfferDiscount),
        expiresAtRaw: event.specialOfferExpiresAt || "",
        createdAtRaw: event.createdAt || event.timestamp,
        opens: 0,
        quotes: 0,
        quoteTotalNumber: 0
      });
    }

    const row = offers.get(offerId);
    if (event.event === "special_offer_created") {
      row.createdAtRaw = event.createdAt || event.timestamp || row.createdAtRaw;
      row.client = event.specialOfferClient || event.companyName || row.client;
      row.consultant = normalizeConsultant(event.specialOfferSeller || event.consultant).toUpperCase();
      row.discountNumber = safeNumber(event.specialOfferDiscount) || row.discountNumber;
      row.expiresAtRaw = event.specialOfferExpiresAt || row.expiresAtRaw;
    }
    if (event.event === "special_offer_opened") row.opens += 1;
    if (event.event === "whatsapp_quote") {
      row.quotes += 1;
      row.quoteTotalNumber += safeNumber(event.cartTotal || event.total);
    }
  });

  return [...offers.values()]
    .sort((a, b) => new Date(b.createdAtRaw) - new Date(a.createdAtRaw))
    .map((row) => {
      const expires = row.expiresAtRaw ? new Date(row.expiresAtRaw) : null;
      const expired = expires && !Number.isNaN(expires.getTime()) && expires.getTime() < Date.now();
      const formatted = {
        ...row,
        discount: row.discountNumber ? `${row.discountNumber.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%` : "-",
        quoteTotal: money(row.quoteTotalNumber),
        status: expired ? "Expirada" : "Ativa",
        createdAt: dateTime(row.createdAtRaw)
      };
      formatted._search = [formatted.id, formatted.client, formatted.consultant, formatted.status].join(" ").toLowerCase();
      return formatted;
    });
}



export {
  consultantActivityRows,
  dormantCompanyRows,
  specialOfferRows
};

