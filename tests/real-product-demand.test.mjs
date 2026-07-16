import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const frontend = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const backend = readFileSync(new URL("../GOOGLE_APPS_SCRIPT_V3_CLIENTES.js", import.meta.url), "utf8");

test("sugestões de busca não são convertidas em demanda de SKU", () => {
  const start = frontend.indexOf("function buildDemandStockRows");
  const end = frontend.indexOf("function buildAlerts", start);
  const demandSource = frontend.slice(start, end);
  assert.doesNotMatch(demandSource, /matches\.forEach\(\(product\) => touch\(product, "search"/);
  assert.match(demandSource, /event\.event === "product_open"/);
  assert.match(demandSource, /event\.event === "add_to_cart"/);
  assert.match(demandSource, /event\.event === "whatsapp_quote"/);
  assert.doesNotMatch(backend, /"product_open", "add_to_cart", "whatsapp_quote", "search"/);
});

