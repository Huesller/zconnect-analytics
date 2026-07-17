import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const main = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const appsScript = fs.readFileSync(new URL("../GOOGLE_APPS_SCRIPT_V3_CLIENTES.js", import.meta.url), "utf8");

test("anotações usam a lista comercial aprovada", () => {
  ["WhatsApp enviado", "Retorno de contato", "Não atendeu", "Ligação realizada", "Cotação enviada", "Falta de mercadoria", "Preço alto", "Sem retorno", "Negociação", "Venda realizada", "Anotações gerais"]
    .forEach((label) => assert.match(main, new RegExp(label)));
});

test("demanda manual possui persistência e entra na leitura de estoque", () => {
  assert.match(main, /upsert_crm_demand/);
  assert.match(main, /manualDemands\.filter/);
  assert.match(main, /row\.manual \* 10/);
  assert.match(appsScript, /CRM_DEMANDS/);
  assert.match(appsScript, /function upsertCrmDemand_/);
  assert.match(appsScript, /function updateCrmDemandStatus_/);
});
