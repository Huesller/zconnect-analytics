import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const source = await readFile(new URL("src/main.jsx", root), "utf8");
const appsScript = await readFile(new URL("GOOGLE_APPS_SCRIPT_V3_CLIENTES.js", root), "utf8");

test("tags comerciais são fixas, múltiplas e filtráveis", () => {
  for (const tag of ["Venda sob encomenda", "Cliente potencial", "Cliente bloqueado", "Linha mecânica", "Fora do perfil", "Compra recorrente", "Cliente em reativação"]) assert.match(source, new RegExp(tag));
  assert.match(source, /function ClientTagSelector/);
  assert.match(source, /Todas as tags/);
});

test("tag Fora do perfil retira o cliente do funil automaticamente", () => {
  assert.match(source, /tags\.includes\("Fora do perfil"\)/);
  assert.match(source, /funnelExitReason: "Fora do perfil"/);
  assert.match(source, /status: "out_of_funnel"/);
});

test("cliente pode sair do funil sem ser excluído", () => {
  assert.match(source, /out_of_funnel/);
  assert.match(source, /FUNNEL_EXIT_REASONS/);
  assert.match(source, /funnelRows = crmRows\.filter/);
  assert.match(appsScript, /"funnelExitReason"/);
  assert.match(appsScript, /"out_of_funnel"/);
});

test("relatório consolida ocorrências e recorrências por cliente", () => {
  assert.match(source, /function CommercialReports/);
  assert.match(source, /Recorrências/);
  assert.match(source, /Por cliente/);
  assert.match(source, /Exportar Excel/);
});
