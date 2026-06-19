const log = require('../utils/logger');
const { formatPrecoBR, parsePrecoNum, absolutizePath } = require('../utils/format');
const { resolveImageUrl } = require('./images');


function normalizeKey(key) {
  return String(key || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isPriceLike(value) {
  const n = parsePrecoNum(value);
  return n != null && n >= 0;
}

function findPriceValue(obj, { preferIpi = true } = {}) {
  if (!obj || typeof obj !== 'object') return undefined;

  const entries = Object.entries(obj);

  // 1) Campos explícitos mais comuns para valor com IPI.
  const explicitKeys = [
    'valorComIpi',
    'valorComIPI',
    'valorcomipi',
    'valorIpi',
    'valorIPI',
    'valor_ipi',
    'valorComImposto',
    'valorComImpostos',
    'precoComIpi',
    'precoComIPI',
    'precoIpi',
    'precoIPI',
    'vlrComIpi',
    'vlrComIPI',
    'vlComIpi',
    'vlComIPI',
    'valorTotal',
    'valorFinal',
  ];

  for (const key of explicitKeys) {
    if (obj[key] !== undefined && obj[key] !== null && isPriceLike(obj[key])) return obj[key];
  }

  // 2) Varredura inteligente: qualquer chave que tenha IPI e pareça preço.
  const ipiCandidates = entries
    .filter(([key, value]) => {
      const k = normalizeKey(key);
      return k.includes('ipi') && isPriceLike(value);
    })
    .sort(([a], [b]) => {
      const score = (key) => {
        const k = normalizeKey(key);
        let s = 0;
        if (k.includes('valor')) s += 5;
        if (k.includes('preco')) s += 5;
        if (k.includes('vlr')) s += 4;
        if (k.includes('total')) s += 3;
        if (k.includes('com')) s += 2;
        if (k.includes('sem')) s -= 10;
        if (k.includes('percent') || k.includes('aliquota')) s -= 20;
        return -s;
      };
      return score(a) - score(b);
    });

  if (preferIpi && ipiCandidates.length) return ipiCandidates[0][1];

  // 3) Fallback para campos normais de preço, caso o catálogo não traga IPI.
  const normalKeys = ['valor', 'preco', 'vlr', 'valorVenda', 'precoVenda'];
  for (const key of normalKeys) {
    if (obj[key] !== undefined && obj[key] !== null && isPriceLike(obj[key])) return obj[key];
  }

  return undefined;
}

function collectPriceDebugFields(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const k = normalizeKey(key);
    if (
      k.includes('valor') ||
      k.includes('preco') ||
      k.includes('ipi') ||
      k.includes('vlr') ||
      k.includes('total')
    ) {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Extract products from embedded Vue catalogo JSON (most reliable).
 */
function parseCatalogoFromHtml(html, defaultMarca) {
  const match = html.match(/catalogo:\s*JSON\.parse\(decodeURIComponent\('([^']+)'\)\)/);
  if (!match) return null;

  try {
    const catalogo = JSON.parse(decodeURIComponent(match[1]));
    if (!catalogo?.itens?.length) return null;

    return catalogo.itens.map((item) => {
      const d = item.detalhes || {};
      const cod = String(d.proCodOri || '').trim();
      const codFab = String(d.codFabricacao || '').trim();
      const marca = String(d.marca || defaultMarca || '').trim();
      const valorPreco = findPriceValue(d, { preferIpi: true });
      const preco = valorPreco !== undefined && valorPreco !== null ? formatPrecoBR(valorPreco) : '';
      const precoNum = parsePrecoNum(valorPreco);

      const imgSrc = resolveImageUrl({
        imgMin: item.imgMin,
        imgSrc: item.img,
        imagem: item.imagem || item.image || d.imagem || d.image,
        foto: item.foto || d.foto,
        img: item.img,
        cod,
        codFab,
      });

      if (!preco) {
        log.warn('price capture failure', { cod, codFab, priceFields: collectPriceDebugFields(d) });
      }

      return {
        cod,
        codFab,
        nome: String(item.descricao || '').trim(),
        desc: String(item.descricao || '').trim(),
        marca,
        preco,
        precoNum,
        imgSrc,
      };
    });
  } catch (err) {
    log.error('JSON catalogo parse failed', { error: err.message });
    return null;
  }
}

/**
 * DOM fallback when JSON is unavailable.
 */
async function extractFromDom(page, defaultMarca) {
  return page.evaluate((defaultMarca) => {
    function extractImageFromCard(card, cod) {
      const tryUrl = (raw) => {
        if (!raw) return '';
        const u = String(raw).replace(/&quot;/g, '"').trim();
        return u.startsWith('http') ? u : '';
      };

      for (const div of card.querySelectorAll('.v-image__image')) {
        const style = div.getAttribute('style') || '';
        const m = style.match(/url\(["']?(https?[^"')]+)["']?\)/i);
        if (m?.[1]) return tryUrl(m[1]);
      }

      const img = card.querySelector('img');
      if (img) {
        for (const a of ['currentSrc', 'src', 'data-src', 'data-original', 'data-lazy-src']) {
          const v = img.getAttribute(a) || img[a];
          const ok = tryUrl(v);
          if (ok) return ok;
        }
      }

      if (cod) {
        return `https://sistema.zettabrasil.com.br/siggma/catalogos/200/files?type=item&name=${cod}-min.jpg`;
      }
      return '';
    }

      const lista = [];
      const cards = document.querySelectorAll('.v-card.v-sheet');

      cards.forEach((card) => {
        const subtitles = card.querySelectorAll('.v-list-item__subtitle');
        let cod = '';
        let codFab = '';
        let marcaProd = '';

        subtitles.forEach((el) => {
          const txt = (el.innerText || '').trim();
          const codMatch = txt.match(/^C[oó]digo:\s*(.+)$/i);
          if (codMatch) cod = codMatch[1].trim();
          const fabMatch = txt.match(/C[oó]digo\s+(?:de\s+)?Fabrica[cç][aã]o:\s*(.+)/i);
          if (fabMatch) codFab = fabMatch[1].trim();
          const marcaMatch = txt.match(/^Marca:\s*(.+)/i);
          if (marcaMatch) marcaProd = marcaMatch[1].trim();
        });

        const nome =
          card.querySelector('.v-list-item__title b, .v-list-item__title')?.innerText?.trim() || '';

        const precoEl =
          card.querySelector('span[title*="IPI" i] .v-chip__content b, span[title*="IPI" i] b') ||
          [...card.querySelectorAll('.v-chip, span, div')].find((el) => /ipi/i.test(el.getAttribute('title') || '') && /R\$|\d+[,.]\d{2}/.test(el.innerText || '')) ||
          card.querySelector('span[title="Valor"] .v-chip__content b, span[title="Valor"] b, .v-chip__content b');
        const preco = precoEl ? precoEl.innerText.trim() : '';

        let imgSrc = extractImageFromCard(card, cod);

        if (cod || nome) {
          lista.push({
            cod,
            codFab,
            nome,
            desc: nome,
            marca: marcaProd || defaultMarca || '',
            preco,
            precoNum: null,
            imgSrc: imgSrc || '',
          });
        }
      });

      return lista;
  }, defaultMarca);
}

async function extractProductsFromPage(page, defaultMarca) {
  const html = await page.content();
  let produtos = parseCatalogoFromHtml(html, defaultMarca);

  if (produtos?.length) {
    log.info('extracted via embedded JSON', { count: produtos.length });
    return produtos.map((p) => ({
      ...p,
      imgSrc: resolveImageUrl(p),
    }));
  }

  log.warn('JSON not found — DOM fallback');
  produtos = await extractFromDom(page, defaultMarca);
  return produtos.map((p) => ({
    ...p,
    precoNum: parsePrecoNum(p.preco) ?? parsePrecoNum(String(p.preco || '').replace(/R\$\s*/i, '')),
    imgSrc: resolveImageUrl(p),
  }));
}

async function getTotalPages(page) {
  const pages = await page.evaluate(() => {
    const html = document.documentElement.innerHTML;
    const m = html.match(/\bpages:\s*(\d+)/);
    if (m) return parseInt(m[1], 10);

    const items = [...document.querySelectorAll('.v-pagination__item')];
    const nums = items
      .map((el) => parseInt(el.textContent.trim(), 10))
      .filter((n) => Number.isFinite(n));
    return nums.length ? Math.max(...nums) : 1;
  });
  return pages || 1;
}

module.exports = {
  extractProductsFromPage,
  getTotalPages,
  parseCatalogoFromHtml,
};
