import { safeNumber } from "../../../shared/normalization.js";

function crmStatusLabel(status) {
  const labels = {
    new: "Novo interesse",
    contact: "Em contato",
    qualified: "Oportunidade identificada",
    quoted: "Cotação enviada",
    negotiation: "Negociação",
    waiting: "Aguardando cliente",
    won: "Pedido fechado",
    active: "Cliente ativo",
    cold: "Frio",
    lost: "Perdido",
    out_of_funnel: "Fora do funil"
  };
  return labels[status] || labels.new;
}

function purchaseDays(client = {}) {
  const purchaseDate = new Date(client.lastPurchaseAt || "");
  if (!Number.isNaN(purchaseDate.getTime())) return Math.max(0, Math.floor((Date.now() - purchaseDate.getTime()) / 86400000));
  const importedDays = Math.max(0, Math.floor(safeNumber(client.daysWithoutPurchase)));
  const importDate = new Date(client.createdAt || "");
  if (!importedDays || Number.isNaN(importDate.getTime())) return importedDays;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  importDate.setHours(0, 0, 0, 0);
  const elapsedSinceImport = Math.max(0, Math.floor((today.getTime() - importDate.getTime()) / 86400000));
  return importedDays + elapsedSinceImport;
}

export {
  crmStatusLabel,
  purchaseDays
};

