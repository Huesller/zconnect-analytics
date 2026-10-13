import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sourceRoot = new URL("../src/", import.meta.url);
const sourceFiles = fs.readdirSync(sourceRoot, { recursive: true })
  .filter((file) => /\.(js|jsx|ts|tsx)$/.test(file))
  .map((file) => ({
    file,
    text: fs.readFileSync(new URL(file.replace(/\\/g, "/"), sourceRoot), "utf8")
  }));
const frontend = sourceFiles.map((entry) => entry.text).join("\n");
const backend = fs.readFileSync(new URL("../GOOGLE_APPS_SCRIPT_V3_CLIENTES.js", import.meta.url), "utf8");

test("sugestões de busca não são convertidas em demanda de SKU", () => {
  const demandFile = sourceFiles.find((entry) => entry.text.includes("function buildDemandStockRows"));
  const demandText = demandFile?.text ?? "";
  const start = demandText.indexOf("function buildDemandStockRows");
  const end = demandText.indexOf("function buildAlerts", start);
  const demandSource = start >= 0 ? demandText.slice(start, end >= 0 ? end : undefined) : "";
  assert.doesNotMatch(demandSource, /matches\.forEach\(\(product\) => touch\(product, "search"/);
  assert.doesNotMatch(demandSource, /touch\(product, "search"/);
  assert.match(demandSource, /event\.event === "product_open"/);
  assert.match(demandSource, /event\.event === "add_to_cart"/);
  assert.match(demandSource, /event\.event === "whatsapp_quote"/);
  assert.doesNotMatch(backend, /"product_open", "add_to_cart", "whatsapp_quote", "search"/);
  assert.match(frontend, /"searched", "Pesquisas confirmadas"/);
  assert.match(frontend, /noResultDemandRows\(byType\.searches\)/);
  assert.match(frontend, /inferredNoResults/);
  assert.match(frontend, /function openSearchTermClients/);
  assert.match(frontend, /onOpenSearchTerm/);
});
