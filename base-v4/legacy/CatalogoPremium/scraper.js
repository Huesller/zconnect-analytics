// ============================================================
// Z Automotiva — Scraper de Catálogos Zetta
// Uso: npm run scrape  ou  node scraper.js
// ============================================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const log = require('./utils/logger');
const { scrapeAllPages } = require('./scraper/pagination');
const { generateCatalogHtml, generateAdminHtml, copyAssetsToOutput } = require('./ui/generate-html');
const { formatPrecoBR, parsePrecoNum } = require('./utils/format');

// ─── CONFIGURAÇÃO ────────────────────────────────────────────
// Para adicionar novos catálogos, basta incluir um novo objeto aqui.
// A ordem abaixo é a ordem que será processada e exibida no index.html.
const CATALOGOS = [
  { id: '1436', nome: 'MARCA RETOV', marca: 'RETOV' },
  { id: '1438', nome: 'MARCA RIDA', marca: 'RIDA' },
  { id: '1494', nome: 'MARCA TYC', marca: 'TYC' },
  { id: '1493', nome: 'RETROVISORES TYC', marca: 'RETROVISORES TYC' },
  { id: '1437', nome: 'MARCA Z AUTO', marca: 'Z AUTO' },
];

const CONSULTORES = [
  {
    id: 'huesller',
    nome: 'Huesller',
    whatsapp: '554733054401'
  },
  {
    id: 'ney',
    nome: 'Ney',
    whatsapp: '554733054400'
  },
  {
    id: 'representante',
    nome: 'Francisco',
    whatsapp: '5527992747307'
  },

];

const OUTPUT_DIR = path.join(__dirname, 'catalogo-gerado');
const DEBUG_HTML = path.join(__dirname, 'pagina-debug.html');

// Política comercial fixa do catálogo principal.
// O sistema online deve ficar sem desconto operacional; o catálogo aplica aqui a política equivalente a 45%.
// Assim um desconto temporário lançado por outro vendedor no sistema não vira regra permanente do catálogo.
const CATALOG_POLICY_DISCOUNT_PERCENT = 45;
const STOCK_ONLY_MODE = process.argv.includes('--stock-only') || process.env.STOCK_ONLY === '1';
// ─────────────────────────────────────────────────────────────

function ensureCleanOutputDir() {
  // Mantém a pasta assets e o logo para não perder alterações manuais
  // feitas diretamente em catalogo-gerado/assets.
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    return;
  }

  for (const entry of fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })) {
    if (entry.name === 'assets' || entry.name === 'logo.png') continue;
    fs.rmSync(path.join(OUTPUT_DIR, entry.name), { recursive: true, force: true });
  }
}


function productIdentityKey(produto) {
  return [
    produto.catalogoId || '',
    produto.marca || '',
    produto.cod || '',
    produto.codFab || '',
    produto.nome || produto.desc || '',
  ].map((v) => String(v || '').trim().toLowerCase()).join('|');
}

function applyFixedCatalogPolicy(produto) {
  const baseNum = parsePrecoNum(produto.precoBaseSistemaNum ?? produto.precoNum ?? produto.preco);
  if (baseNum == null) {
    return {
      ...produto,
      precoBaseSistema: produto.precoBaseSistema || produto.preco || '',
      precoBaseSistemaNum: produto.precoBaseSistemaNum ?? produto.precoNum ?? null,
      politicaComercialCatalogo: CATALOG_POLICY_DISCOUNT_PERCENT,
    };
  }

  const rawFinal = baseNum * (1 - CATALOG_POLICY_DISCOUNT_PERCENT / 100);
  // Arredonda sempre para cima no centavo para não vender abaixo da política.
  // Ex.: 189.17 × 0.55 = 104.0435 => R$ 104,05.
  const finalNum = Math.ceil((rawFinal - Number.EPSILON) * 100) / 100;
  return {
    ...produto,
    precoBaseSistema: formatPrecoBR(baseNum),
    precoBaseSistemaNum: baseNum,
    preco: formatPrecoBR(finalNum),
    precoNum: finalNum,
    politicaComercialCatalogo: CATALOG_POLICY_DISCOUNT_PERCENT,
  };
}

function readExistingProductsByCatalog() {
  const byCatalog = new Map();
  const all = [];
  if (!fs.existsSync(OUTPUT_DIR)) return { byCatalog, all };

  for (const catalogo of CATALOGOS) {
    const file = path.join(OUTPUT_DIR, `${catalogo.id}.json`);
    if (!fs.existsSync(file)) continue;
    try {
      const produtos = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!Array.isArray(produtos)) continue;
      const map = new Map();
      produtos.forEach((p) => {
        const key = productIdentityKey(p);
        if (key.replace(/\|/g, '').trim()) map.set(key, p);
      });
      byCatalog.set(catalogo.id, map);
      all.push(...produtos);
    } catch (err) {
      log.warn('could not read existing catalog json for stock-only mode', { file, error: err.message });
    }
  }

  return { byCatalog, all };
}

function preserveExistingPrice(scrapedProduct, existingProduct) {
  if (!existingProduct) return scrapedProduct;
  return {
    ...scrapedProduct,
    preco: existingProduct.preco,
    precoNum: existingProduct.precoNum,
    precoBaseSistema: existingProduct.precoBaseSistema ?? existingProduct.preco,
    precoBaseSistemaNum: existingProduct.precoBaseSistemaNum ?? existingProduct.precoNum,
    politicaComercialCatalogo: existingProduct.politicaComercialCatalogo ?? CATALOG_POLICY_DISCOUNT_PERCENT,
  };
}

function mergeStockOnlyProducts(produtos, catalogoId, existingByCatalog) {
  const existingMap = existingByCatalog.get(catalogoId) || new Map();
  let preserved = 0;
  let added = 0;
  const merged = produtos.map((produto) => {
    const existing = existingMap.get(productIdentityKey(produto));
    if (existing) {
      preserved += 1;
      return preserveExistingPrice(produto, existing);
    }
    added += 1;
    return produto;
  });
  log.info('stock-only merge complete', { catalogoId, preservedPrices: preserved, newProductsWithPolicyPrice: added });
  return merged;
}

function normalizeProductForCatalog(produto, catalogo) {
  const cod = String(produto.cod || '').trim();
  const codFab = String(produto.codFab || '').trim();
  const nome = String(produto.nome || produto.desc || '').trim();
  const marca = String(produto.marca || catalogo.marca || '').trim();
  const catalogoNome = String(catalogo.nome || '').trim();

  return {
    ...produto,
    cod,
    codFab,
    nome,
    desc: String(produto.desc || nome).trim(),
    marca,
    catalogo: catalogoNome,
    catalogoId: catalogo.id,
    searchText: `${cod} ${codFab} ${nome} ${marca} ${catalogoNome}`.toLowerCase(),
  };
}

async function main() {
  const existingSnapshot = STOCK_ONLY_MODE ? readExistingProductsByCatalog() : { byCatalog: new Map(), all: [] };
  if (STOCK_ONLY_MODE) {
    log.info('stock-only mode enabled: prices will be preserved from existing catalog JSON');
  }

  ensureCleanOutputDir();
  copyAssetsToOutput(OUTPUT_DIR);

  log.info('Z Automotiva scraper started', { output: OUTPUT_DIR, catalogos: CATALOGOS.length, stockOnly: STOCK_ONLY_MODE, fixedPolicyDiscount: CATALOG_POLICY_DISCOUNT_PERCENT });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
  });

  const todosProdutos = [];
  const resumoCatalogos = [];

  for (const catalogo of CATALOGOS) {
    log.info('processing catalog', { id: catalogo.id, nome: catalogo.nome });
    const page = await context.newPage();

    try {
      const produtosBrutos = await scrapeAllPages(page, catalogo.id, catalogo.marca, {
        saveDebugHtml: true,
        debugPath: DEBUG_HTML,
      });

      let produtos = produtosBrutos
        .map((p) => normalizeProductForCatalog(p, catalogo))
        .map(applyFixedCatalogPolicy);

      if (STOCK_ONLY_MODE) {
        produtos = mergeStockOnlyProducts(produtos, catalogo.id, existingSnapshot.byCatalog);
      }

      log.info('products extracted', { id: catalogo.id, count: produtos.length });

      const html = generateCatalogHtml(catalogo, produtos, {
        vendedores: CONSULTORES,
        backHref: './index.html',
        backLabel: '← Todos os catálogos',
      });

      const outFile = path.join(OUTPUT_DIR, `${catalogo.id}.html`);
      fs.writeFileSync(outFile, html, 'utf8');
      log.info('catalog saved', { file: outFile });

      const jsonFile = path.join(OUTPUT_DIR, `${catalogo.id}.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(produtos, null, 2), 'utf8');

      todosProdutos.push(...produtos);
      resumoCatalogos.push({
        id: catalogo.id,
        nome: catalogo.nome,
        marca: catalogo.marca,
        total: produtos.length,
        href: `${catalogo.id}.html`,
      });
    } catch (err) {
      log.error('catalog failed', { id: catalogo.id, error: err.message });
      resumoCatalogos.push({
        id: catalogo.id,
        nome: catalogo.nome,
        marca: catalogo.marca,
        total: 0,
        href: `${catalogo.id}.html`,
        erro: err.message,
      });
    } finally {
      await page.close();
    }
  }

  const indexHtml = generateCatalogHtml(
    { id: 'index', nome: 'Todos os Catálogos', marca: 'Z Automotiva' },
    todosProdutos,
    {
      vendedores: CONSULTORES,
      isIndex: true,
      catalogos: resumoCatalogos,
      backHref: '',
    }
  );

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf8');


  fs.writeFileSync(path.join(OUTPUT_DIR, 'catalogo-completo.json'), JSON.stringify(todosProdutos, null, 2), 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'catalogos.json'), JSON.stringify(resumoCatalogos, null, 2), 'utf8');

  const painelHtml = generateAdminHtml({
    vendedores: CONSULTORES,
    baseUrl: 'https://catalogo-zautomotiva.vercel.app/',
  });
  fs.writeFileSync(path.join(__dirname, 'painel-comercial-local.html'), painelHtml, 'utf8');

  await browser.close();
  log.info('done', { output: OUTPUT_DIR, totalProducts: todosProdutos.length });
  console.log('\n✅ Concluído! Abra catalogo-gerado/index.html para ver todos os catálogos.');
}

main().catch((err) => {
  log.error('fatal', { error: err.message, stack: err.stack });
  console.error(err);
  process.exit(1);
});
