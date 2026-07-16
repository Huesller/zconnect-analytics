import test from "node:test";
import assert from "node:assert/strict";
import { classifyImportedClients, parseExcelMatrix, parseSiggmaPdfPages } from "../src/clientImportCore.js";

test("organiza clientes de uma tabela PDF SIGGMA com campos quebrados", () => {
  const items = [];
  const add = (str, x, y) => items.push({ str, x, y });
  [
    ["Código", 20], ["CPF/CNPJ", 70], ["Nome/Razão social", 180], ["Telefone", 470],
    ["Município", 570], ["UF", 690], ["Endereço", 720], ["Rotas", 845], ["S/ Comprar", 930]
  ].forEach(([str, x]) => add(str, x, 560));
  add("150397", 20, 520); add("88.272.919/0001-85", 70, 520);
  add("COML BAUER PECAS", 180, 520); add("PARA VEICULOS LTDA", 180, 508);
  add("(51) 3490-1480", 470, 520); add("GRAVATAÍ", 570, 520); add("RS", 690, 520);
  add("RUA TESTE, 100", 720, 520); add("IMPORTADORA", 845, 520); add("6240 dias", 930, 520);
  add("150398", 20, 470); add("12.345.678/0001-99", 70, 470); add("AUTO PECAS MODELO", 180, 470);
  add("(47) 99999-1111", 470, 470); add("JOINVILLE", 570, 470); add("SC", 690, 470);
  add("AV BRASIL, 20", 720, 470); add("NORTE", 845, 470); add("15 dias", 930, 470);

  const rows = parseSiggmaPdfPages([{ width: 1000, items }]);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    customerCode: "150397", taxId: "88.272.919/0001-85", companyName: "COML BAUER PECAS PARA VEICULOS LTDA",
    contactName: "", phone: "(51) 3490-1480", email: "", city: "GRAVATAÍ", state: "RS",
    address: "RUA TESTE, 100", route: "IMPORTADORA", daysWithoutPurchase: 6240, source: "pdf"
  });
  assert.equal(rows[1].companyName, "AUTO PECAS MODELO");
});

test("aceita planilha com cabeçalho fora da primeira linha", () => {
  const rows = parseExcelMatrix([
    ["Relatório de clientes"],
    ["Código", "CPF/CNPJ", "Nome/Razão social", "Telefone", "Município", "UF", "Endereço", "Rotas", "S/ Comprar"],
    [150397, "88272919000185", "COML BAUER", "5134901480", "GRAVATAÍ", "rs", "RUA TESTE", "IMPORTADORA", "6240 dias"]
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].taxId, "88.272.919/0001-85");
  assert.equal(rows[0].state, "RS");
  assert.equal(rows[0].daysWithoutPurchase, 6240);
});

test("classifica cadastros novos, existentes e repetidos", () => {
  const rows = classifyImportedClients([
    { customerCode: "10", companyName: "Cliente existente" },
    { customerCode: "20", companyName: "Cliente novo" },
    { customerCode: "20", companyName: "Cliente novo repetido" }
  ], [{ customerCode: "10", companyName: "Cliente existente" }], "update");
  assert.deepEqual(rows.map((row) => row.action), ["update", "create", "error"]);
});
