import { safeNumber } from "./normalization.js";

function productFromEvent(event) {
  return {
    productCode: event.productCode,
    productName: event.productName,
    brand: event.brand,
    quantity: event.quantity || 1,
    price: event.price,
    total: event.total
  };
}

function productCode(product = {}) {
  return String(
    product.productCode ||
    product.code ||
    product.codigo ||
    product.sku ||
    ""
  ).trim();
}

function productName(product = {}) {
  return String(
    product.productName ||
    product.name ||
    product.description ||
    product.descricao ||
    ""
  ).trim();
}

function productLabel(product = {}) {
  const code = productCode(product);
  const name = productName(product);

  return [code, name].filter(Boolean).join(" - ") || "Produto não informado";
}

function productQuantity(product = {}, fallback = 1) {
  return Math.max(
    1,
    safeNumber(product.quantity || product.quantidade || fallback || 1)
  );
}

function productValue(product = {}, event = {}) {
  const total = safeNumber(
    product.total ||
    product.cartTotal ||
    product.valorTotal
  );

  if (total) return total;

  const price = safeNumber(
    product.price ||
    product.preco ||
    event.price
  );

  return price
    ? price * productQuantity(product, event.quantity || 1)
    : safeNumber(event.total || event.cartTotal);
}

function quoteProducts(event = {}) {
  const products = Array.isArray(event.products) && event.products.length
    ? event.products
    : [productFromEvent(event)];

  return products.filter(
    (product) => productLabel(product) !== "Produto não informado"
  );
}

function quoteProductsSummary(event = {}) {
  const labels = quoteProducts(event).map(productLabel);

  if (!labels.length) return "Produtos não informados";
  if (labels.length <= 2) return labels.join("; ");

  return `${labels.slice(0, 2).join("; ")} +${labels.length - 2} produtos`;
}

function quoteItemsCount(event = {}) {
  if (event.itemsCount) return event.itemsCount;

  const products = quoteProducts(event);

  if (!products.length) return event.quantity || 0;

  return products.reduce(
    (sum, product) => sum + productQuantity(product, 1),
    0
  );
}

export {
  productFromEvent,
  productCode,
  productName,
  productLabel,
  productQuantity,
  productValue,
  quoteProducts,
  quoteProductsSummary,
  quoteItemsCount
};
