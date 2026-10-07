import { safeNumber } from "../../../shared/normalization.js";
import { money } from "../../../shared/formatting.js";

function cartFollowUpMessage(context = {}) {
  const products = Array.isArray(context.products) ? context.products : [];
  const itemsCount = safeNumber(context.itemsCount) || products.reduce((sum, item) => sum + safeNumber(item.quantity), 0);
  const total = safeNumber(context.total);
  const lines = [
    "Olá! Tudo bem?",
    `Vi que vocês separaram ${itemsCount || "algumas"} peça(s) no nosso catálogo, mas não concluíram a cotação.`
  ];
  if (products.length) {
    lines.push("", "Itens de interesse:");
    products.slice(0, 5).forEach((item) => lines.push(`• ${safeNumber(item.quantity) || 1}x ${[item.code, item.name].filter(Boolean).join(" - ")}`));
    if (products.length > 5) lines.push(`• e mais ${products.length - 5} produto(s)`);
  }
  if (total > 0) lines.push("", `Valor aproximado dos itens: ${money(total)}`);
  lines.push("", "Queria entender se ficou alguma dúvida sobre preço, estoque, frete ou prazo. Posso ajudar a revisar os itens e finalizar sua cotação?");
  return lines.join("\n");
}

function stockRestockMessage(product, client = {}) {
  const greetingName = String(client.contactName || client.company || "").trim();
  return [
    greetingName ? `Olá, ${greetingName}! Tudo bem?` : "Olá! Tudo bem?",
    `A peça ${product.productCode} - ${product.productName} que vocês consultaram voltou ao estoque.`,
    product.stockQty > 0 ? `Temos ${product.stockQty} unidade(s) disponível(is) neste momento.` : "A reposição está sendo acompanhada pela nossa equipe.",
    "Quer que eu verifique a condição e já separe a quantidade necessária para vocês?"
  ].join("\n");
}

export {
  cartFollowUpMessage,
  stockRestockMessage
};
