const fs = require('fs');
const path = require('path');
const { escapeHtml } = require('../utils/format');

function readAsset(relPath) {
  return fs.readFileSync(path.join(__dirname, relPath), 'utf8');
}

function vendedorSlug(nome) {
  return String(nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeVendedores(vendedores) {
  return (Array.isArray(vendedores) ? vendedores : [])
    .filter((v) => v && (v.nome || v.whatsapp))
    .map((v, idx) => {
      const nome = String(v.nome || `Consultor ${idx + 1}`).trim();
      const id = String(v.id || v.slug || vendedorSlug(nome || `consultor-${idx + 1}`)).trim();
      const slug = String(v.slug || v.id || vendedorSlug(nome || `consultor-${idx + 1}`)).trim();
      return {
        id,
        nome,
        whatsapp: String(v.whatsapp || '').trim(),
        slug,
      };
    });
}

/**
 * Generate standalone catalog HTML with embedded product JSON + assets.
 */
function generateCatalogHtml(catalogo, produtos, options = {}) {
  const { id, nome, marca } = catalogo;
  const isIndex = Boolean(options.isIndex);
  const catalogos = Array.isArray(options.catalogos) ? options.catalogos : [];
  const backHref = options.backHref;
  const backLabel = options.backLabel || '← Voltar';
  const vendedores = normalizeVendedores(options.vendedores || [
    { nome: 'Consultor 1', whatsapp: options.whatsNum1 || options.whatsNum || '' },
    { nome: 'Consultor 2', whatsapp: options.whatsNum2 || '' },
  ]);

  const css = readAsset('catalog.css');
  const productsJson = JSON.stringify(produtos).replace(/</g, '\\u003c');

  const configJson = JSON.stringify({
    id,
    nome,
    marca,
    vendedores,
    catalogos,
    isIndex,
    pageSize: 24,
  });

  const whatsButtons = vendedores.length
    ? vendedores
        .map(
          (v, idx) => `<button type="button" class="btn-whats" data-whats-index="${idx}" disabled>Enviar para ${escapeHtml(v.nome)}</button>`
        )
        .join('\n      ')
    : '<button type="button" class="btn-whats" data-whats-index="0" disabled>WhatsApp não configurado</button>';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(nome)} | Z Automotiva</title>
  <meta name="description" content="Catálogo online Z Automotiva com busca por código, marca, descrição, quantidade e envio rápido para WhatsApp."/>
  <meta name="theme-color" content="#020617"/>
  <meta property="og:title" content="${escapeHtml(nome)} | Z Automotiva"/>
  <meta property="og:description" content="Consulte peças automotivas, adicione ao carrinho e envie seu pedido pelo WhatsApp."/>
  <meta property="og:type" content="website"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="./assets/catalog.css"/>
</head>
<body>

<header class="topbar">
  <div class="topbar-left">
    <a class="topbar-logo-link" href="./index.html" aria-label="Ir para a página inicial">
      <img class="topbar-logo" src="./logo.png" alt="Importando acessórios da linha colissão a mais de 30 anos" onerror="this.style.display='none'"/>
    </a>
    <div class="topbar-title">Z <span>Automotiva</span> · ${escapeHtml(marca || nome)}</div>
  </div>
  <div class="topbar-right">
    ${backHref ? `<a class="back-btn" href="${escapeHtml(backHref)}">${escapeHtml(backLabel)}</a>` : ''}
  </div>
</header>

<div class="offer-top-banner" id="offerBanner" hidden></div>

<section class="hero">
  <div class="hero-content">
    <span class="hero-kicker">Catálogo Online Z Automotiva</span>
    <h1>${escapeHtml(isIndex ? 'Catálogos Z Automotiva' : nome)}</h1>
    <p>Consulta rápida de peças, aplicações e valores com pedido direto pelo WhatsApp.</p>
    <div class="hero-stats">
      <span><strong>${escapeHtml(String(produtos.length))}</strong> produtos</span>
      <span><strong>${escapeHtml(String(isIndex ? catalogos.length || 1 : 1))}</strong> catálogo${isIndex && catalogos.length !== 1 ? 's' : ''}</span>
      <span><strong>✓</strong> Estoque atualizado</span>
    </div>
  </div>
</section>

${isIndex && catalogos.length ? `
<section class="catalogos-nav" aria-label="Catálogos disponíveis">
  ${catalogos
    .map((cat) => `
    <a class="catalogo-link ${cat.erro ? 'erro' : ''}" href="${escapeHtml(cat.href || `${cat.id}.html`)}">
      <strong>${escapeHtml(cat.nome)}</strong>
      <span>ID ${escapeHtml(cat.id)} · ${escapeHtml(String(cat.total || 0))} produtos</span>
    </a>`)
    .join('')}
</section>` : ''}

<section class="search-hero" aria-label="Busca principal do catálogo">
  <div class="search-hero-copy">
    <span id="searchKicker">🔎 Encontre sua peça</span>
    <strong id="searchTitle">Digite código, código fabricante, descrição, marca ou veiculos.</strong>
    <p id="searchSubtitle">A busca é instantânea. Comece digitando qualquer informação da peça.</p>
  </div>
  <div class="search-hero-input-wrap">
    <input class="busca-input search-main-input" id="buscaInput" type="search" placeholder="Ex.: 12345, TYC, retrovisor, código fabricante..." autocomplete="off" autofocus/>
  </div>
</section>

<section class="trust-strip" id="trustStrip" aria-label="Informações importantes do catálogo">
  <span>✓ Preço com IPI incluso</span>
  <span>✓ Consulte disponibilidade com o consultor</span>
  <span>✓ Pedido direto pelo WhatsApp</span>
  <span>✓ Busca por código, marca ou descrição</span>
</section>

<div class="toolbar toolbar-secondary">
  <div class="filters">
    <select id="filterMarca" aria-label="Filtrar por marca"><option value="">Marca</option></select>
    <select id="filterCatalogo" aria-label="Filtrar por catálogo"><option value="">Catálogo</option></select>
    <input id="filterPrecoMin" type="number" min="0" step="0.01" placeholder="Preço mín." aria-label="Preço mínimo"/>
    <input id="filterPrecoMax" type="number" min="0" step="0.01" placeholder="Preço máx." aria-label="Preço máximo"/>
    <select id="filterSort" aria-label="Ordenar">
      <option value="name-asc">Nome A-Z</option>
      <option value="name-desc">Nome Z-A</option>
      <option value="price-asc">Menor preço</option>
      <option value="price-desc">Maior preço</option>
    </select>
  </div>
  <button type="button" class="btn-clear-filters" id="btnClearFilters">Limpar filtros</button>
  <button type="button" class="btn-notfound" id="btnNotFound">Não encontrei minha peça</button>
  <span class="total-badge" id="totalBadge">0 produtos</span>
</div>

<div class="quick-filters" id="quickFilters" aria-label="Filtros rápidos"></div>
<section class="top-products" id="topProducts" hidden></section>

<details class="quick-order quick-order-collapsed" aria-label="Pedido rápido por código">
  <summary>
    <span>Tenho uma lista de códigos</span>
    <small>Recurso avançado para quem já sabe os códigos das peças</small>
  </summary>
  <div class="quick-order-body">
    <div>
      <strong>Pedido rápido por código</strong>
      <p>Cole códigos e quantidades, um por linha. Exemplo: <code>12345 2</code></p>
    </div>
    <textarea id="quickOrderInput" placeholder="12345 2
ABC987 1"></textarea>
    <button type="button" class="btn-add" id="btnQuickOrder">Adicionar códigos ao pedido</button>
  </div>
</details>

<div class="main">
  <section class="produtos-area" aria-label="Produtos">
    <div class="produtos-grid" id="produtosGrid"></div>
    <nav class="pagination-bar" id="paginationBar" aria-label="Paginação do catálogo"></nav>
  </section>

  <aside class="cart-panel" aria-label="Carrinho">
    <div class="cart-header">
      <h2 id="cartTitle">Carrinho (0 itens)</h2>
      <p>Adicione itens e envie o pedido pelo WhatsApp.</p>
      <p id="cartTotal" class="cart-count"></p>
    </div>
    <div class="cart-list" id="cartList"></div>
    <div class="cart-empty" id="cartEmpty">
      <p>Seu carrinho está vazio.<br/>Use <strong>Adicionar</strong> nos produtos.</p>
    </div>
    <div class="cart-footer">
      <div class="cart-subtotal" id="cartSubtotal"></div>
      <textarea id="cartNote" class="cart-note" placeholder="Observação para o consultor (opcional)"></textarea>
      ${whatsButtons}
      <button type="button" class="btn-clear" id="btnClear">Limpar carrinho</button>
    </div>
  </aside>
</div>

<div class="image-modal" id="imageModal" aria-hidden="true">
  <button type="button" class="image-modal-close" id="imageModalClose" aria-label="Fechar imagem">×</button>
  <img id="imageModalImg" alt="Imagem ampliada do produto"/>
</div>

<div class="product-modal" id="productModal" aria-hidden="true">
  <button type="button" class="product-modal-close" id="productModalClose" aria-label="Fechar detalhes">×</button>
  <div class="product-modal-content" id="productModalBody"></div>
</div>

<button type="button" class="mobile-cart-btn" id="mobileCartBtn">Ver pedido</button>

<div class="toast" id="toast" role="status"></div>

<script id="catalog-data" type="application/json">${productsJson}</script>
<script>window.CATALOG_CONFIG = ${configJson};</script>
<script src="./assets/textos.js"></script>
<script src="./assets/consultores.js"></script>
<script src="./assets/cart.js"></script>
<script src="./assets/catalog.js"></script>
</body>
</html>`;
}

function generateAdminHtml(options = {}) {
  const vendedores = normalizeVendedores(options.vendedores || []);
  const css = readAsset('catalog.css');
  const vendedoresJson = JSON.stringify(vendedores).replace(/</g, '\\u003c');
  const baseUrl = String(options.baseUrl || 'https://catalogo-zautomotiva.vercel.app/');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Painel Local de Ofertas | Z Automotiva</title>
  <meta name="robots" content="noindex,nofollow"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>${css}</style>
</head>
<body>
<header class="topbar">
  <div class="topbar-left">
    <img class="topbar-logo" src="./logo.png" alt="Z Automotiva" onerror="this.style.display='none'"/>
    <div class="topbar-title">Z <span>Automotiva</span> · Painel local de ofertas</div>
  </div>
</header>

<main class="admin-page">
  <section class="admin-card">
    <span class="hero-kicker">Ferramenta interna</span>
    <h1>Gerar link especial</h1>
    <p>Escolha seu nome na lista de cosultor, e digite nome do cliente que as condições serão personalizadas para ele.</p>
    <div class="local-warning"><strong>Importante:</strong> o cliente recebe somente o link gerado. Não envie esse painel para clientes.</div>

    <label>URL pública do catálogo
      <input id="baseUrl" type="url" value="${escapeHtml(baseUrl)}" placeholder="https://seu-site.vercel.app/"/>
      <small>NÃO ALTERE ESSE LINK.</small>
    </label>

    <label>Consultor
      <select id="adminSeller"></select>
    </label>

    <label>Nome do cliente <small>(opcional, aparece no banner do catálogo)</small>
      <input id="adminClient" type="text" placeholder="Ex.: Autopeças Silva"/>
    </label>

    <div class="admin-grid">
      <label>Tipo de ajuste
        <select id="adminMode">
          <option value="discount">Desconto</option>
          <option value="increase">Acréscimo</option>
        </select>
      </label>

      <label>Percentual
        <input id="adminDiscount" type="number" min="0" max="95" step="0.01" placeholder="Ex.: 5"/>
      </label>
    </div>

    <label>Validade do link
      <select id="adminValidity">
        <option value="1">1 dia</option>
        <option value="3">3 dias</option>
        <option value="7" selected>7 dias</option>
        <option value="15">15 dias</option>
        <option value="30">30 dias</option>
      </select>
      <small>Escolha aqui ate quando sera a validade da oferta</small>
    </label>

    <button type="button" class="btn-add admin-generate" id="adminGenerate">Gerar link</button>

    <div class="admin-result" id="adminResult" hidden>
      <strong>Link gerado:</strong>
      <textarea id="adminLink" readonly></textarea>
      <button type="button" class="btn-whats" id="adminCopy">Copiar link</button>
      <p>Envie esse link para o cliente.</p>
    </div>

    <div class="admin-result">
      <strong>Histórico local</strong>
      <p>Fica salvo apenas neste navegador/dispositivo.</p>
      <div class="admin-history" id="adminHistory"></div>
      <button type="button" class="btn-clear" id="adminClearHistory">Limpar histórico</button>
    </div>
  </section>
</main>

<div class="toast" id="toast" role="status"></div>
<script id="seller-data" type="application/json">${vendedoresJson}</script>
<script>
(function(){
  const HISTORY_KEY = 'zautomotiva_offer_history_v1';
  const sellers = JSON.parse(document.getElementById('seller-data').textContent || '[]');
  const sellerEl = document.getElementById('adminSeller');
  const modeEl = document.getElementById('adminMode');
  const discountEl = document.getElementById('adminDiscount');
  const clientEl = document.getElementById('adminClient');
  const validityEl = document.getElementById('adminValidity');
  const baseUrlEl = document.getElementById('baseUrl');
  const resultEl = document.getElementById('adminResult');
  const linkEl = document.getElementById('adminLink');
  const toastEl = document.getElementById('toast');
  const historyEl = document.getElementById('adminHistory');
  let toastTimer;

  function escapeHtml(s){ return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function showToast(msg){ if(!toastEl) return; toastEl.textContent = msg; toastEl.className = 'toast show ok'; clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200); }
  function compactDiscount(value){ return String(value).replace('.', 'p'); }
  function compactDate(dateLike){ const d = new Date(dateLike); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); return '' + y + m + day; }
  function formatDate(dateLike){ const d = new Date(dateLike); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' }); }
  function loadHistory(){ try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } }
  function saveHistory(items){ try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 30))); } catch {} }

  sellerEl.innerHTML = sellers.length
    ? sellers.map((s) => '<option value="' + escapeHtml(s.id || s.slug || s.nome || '') + '">' + escapeHtml(s.nome || s.id || 'Consultor') + '</option>').join('')
    : '<option value="">Nenhum consultor cadastrado</option>';

  function renderHistory(){
    const items = loadHistory();
    if (!historyEl) return;
    if (!items.length) { historyEl.innerHTML = '<small>Nenhum link gerado ainda.</small>'; return; }
    historyEl.innerHTML = items.map((h, idx) =>
      '<div class="admin-history-item">' +
        '<strong>' + escapeHtml(h.sellerName) + ' · ' + escapeHtml(h.modeLabel) + ' ' + escapeHtml(String(h.discount)) + '%</strong>' +
        '<small>Gerado em ' + escapeHtml(formatDate(h.createdAt)) + ' · válido até ' + escapeHtml(formatDate(h.expiresAt)) + '</small>' +
        '<div class="admin-history-actions">' +
          '<button type="button" data-copy-history="' + idx + '">Copiar</button>' +
          '<button type="button" data-open-history="' + idx + '">Abrir</button>' +
        '</div>' +
      '</div>'
    ).join('');
  }

  document.getElementById('adminGenerate').addEventListener('click', () => {
    const seller = sellerEl.value;
    const sellerObj = sellers.find((s) => String(s.id || s.slug || s.nome || '') === seller) || {};
    const discount = Math.max(0, Math.min(95, Number(discountEl.value || 0)));
    const mode = modeEl.value || 'discount';
    const validityDays = Math.max(1, Number(validityEl.value || 7));
    const clientName = String(clientEl?.value || '').trim();
    if (!seller) { showToast('Cadastre ao menos um consultor'); return; }
    if (!discount) { showToast('Informe um percentual maior que zero'); return; }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
    const token = [seller, compactDiscount(discount), mode === 'increase' ? 'i' : 'd', compactDate(expiresAt)].join('-');
    let base = String(baseUrlEl.value || '').trim();
    if (!base) { showToast('Informe a URL pública do catálogo'); return; }
    if (!/^https?:\\/\\//i.test(base)) base = 'https://' + base;

    const url = new URL(base);
    if (!url.pathname || url.pathname === '/') url.pathname = '/index.html';
    url.searchParams.set('o', token);
    if (clientName) url.searchParams.set('cliente', clientName);
    linkEl.value = url.href;
    resultEl.hidden = false;

    const modeLabel = mode === 'increase' ? 'Acréscimo' : 'Desconto';
    const history = loadHistory();
    history.unshift({ seller, sellerName: sellerObj.nome || seller, clientName, discount, mode, modeLabel, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(), url: url.href });
    saveHistory(history);
    renderHistory();
    showToast('Link gerado');
  });

  document.getElementById('adminCopy').addEventListener('click', async () => {
    if (!linkEl.value) return;
    linkEl.select();
    try { await navigator.clipboard.writeText(linkEl.value); showToast('Link copiado'); }
    catch { document.execCommand('copy'); showToast('Link copiado'); }
  });

  historyEl?.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('[data-copy-history]');
    const openBtn = e.target.closest('[data-open-history]');
    const history = loadHistory();
    if (copyBtn) {
      const item = history[Number(copyBtn.dataset.copyHistory)];
      if (!item?.url) return;
      try { await navigator.clipboard.writeText(item.url); showToast('Link copiado'); }
      catch { linkEl.value = item.url; linkEl.select(); document.execCommand('copy'); showToast('Link copiado'); }
    }
    if (openBtn) {
      const item = history[Number(openBtn.dataset.openHistory)];
      if (item?.url) window.open(item.url, '_blank');
    }
  });

  document.getElementById('adminClearHistory')?.addEventListener('click', () => { saveHistory([]); renderHistory(); showToast('Histórico limpo'); });
  renderHistory();
})();
</script>
</body>
</html>`;
}

/**
 * Copy shared assets next to generated catalogs for optional external hosting.
 */
function copyAssetsToOutput(outputDir) {
  const assetsDir = path.join(outputDir, 'assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  const assets = [
    // Código/visual devem acompanhar o npm, para todos os links e catálogos receberem a última versão.
    { src: 'catalog.css', name: 'catalog.css', preserveIfExists: false },
    { src: 'catalog.js', name: 'catalog.js', preserveIfExists: false },
    { src: '../cart/cart.js', name: 'cart.js', preserveIfExists: false },

    // Textos e consultores são configuração comercial/manual; preserva se já existirem.
    { src: 'textos.js', name: 'textos.js', preserveIfExists: true },
    { src: 'consultores.js', name: 'consultores.js', preserveIfExists: true },
  ];

  for (const item of assets) {
    const targetFile = path.join(assetsDir, item.name);

    if (item.preserveIfExists && fs.existsSync(targetFile)) {
      console.log(`Preservando configuração manual: assets/${item.name}`);
      continue;
    }

    fs.writeFileSync(targetFile, readAsset(item.src), 'utf8');
  }

  const logoSrc = path.join(__dirname, '..', 'logo.png');
  const logoDest = path.join(outputDir, 'logo.png');
  if (fs.existsSync(logoSrc) && !fs.existsSync(logoDest)) {
    fs.copyFileSync(logoSrc, logoDest);
  }
}

module.exports = { generateCatalogHtml, generateAdminHtml, copyAssetsToOutput };
