import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadRankingFunction(rows) {
  const source = fs.readFileSync(new URL('../GOOGLE_APPS_SCRIPT_V3_CLIENTES.js', import.meta.url), 'utf8');
  const cacheValues = new Map();
  const sheet = {
    getLastRow: () => rows.length,
    getLastColumn: () => rows[0].length,
    getDataRange: () => ({ getValues: () => rows }),
    getRange: () => ({
      getValues: () => [rows[0]],
      setValues: (values) => { rows[0] = values[0]; }
    })
  };
  const context = vm.createContext({
    console,
    Date,
    JSON,
    Math,
    Object,
    String,
    Array,
    isFinite,
    CacheService: {
      getScriptCache: () => ({
        get: (key) => cacheValues.get(key) || null,
        put: (key, value) => cacheValues.set(key, value)
      })
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: () => sheet,
        insertSheet: () => sheet
      })
    }
  });
  vm.runInContext(source, context);
  return context.readPublicProductRankings_;
}

test('ranking público consolida eventos recentes sem expor dados comerciais', () => {
  const now = new Date().toISOString();
  const old = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
  const headers = ['createdAt', 'timestamp', 'event', 'productCode', 'products', 'companyName', 'price'];
  const rows = [
    headers,
    [now, now, 'product_open', 'A1', '', 'Cliente sigiloso', 999],
    [now, now, 'product_open', 'A1', '', 'Outro cliente', 500],
    [now, now, 'product_open', 'B2', '', 'Cliente sigiloso', 200],
    [now, now, 'add_to_cart', 'B2', '', 'Cliente sigiloso', 200],
    [now, now, 'whatsapp_quote', 'A1, B2', JSON.stringify([{ productCode: 'B2' }, { productCode: 'A1' }]), 'Cliente sigiloso', 1199],
    [old, old, 'product_open', 'OLD', '', 'Cliente antigo', 100]
  ];

  const result = loadRankingFunction(rows)({ days: 30 });
  assert.equal(result.ok, true);
  assert.deepEqual([...result.rankings.popular], ['A1', 'B2']);
  assert.deepEqual([...result.rankings.added], ['B2']);
  assert.deepEqual([...result.rankings.quoted], ['A1', 'B2']);
  assert.equal(JSON.stringify(result).includes('Cliente sigiloso'), false);
  assert.equal(JSON.stringify(result).includes('999'), false);
  assert.equal(result.rankings.popular.includes('OLD'), false);
});
