import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const main = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const appsScript = fs.readFileSync(new URL("../GOOGLE_APPS_SCRIPT_V3_CLIENTES.js", import.meta.url), "utf8");

test("funil contém os oito marcos comerciais", () => {
  for (const key of ["new", "contact", "qualified", "quoted", "negotiation", "waiting", "won", "lost"]) {
    assert.match(main, new RegExp(`key: ["']${key}["']`));
  }
});

test("tentativas são atividades e disparam avanço automático", () => {
  assert.match(main, /call_no_answer/);
  assert.match(main, /whatsapp_sent/);
  assert.match(main, /automaticStatus/);
  assert.match(main, /Sem próxima ação/);
});

test("Apps Script aceita a etapa de oportunidade identificada", () => {
  assert.match(appsScript, /"qualified"/);
  assert.match(appsScript, /qualified: true/);
});
