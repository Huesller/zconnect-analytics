import { fetchAnalyticsAction } from "./analytics-client.js";
import { normalizeConsultant, normalizeCompany, safeNumber } from "../../shared/normalization.js";
import { dateTime } from "../../shared/dates.js";
function reservationExpiryLabel(value) {
  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.getTime())) return "-";
  const minutes = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `em ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `em ${hours}h ${remainder}min` : `em ${hours}h`;
}

function normalizeReservation(row, index) {
  const statusKey = String(row?.status || "active").toLowerCase();
  const company = normalizeCompany(row?.companyName);
  const consultant = normalizeConsultant(row?.consultant).toUpperCase();
  const productCode = String(row?.productCode || "").trim();
  const productName = String(row?.productName || "").trim();
  const requestedNumber = safeNumber(row?.requestedQty);
  const reservedNumber = safeNumber(row?.reservedQty);
  const excessNumber = safeNumber(row?.excessQty);
  const formatted = {
    id: row?.id || `reservation-${index}`,
    sessionId: String(row?.sessionId || ""),
    company,
    consultant,
    product: [productCode, productName].filter(Boolean).join(" · ") || "Produto não informado",
    requested: requestedNumber,
    reserved: reservedNumber,
    excess: excessNumber || "-",
    requestedNumber,
    reservedNumber,
    excessNumber,
    stockQty: safeNumber(row?.stockQty),
    statusKey,
    status: statusKey === "quoted" ? "Cotação enviada" : "No carrinho",
    expires: reservationExpiryLabel(row?.expiresAt),
    expiresAtRaw: row?.expiresAt || "",
    updatedAtRaw: row?.updatedAt || row?.createdAt || "",
    updatedAt: dateTime(row?.updatedAt || row?.createdAt),
    productCode,
    productName
  };
  formatted._search = [formatted.company, formatted.consultant, formatted.product, formatted.status]
    .join(" ")
    .toLowerCase();
  return formatted;
}

async function fetchActiveReservations() {
  const data = await fetchAnalyticsAction("reservations_admin");
  const rows = Array.isArray(data?.reservations) ? data.reservations : [];
  return rows.map(normalizeReservation);
}
export {
  reservationExpiryLabel,
  normalizeReservation,
  fetchActiveReservations
};
