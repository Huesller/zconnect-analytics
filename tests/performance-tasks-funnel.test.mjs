import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const sourceRoot = new URL("../src/", import.meta.url);
const sourceFiles = fs.readdirSync(sourceRoot, { recursive: true })
  .filter((file) => /\.(js|jsx|ts|tsx)$/.test(file))
  .map((file) => ({
    file,
    text: fs.readFileSync(new URL(file.replace(/\\/g, "/"), sourceRoot), "utf8")
  }));
const main = sourceFiles.map((entry) => entry.text).join("\n");
const appsScript = fs.readFileSync(new URL("../GOOGLE_APPS_SCRIPT_V3_CLIENTES.js", import.meta.url), "utf8");
const proxy = fs.readFileSync(new URL("../api/analytics.js", import.meta.url), "utf8");

test("tarefas respondem de forma otimista e preservam histórico por cliente", () => {
  assert.match(main, /LOCAL-TASK-/);
  assert.match(main, /Histórico de tarefas/);
  assert.match(main, /closedTasks/);
  assert.match(main, /Concluída/);
  assert.match(main, /Cancelada/);
});

test("tarefas aceitam data e horário", () => {
  assert.match(main, /localDateTimeInput/);
  assert.match(main, /datetime-local/);
});

test("funil ativo não mistura carteira, ganhos e perdas", () => {
  assert.match(main, /hasCommercialOpportunity/);
  assert.match(main, /ACTIVE_PIPELINE_STAGE_KEYS/);
  assert.match(main, /Ganhos e perdas não ocupam o Kanban ativo/);
});

test("nova tarefa é gravada sem varrer toda a planilha", () => {
  assert.match(appsScript, /const isNewTask =/);
  assert.match(appsScript, /if \(isNewTask\)/);
  assert.match(appsScript, /sheet\.getRange\(sheet\.getLastRow\(\) \+ 1, 1, 1, headers\.length\)\.setValues/);
});

test("proxy reutiliza validações recentes sem retirar o escopo seguro", () => {
  assert.match(proxy, /UPSTREAM_READ_TTL_MS/);
  assert.match(proxy, /UPSTREAM_READ_CACHE/);
  assert.match(proxy, /canWriteScopedRecord/);
});

test("anotação não atendeu aceita texto vazio e salva sem bloquear a interface", () => {
  assert.match(main, /OPTIONAL_NOTE_TYPES = new Set\(\["not_answered"\]\)/);
  assert.match(main, /not_answered: "Cliente não atendeu\."/);
  assert.match(main, /required=\{!OPTIONAL_NOTE_TYPES\.has\(noteForm\.type\)\}/);
  assert.match(main, /void request\.catch/);
  assert.doesNotMatch(main, /disabled=\{busyAction === "note"\}/);
});
