/**
 * Catalog UI: search, filters, sort, pagination, cart integration, private offer links,
 * product details modal, quick order, share product, mobile cart CTA.
 */
(function () {
  const cfg = window.CATALOG_CONFIG || {};
  const catalogId = cfg.id || 'default';
  const PAGE_SIZE = cfg.pageSize || 24;
  const ANALYTICS_KEY = 'zautomotiva_analytics_v1';
  const VIP_KEY = 'zautomotiva_vip_clients_v1';
  const FAVORITES_KEY = 'zautomotiva_favorites_v1';
  const HISTORY_KEY = 'zautomotiva_history_v1';
  const FEATURES = Object.assign({
    remoteAnalytics: true,
    remoteRanking: true,
    smartSearch: true,
    searchSuggestions: true,
    remoteTrends: true,
    favorites: true,
    history: true,
    cartShare: true,
    relatedProducts: true,
  }, window.Z_FEATURES || {});


  const DEFAULT_TEXTOS = {
    searchKicker: '🔎 Encontre sua peça',
    searchTitle: 'Digite código, código fabricante, descrição, marca ou veiculo.',
    searchSubtitle: 'A busca é instantânea. Comece digitando qualquer informação da peça.',
    searchPlaceholder: 'Ex.: 12345, TYC, Retrovisor, gol, código fabricante...',
    trustItems: [
      '✓ Preço com IPI incluso',
      '✓ Consulte disponibilidade com o consultor',
      '✓ Pedido direto pelo WhatsApp',
      '✓ Busca por código, marca ou descrição',
    ],
    clearFiltersButton: 'Limpar filtros',
    notFoundButton: 'Não encontrei minha peça',
    quickOrderTitle: 'Tenho uma lista de códigos',
    quickOrderDescription: 'Recurso avançado para quem já sabe os códigos das peças',
    quickOrderBoxTitle: 'Pedido rápido por código',
    quickOrderBoxHelp: 'Cole códigos e quantidades, um por linha. Exemplo: 12345 2',
    quickOrderButton: 'Adicionar códigos ao pedido',
    cartNotePlaceholder: 'Observação para o consultor (opcional)',
    offerActiveKicker: 'Catálogo exclusivo para negociação',
    offerActiveTitle: 'Você recebeu uma condição comercial personalizada.',
    offerActiveText: 'Valores diferenciados, atendimento consultivo e pedido direto com a equipe Z Automotiva.',
    offerConsultantLabel: '👤 Consultor responsável',
    offerValidUntilPrefix: '⏰ Válido até',
    offerLimitedText: '⏰ Condição por tempo limitado',
    offerBenefit1: 'Valores diferenciados para negociação',
    offerBenefit2: 'Pedido direto com consultor',
    offerBenefit3: 'Condição temporária e personalizada',
    partnershipKicker: 'Catálogo comercial Z Automotiva',
    partnershipTitle: 'Mais agilidade para consultar peças e montar seu orçamento.',
    partnershipText: 'Busque por código, aplicação, marca ou descrição e envie seu pedido direto para um consultor. Atendimento pensado para distribuidores, autopeças e parceiros.',
    partnershipBadge: '🤝 Atendimento de parceria',
    partnershipBenefit1: 'Preços com IPI incluso',
    partnershipBenefit2: 'Pedido rápido pelo WhatsApp',
    partnershipBenefit3: 'Suporte consultivo da equipe Z',
    offerExpiredKicker: 'Condição encerrada',
    offerExpiredTitle: 'Este acesso especial expirou',
    offerExpiredText: 'Os preços voltaram ao padrão do catálogo. Fale com seu consultor para solicitar uma nova condição comercial.',
  };

  const TEXTOS = { ...DEFAULT_TEXTOS, ...(window.Z_TEXTOS || {}) };

  const els = {
    grid: document.getElementById('produtosGrid'),
    busca: document.getElementById('buscaInput'),
    marcaFilter: document.getElementById('filterMarca'),
    catalogoFilter: document.getElementById('filterCatalogo'),
    precoMin: document.getElementById('filterPrecoMin'),
    precoMax: document.getElementById('filterPrecoMax'),
    sort: document.getElementById('filterSort'),
    totalBadge: document.getElementById('totalBadge'),
    quickFilters: document.getElementById('quickFilters'),
    topProducts: document.getElementById('topProducts'),
    clearFilters: document.getElementById('btnClearFilters'),
    quickOrderInput: document.getElementById('quickOrderInput'),
    quickOrderBtn: document.getElementById('btnQuickOrder'),
    notFoundBtn: document.getElementById('btnNotFound'),
    cartList: document.getElementById('cartList'),
    cartEmpty: document.getElementById('cartEmpty'),
    cartTitle: document.getElementById('cartTitle'),
    cartTotal: document.getElementById('cartTotal'),
    cartSubtotal: document.getElementById('cartSubtotal'),
    cartNote: document.getElementById('cartNote'),
    btnWhats: Array.from(document.querySelectorAll('[data-whats-index]')),
    btnClear: document.getElementById('btnClear'),
    toast: document.getElementById('toast'),
    pagination: document.getElementById('paginationBar'),
    imageModal: document.getElementById('imageModal'),
    imageModalImg: document.getElementById('imageModalImg'),
    imageModalClose: document.getElementById('imageModalClose'),
    productModal: document.getElementById('productModal'),
    productModalBody: document.getElementById('productModalBody'),
    productModalClose: document.getElementById('productModalClose'),
    mobileCartBtn: document.getElementById('mobileCartBtn'),
    offerBanner: document.getElementById('offerBanner'),
  };

  let products = [];
  let filtered = [];
  let currentPage = 1;
  let toastTimer;
  let currentOffer = null;
  let currentConsultorId = '';

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value != null) el.textContent = String(value);
  }

  function applyTextConfig() {
    setText('searchKicker', TEXTOS.searchKicker);
    setText('searchTitle', TEXTOS.searchTitle);
    setText('searchSubtitle', TEXTOS.searchSubtitle);
    if (els.busca && TEXTOS.searchPlaceholder) els.busca.placeholder = TEXTOS.searchPlaceholder;

    const trustStrip = document.getElementById('trustStrip');
    if (trustStrip && Array.isArray(TEXTOS.trustItems)) {
      trustStrip.innerHTML = TEXTOS.trustItems.map((item) => `<span>${escapeHtml(item)}</span>`).join('');
    }

    if (els.clearFilters && TEXTOS.clearFiltersButton) els.clearFilters.textContent = TEXTOS.clearFiltersButton;
    if (els.notFoundBtn && TEXTOS.notFoundButton) els.notFoundBtn.textContent = TEXTOS.notFoundButton;
    if (els.quickOrderBtn && TEXTOS.quickOrderButton) els.quickOrderBtn.textContent = TEXTOS.quickOrderButton;
    if (els.cartNote && TEXTOS.cartNotePlaceholder) els.cartNote.placeholder = TEXTOS.cartNotePlaceholder;

    const quickOrder = document.querySelector('.quick-order-collapsed summary');
    if (quickOrder) {
      const title = quickOrder.querySelector('span');
      const desc = quickOrder.querySelector('small');
      if (title && TEXTOS.quickOrderTitle) title.textContent = TEXTOS.quickOrderTitle;
      if (desc && TEXTOS.quickOrderDescription) desc.textContent = TEXTOS.quickOrderDescription;
    }

    const quickOrderBody = document.querySelector('.quick-order-body');
    if (quickOrderBody) {
      const title = quickOrderBody.querySelector('strong');
      const help = quickOrderBody.querySelector('p');
      if (title && TEXTOS.quickOrderBoxTitle) title.textContent = TEXTOS.quickOrderBoxTitle;
      if (help && TEXTOS.quickOrderBoxHelp) help.innerHTML = escapeHtml(TEXTOS.quickOrderBoxHelp).replace('12345 2', '<code>12345 2</code>');
    }
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function showToast(msg, ok) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.className = 'toast show' + (ok ? ' ok' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2400);
  }

  function loadAnalytics() {
    try {
      const data = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '{}');
      return {
        views: Number(data.views || 0),
        searches: Number(data.searches || 0),
        addToCart: Number(data.addToCart || 0),
        whatsappClicks: Number(data.whatsappClicks || 0),
        products: data.products && typeof data.products === 'object' ? data.products : {},
        lastVisit: data.lastVisit || '',
      };
    } catch {
      return { views: 0, searches: 0, addToCart: 0, whatsappClicks: 0, products: {}, lastVisit: '' };
    }
  }

  function saveAnalytics(data) {
    try { localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data)); } catch {}
  }

  function readJsonStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJsonStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function loadFavorites() {
    const data = readJsonStorage(FAVORITES_KEY, {});
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  }

  function isFavorite(product) {
    return Boolean(loadFavorites()[productKey(product)]);
  }

  function toggleFavorite(product) {
    if (!FEATURES.favorites || !product) return false;
    const favs = loadFavorites();
    const key = productKey(product);
    const exists = Boolean(favs[key]);
    if (exists) delete favs[key];
    else {
      favs[key] = {
        key,
        cod: product.cod || '',
        codFab: product.codFab || '',
        nome: product.nome || '',
        marca: product.marca || '',
        catalogo: product.catalogo || '',
        imgSrc: product.imgSrc || '',
        preco: getDisplayPrice(product) || product.preco || '',
        savedAt: new Date().toISOString()
      };
      trackEvent('favorite', { product });
    }
    writeJsonStorage(FAVORITES_KEY, favs);
    renderPersonalSections();
    render();
    showToast(exists ? 'Removido dos favoritos' : 'Salvo nos favoritos', !exists);
    return !exists;
  }

  function loadHistory() {
    const data = readJsonStorage(HISTORY_KEY, []);
    return Array.isArray(data) ? data : [];
  }

  function rememberProduct(product, action = 'view') {
    if (!FEATURES.history || !product) return;
    const key = productKey(product);
    const compact = {
      key,
      cod: product.cod || '',
      codFab: product.codFab || '',
      nome: product.nome || '',
      marca: product.marca || '',
      catalogo: product.catalogo || '',
      imgSrc: product.imgSrc || '',
      preco: getDisplayPrice(product) || product.preco || '',
      action,
      viewedAt: new Date().toISOString()
    };
    const history = loadHistory().filter((item) => item.key !== key);
    history.unshift(compact);
    writeJsonStorage(HISTORY_KEY, history.slice(0, 30));
    renderPersonalSections();
  }

  function findProductByCompact(item) {
    if (!item) return null;
    return products.find((p) => productKey(p) === item.key)
      || products.find((p) => (item.cod && p.cod === item.cod) || (item.codFab && p.codFab === item.codFab))
      || null;
  }

  function renderMiniProductChip(item, mode) {
    const code = item.cod || item.codFab || 'Código';
    const label = String(item.nome || '').slice(0, 54);
    return `
      <button type="button" class="personal-chip" data-personal-key="${escapeAttr(item.key || '')}" data-personal-mode="${escapeAttr(mode)}">
        ${item.imgSrc ? `<img src="${escapeAttr(item.imgSrc)}" alt="">` : '<span class="personal-chip-img">Z</span>'}
        <span><b>${escapeHtml(code)}</b><small>${escapeHtml(label)}${String(item.nome || '').length > 54 ? '...' : ''}</small></span>
      </button>`;
  }

  function ensurePersonalSection() {
    if (document.getElementById('personalProducts')) return document.getElementById('personalProducts');
    const section = document.createElement('section');
    section.id = 'personalProducts';
    section.className = 'personal-products';
    const anchor = document.getElementById('trendingProducts') || els.topProducts || document.querySelector('.quick-filters');
    anchor?.insertAdjacentElement('afterend', section);
    return section;
  }

  function renderPersonalSections() {
    if (!FEATURES.favorites && !FEATURES.history) return;
    const section = ensurePersonalSection();
    if (!section) return;
    const favs = Object.values(loadFavorites()).sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || ''))).slice(0, 4);
    const recent = loadHistory().slice(0, 4);
    if (!favs.length && !recent.length) {
      section.hidden = true;
      section.innerHTML = '';
      return;
    }
    section.hidden = false;
    section.innerHTML = `
      ${favs.length ? `<div class="personal-box"><div class="top-products-head"><strong>❤️ Seus favoritos</strong><span>Salvos neste dispositivo</span></div><div class="personal-list">${favs.map((item) => renderMiniProductChip(item, 'favorite')).join('')}</div></div>` : ''}
      ${recent.length ? `<div class="personal-box"><div class="top-products-head"><strong>🕘 Vistos recentemente</strong><span>Histórico rápido deste dispositivo</span></div><div class="personal-list">${recent.map((item) => renderMiniProductChip(item, 'history')).join('')}</div></div>` : ''}
    `;
  }

  function getRelatedProducts(product, limit = 6) {
    if (!FEATURES.relatedProducts || !product) return [];
    const baseName = normalizeSearch(product.nome || '');
    const tokens = baseName.split(' ').filter((t) => t.length >= 4).slice(0, 8);
    return products
      .filter((p) => productKey(p) !== productKey(product))
      .map((p) => {
        let score = 0;
        if (product.marca && p.marca === product.marca) score += 4;
        if (product.catalogo && p.catalogo === product.catalogo) score += 3;
        const name = normalizeSearch(p.nome || '');
        tokens.forEach((t) => { if (name.includes(t)) score += 2; });
        return { p, score };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || String(a.p.nome || '').localeCompare(String(b.p.nome || '')))
      .slice(0, limit)
      .map((row) => row.p);
  }

  function renderRelatedProducts(product) {
    const related = getRelatedProducts(product, 4);
    if (!related.length) return '';
    return `
      <div class="related-products related-products-v3">
        <div class="related-head-v3">
          <div>
            <strong>Frequentemente comprados juntos</strong>
            <span>Complementares, similares ou do mesmo veículo.</span>
          </div>
          <button type="button" class="btn-linkish compact" id="modalAddRelatedAll">Adicionar todos</button>
        </div>
        <div class="related-list related-grid-v3">
          ${related.map((p) => {
            const img = p.imgSrc || '';
            const price = getDisplayPrice(p) || 'Consulte';
            return `
              <article class="related-card-v3" data-related-key="${escapeAttr(productKey(p))}">
                <button type="button" class="related-open" data-related-open="${escapeAttr(productKey(p))}">
                  <div class="related-img">${img ? `<img src="${escapeAttr(img)}" alt="${escapeAttr(p.nome || 'Produto')}" loading="lazy">` : '<span>Sem imagem</span>'}</div>
                  <div class="related-info">
                    <b>${escapeHtml(window.ZCart.displayCode(p))}</b>
                    <span>${escapeHtml(String(p.nome || '').slice(0, 62))}${String(p.nome || '').length > 62 ? '...' : ''}</span>
                    <strong>${escapeHtml(price)}</strong>
                    <small>✓ Valor com IPI incluso</small>
                  </div>
                </button>
                <button type="button" class="related-add" data-related-add="${escapeAttr(productKey(p))}">+ Adicionar</button>
              </article>`;
          }).join('')}
        </div>
      </div>`;
  }

  function encodeCartItems(items) {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(items)))); } catch { return ''; }
  }

  function decodeCartItems(value) {
    try { return JSON.parse(decodeURIComponent(escape(atob(value)))); } catch { return []; }
  }

  function restoreCartFromUrl() {
    if (!FEATURES.cartShare) return;
    const params = new URLSearchParams(window.location.search);
    const packed = params.get('cart');
    if (!packed) return;
    const items = decodeCartItems(packed);
    if (!Array.isArray(items) || !items.length) return;
    window.ZCart.save(catalogId, items);
    showToast('Carrinho compartilhado carregado', true);
    const clean = new URL(window.location.href);
    clean.searchParams.delete('cart');
    history.replaceState(null, '', clean.toString());
  }

  function shareCartLink() {
    if (!FEATURES.cartShare) return;
    const items = window.ZCart.load(catalogId);
    if (!items.length) { showToast('Adicione itens para gerar o link'); return; }
    const url = new URL(window.location.href);
    url.searchParams.set('cart', encodeCartItems(items));
    copyText(url.toString());
    showToast('Link do carrinho copiado', true);
  }

  function ensureCartShareButton() {
    if (!FEATURES.cartShare || document.getElementById('btnShareCart')) return;
    const btn = document.createElement('button');
    btn.id = 'btnShareCart';
    btn.type = 'button';
    btn.className = 'btn-secondary btn-share-cart';
    btn.textContent = 'Copiar link do carrinho';
    (els.btnClear?.parentElement || els.cartList?.parentElement)?.appendChild(btn);
    btn.addEventListener('click', shareCartLink);
  }


  function getClientId() {
    const key = 'zautomotiva_client_id_v1';
    try {
      let id = localStorage.getItem(key);
      if (!id) {
        id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(key, id);
      }
      return id;
    } catch {
      return '';
    }
  }

  function trackRemoteEvent(type, payload = {}) {
    if (!FEATURES.remoteAnalytics) return;
    const body = JSON.stringify({
      eventType: type,
      catalogId,
      consultorId: currentConsultorId || '',
      clientId: getClientId(),
      url: location.pathname + location.search,
      userAgent: navigator.userAgent || '',
      query: payload.query || '',
      qty: Number(payload.qty || 1),
      product: payload.product ? {
        cod: payload.product.cod || '',
        codFab: payload.product.codFab || '',
        nome: payload.product.nome || '',
        marca: payload.product.marca || '',
        catalogo: payload.product.catalogo || '',
        preco: payload.product.preco || '',
        precoNum: payload.product.precoNum ?? null,
      } : null
    });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics', blob);
        return;
      }
    } catch {}

    try {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      }).catch(() => {});
    } catch {}
  }

  function trackEvent(type, payload = {}) {
    const data = loadAnalytics();
    if (type === 'view') {
      data.views += 1;
      data.lastVisit = new Date().toISOString();
    }
    if (type === 'search') data.searches += 1;
    if (type === 'add_to_cart') data.addToCart += Number(payload.qty || 1);
    if (type === 'whatsapp') data.whatsappClicks += 1;
    if (payload.product) {
      const p = payload.product;
      const key = productKey(p);
      const current = data.products[key] || {
        cod: p.cod || '',
        codFab: p.codFab || '',
        nome: p.nome || '',
        marca: p.marca || '',
        catalogo: p.catalogo || '',
        count: 0,
        whatsappCount: 0,
      };
      current.count += Number(payload.qty || 1);
      if (type === 'whatsapp') current.whatsappCount += Number(payload.qty || 1);
      data.products[key] = current;
    }
    saveAnalytics(data);
    trackRemoteEvent(type, payload);
  }

  function getTopAnalyticsProducts(limit = 6) {
    const data = loadAnalytics();
    return Object.values(data.products || {})
      .sort((a, b) => (Number(b.whatsappCount || 0) + Number(b.count || 0)) - (Number(a.whatsappCount || 0) + Number(a.count || 0)))
      .slice(0, limit);
  }

  function renderTopProducts(items, sourceLabel) {
    if (!els.topProducts) return;
    const top = (Array.isArray(items) && items.length ? items : getTopAnalyticsProducts(4)).slice(0, 4);
    if (!top.length) {
      els.topProducts.hidden = true;
      els.topProducts.innerHTML = '';
      return;
    }
    els.topProducts.hidden = false;
    els.topProducts.innerHTML = `
      <div class="top-products-head">
        <strong>🔥 Produtos mais adicionados aos pedidos</strong>
        <span>${escapeHtml(sourceLabel || 'Baseado nos pedidos deste navegador')}</span>
      </div>
      <div class="top-products-list">
        ${top.map((p) => `
          <button type="button" class="top-product-chip" data-top-code="${escapeAttr(p.cod || p.codFab || '')}">
            <b>${escapeHtml(p.cod || p.codFab || 'Código')}</b>
            <span>${escapeHtml(String(p.nome || '').slice(0, 48))}${String(p.nome || '').length > 48 ? '...' : ''}</span>
            ${p.total ? `<small>${Number(p.total)} pedido${Number(p.total) === 1 ? '' : 's'}</small>` : ''}
          </button>
        `).join('')}
      </div>`;
  }

  async function refreshRemoteTopProducts() {
    if (!FEATURES.remoteRanking || !els.topProducts) return;
    try {
      const qs = new URLSearchParams({ catalogId, range: '30d', limit: '4' });
      const res = await fetch(`/api/ranking?${qs.toString()}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length) {
        renderTopProducts(data.items, 'Baseado nos pedidos enviados por todos os clientes nos últimos 30 dias');
      }
    } catch {}
  }


  function ensureTrendsSection() {
    if (!FEATURES.remoteTrends || document.getElementById('trendingProducts')) return null;
    const section = document.createElement('section');
    section.id = 'trendingProducts';
    section.className = 'top-products trend-products';
    section.hidden = true;
    if (els.topProducts?.parentNode) {
      els.topProducts.insertAdjacentElement('afterend', section);
    } else {
      document.querySelector('.quick-filters')?.insertAdjacentElement('afterend', section);
    }
    return section;
  }

  function renderTrendProducts(items) {
    const section = ensureTrendsSection();
    if (!section) return;
    const top = Array.isArray(items) ? items.filter((item) => Number(item.current || 0) > 0) : [];
    if (!top.length) {
      section.hidden = true;
      section.innerHTML = '';
      return;
    }
    section.hidden = false;
    section.innerHTML = `
      <div class="top-products-head">
        <strong>📈 Produtos em tendência</strong>
        <span>Comparativo dos últimos 7 dias contra os 7 dias anteriores</span>
      </div>
      <div class="top-products-list">
        ${top.map((p) => `
          <button type="button" class="top-product-chip trend-chip" data-top-code="${escapeAttr(p.cod || p.codFab || '')}">
            <b>${escapeHtml(p.cod || p.codFab || 'Código')}</b>
            <span>${escapeHtml(String(p.nome || '').slice(0, 48))}${String(p.nome || '').length > 48 ? '...' : ''}</span>
            <small>${Number(p.current || 0)} pedido${Number(p.current || 0) === 1 ? '' : 's'} · ${Number(p.growth || 0) >= 999 ? 'novo' : `+${Number(p.growth || 0)}%`}</small>
          </button>
        `).join('')}
      </div>`;
  }

  async function refreshRemoteTrends() {
    if (!FEATURES.remoteTrends) return;
    try {
      const qs = new URLSearchParams({ catalogId, limit: '8' });
      const res = await fetch(`/api/trends?${qs.toString()}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length) renderTrendProducts(data.items);
    } catch {}
  }

  function renderAnalyticsPanelIfRequested() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('stats') && !params.has('analytics')) return;
    const data = loadAnalytics();
    const panel = document.createElement('section');
    panel.className = 'analytics-panel';
    panel.innerHTML = `
      <strong>📊 Analytics local do catálogo</strong>
      <div class="analytics-grid">
        <span><b>${data.views}</b> acessos</span>
        <span><b>${data.searches}</b> buscas</span>
        <span><b>${data.addToCart}</b> peças adicionadas</span>
        <span><b>${data.whatsappClicks}</b> cliques WhatsApp</span>
      </div>
      <small>Dados salvos apenas neste navegador. Use ?stats=1 para visualizar.</small>
    `;
    document.body.insertBefore(panel, document.body.firstChild?.nextSibling || document.body.firstChild);
  }


  function normalizeSearch(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[ºª°]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function normalizeCompact(value) {
    return normalizeSearch(value).replace(/\s+/g, '');
  }

  function buildSearchText(p) {
    return normalizeSearch([
      p?.searchText, p?.nome, p?.desc, p?.cod, p?.codFab, p?.marca, p?.catalogo
    ].filter(Boolean).join(' '));
  }

  function productMatchesQuery(p, q) {
    if (!q) return true;
    const hay = p._search || buildSearchText(p);
    const compact = p._searchCompact || normalizeCompact(hay);
    const terms = normalizeSearch(q).split(/\s+/).filter(Boolean);
    return terms.every((term) => hay.includes(term) || compact.includes(normalizeCompact(term)));
  }

  function scoreSuggestion(p, q) {
    const nq = normalizeSearch(q);
    const compactQ = normalizeCompact(q);
    const code = normalizeSearch(p.cod || '');
    const fab = normalizeSearch(p.codFab || '');
    const name = normalizeSearch(p.nome || '');
    let score = 0;
    if (code === nq || fab === nq) score += 100;
    if (code.startsWith(nq) || fab.startsWith(nq)) score += 60;
    if (normalizeCompact(code).includes(compactQ) || normalizeCompact(fab).includes(compactQ)) score += 40;
    if (name.includes(nq)) score += 20;
    if (productMatchesQuery(p, q)) score += 10;
    return score;
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }
  function slugify(value) { return normalizeSearch(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

  function cleanCatalogLabel(value) {
    return String(value || '')
      .replace(/^\s*marca\s+/i, '')
      .replace(/^\s*cat[áa]logo\s+/i, '')
      .trim();
  }

  function roundUpCents(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.ceil((n - Number.EPSILON) * 100) / 100 : null;
  }

  function getPolicyBaseDiscount(p) {
    const productPolicy = Number(p?.politicaComercialCatalogo ?? 45);
    const consultor = getActiveSeller();
    const tipo = String(consultor?.ajusteTipo || consultor?.adjustmentType || consultor?.tipoAjuste || '').toLowerCase();

    if (consultor && (tipo === 'politicadesconto' || tipo === 'politica-desconto' || tipo === 'policy-discount')) {
      const destino = Number(consultor.descontoDestino ?? consultor.targetDiscount ?? consultor.politicaDesconto ?? productPolicy);
      return Number.isFinite(destino) ? destino : productPolicy;
    }

    return Number.isFinite(productPolicy) ? productPolicy : 45;
  }

  function getBaseSystemPriceNum(p) {
    const direct = Number(p?.precoBaseSistemaNum);
    if (Number.isFinite(direct) && direct > 0) return direct;
    if (p?.precoBaseSistema) {
      const parsed = parsePreco({ preco: p.precoBaseSistema });
      if (parsed != null) return parsed;
    }
    const current = parsePreco(p);
    const policy = Number(p?.politicaComercialCatalogo ?? 45);
    if (current != null && Number.isFinite(policy) && policy < 100) {
      return current / (1 - policy / 100);
    }
    return current;
  }

  function priceByPolicy(p, policyDiscount) {
    const base = getBaseSystemPriceNum(p);
    if (base == null) return null;
    const target = Math.max(0, Math.min(95, Number(policyDiscount || 0)));
    return roundUpCents(base * (1 - target / 100));
  }

  function getNormalPolicyPriceNum(p) {
    return priceByPolicy(p, getPolicyBaseDiscount(p));
  }

  function base64UrlDecode(value) {
    try {
      const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      return decodeURIComponent(Array.prototype.map.call(atob(padded), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
    } catch { return ''; }
  }

  function compactDateToIso(value) {
    const raw = String(value || '').replace(/\D/g, '');
    if (!/^\d{8}$/.test(raw)) return '';
    const y = raw.slice(0, 4);
    const m = raw.slice(4, 6);
    const d = raw.slice(6, 8);
    return `${y}-${m}-${d}T23:59:59`;
  }

  function titleFromSlug(value) {
    return String(value || '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function loadVipClients() {
    try {
      const raw = window.Z_CLIENTES_VIP || JSON.parse(localStorage.getItem(VIP_KEY) || '{}');
      if (!raw || typeof raw !== 'object') return {};
      return raw;
    } catch { return {}; }
  }

  function readClientNameFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const direct = params.get('cliente') || params.get('client') || params.get('nomeCliente') || '';
    if (direct) return String(direct).trim().replace(/[-_]+/g, ' ');

    const vip = params.get('vip') || params.get('clienteVip') || '';
    if (vip) {
      const vipMap = loadVipClients();
      const item = vipMap[vip] || vipMap[slugify(vip)] || null;
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return item.nome || item.name || titleFromSlug(vip);
      return titleFromSlug(vip);
    }

    const short = params.get('c') || '';
    if (short && !findConsultorById(short)) return String(short).trim().replace(/[-_]+/g, ' ');
    return '';
  }

  function parseCompactOfferToken(token) {
    const parts = String(token || '').split('-').filter(Boolean);
    if (parts.length < 4) return null;
    const expRaw = parts.pop();
    const modeCode = String(parts.pop() || '').toLowerCase();
    const discountRaw = String(parts.pop() || '').replace('p', '.');
    const seller = parts.join('-').trim();
    if (!seller || !/^\d{8}$/.test(expRaw)) return null;
    const discount = Number(discountRaw);
    if (!Number.isFinite(discount) || discount <= 0) return null;
    const mode = modeCode === 'i' || modeCode === 'a' ? 'increase' : 'discount';
    const expiresAtRaw = compactDateToIso(expRaw);
    const expiresAt = new Date(expiresAtRaw);
    const isExpired = expiresAt instanceof Date && !Number.isNaN(expiresAt.getTime()) && Date.now() > expiresAt.getTime();
    return { token, seller, discount: Math.max(0, Math.min(95, discount)), mode, createdAt: '', expiresAt: expiresAtRaw, isExpired, isCompact: true };
  }

  function readOfferFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('o') || params.get('oferta') || '';
    if (!token) return null;

    const compact = parseCompactOfferToken(token);
    if (compact) return compact;

    try {
      const parsed = JSON.parse(base64UrlDecode(token));
      const discount = Number(parsed.discount ?? parsed.desconto ?? parsed.d ?? 0);
      const seller = String(parsed.seller ?? parsed.vendedor ?? parsed.s ?? '').trim();
      const mode = String(parsed.mode ?? parsed.m ?? 'discount');
      const expiresAtRaw = parsed.expiresAt ?? parsed.expiraEm ?? parsed.e ?? parsed.exp ?? '';
      const createdAtRaw = parsed.createdAt ?? parsed.criadoEm ?? parsed.c ?? '';
      const clientName = String(parsed.cliente ?? parsed.client ?? parsed.nomeCliente ?? '').trim();
      const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
      const isExpired = expiresAt instanceof Date && !Number.isNaN(expiresAt.getTime()) && Date.now() > expiresAt.getTime();
      return { token, seller, discount: Number.isFinite(discount) ? Math.max(0, Math.min(95, discount)) : 0, mode, createdAt: createdAtRaw, expiresAt: expiresAtRaw, isExpired, clientName };
    } catch { return null; }
  }

  function getExternalConsultores() {
    const raw = window.Z_CONSULTORES;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') {
      return Object.entries(raw).map(([id, value]) => ({ id, ...(value || {}) }));
    }
    return [];
  }

  function getConsultores() {
    const baseList = Array.isArray(cfg.vendedores) ? cfg.vendedores : [];
    const externos = getExternalConsultores();
    const map = new Map();

    baseList.forEach((v, idx) => {
      const id = String(v?.id || v?.slug || slugify(v?.nome || `consultor-${idx + 1}`)).trim();
      if (!id) return;
      map.set(id, {
        id,
        slug: String(v?.slug || id).trim(),
        nome: String(v?.nome || `Consultor ${idx + 1}`).trim(),
        whatsapp: String(v?.whatsapp || '').trim(),
        ...v,
      });
    });

    externos.forEach((v, idx) => {
      const id = String(v?.id || v?.slug || slugify(v?.nome || `consultor-extra-${idx + 1}`)).trim();
      if (!id) return;
      const atual = map.get(id) || {};
      map.set(id, {
        ...atual,
        ...v,
        id,
        slug: String(v?.slug || atual.slug || id).trim(),
        nome: String(v?.nome || atual.nome || `Consultor ${idx + 1}`).trim(),
        whatsapp: String(v?.whatsapp || atual.whatsapp || '').trim(),
      });
    });

    return Array.from(map.values()).filter((v) => v && (v.nome || v.whatsapp));
  }

  function readConsultorFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('consultor') || params.get('vendedor') || params.get('seller') || '';
    if (raw) return String(raw).trim();
    const c = params.get('c') || '';
    if (c && findConsultorById(c)) return String(c).trim();
    if (params.has('representante')) return 'representante';
    return '';
  }

  function getSellerSlug(vendedor) { return String(vendedor?.id || vendedor?.slug || slugify(vendedor?.nome || '')).trim(); }

  function findConsultorById(value) {
    const consultores = getConsultores();
    const raw = String(value || '').trim();
    if (!raw) return null;
    const norm = normalizeSearch(raw);
    return consultores.find((v) => {
      const id = String(v.id || '').trim();
      const slug = String(v.slug || '').trim();
      const nome = String(v.nome || '').trim();
      return id === raw || slug === raw || getSellerSlug(v) === raw || normalizeSearch(nome) === norm || slugify(nome) === raw;
    }) || null;
  }

  function getActiveSeller() {
    if (currentOffer?.seller) return findConsultorById(currentOffer.seller);
    if (currentConsultorId) return findConsultorById(currentConsultorId);
    return null;
  }

  function parsePreco(p) {
    if (p?.precoNum != null) return Number(p.precoNum);
    if (!p?.preco) return null;
    const s = String(p.preco).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

  function formatPrecoBR(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
  }

  function applyConsultorPolicy(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return value;

    const consultor = getActiveSeller();
    if (!consultor || currentOffer?.seller) return n;

    const tipo = String(consultor.ajusteTipo || consultor.adjustmentType || consultor.tipoAjuste || '').toLowerCase();
    const percentual = Number(consultor.ajustePercentual ?? consultor.percentual ?? consultor.adjustmentPercent ?? 0);

    if (tipo === 'politicadesconto' || tipo === 'politica-desconto' || tipo === 'policy-discount') {
      const descontoBase = Number(consultor.descontoBaseAtual ?? consultor.baseDiscount ?? 45);
      const descontoDestino = Number(consultor.descontoDestino ?? consultor.targetDiscount ?? consultor.politicaDesconto ?? 50);
      const divisor = 100 - descontoBase;
      const fator = divisor > 0 ? (100 - descontoDestino) / divisor : 1;
      return n * fator;
    }

    if (!Number.isFinite(percentual) || !percentual) return n;

    if (tipo === 'increase' || tipo === 'markup' || tipo === 'acrescimo') return n * (1 + percentual / 100);
    if (tipo === 'discount' || tipo === 'desconto') return n * (1 - percentual / 100);
    return n;
  }

  function getEffectivePriceNum(p) {
    const original = parsePreco(p);
    if (original == null) return null;

    if (!currentOffer?.discount || currentOffer?.isExpired) {
      return applyConsultorPolicy(original);
    }

    // Link especial: o percentual informado no painel é política adicional.
    // Ex.: catálogo base 45% + 3% = política final 48%.
    // Assim o cálculo bate com o ERP: preço cheio com IPI × (100 - política final).
    const basePolicy = getPolicyBaseDiscount(p);
    const extra = Number(currentOffer.discount || 0);
    const mode = String(currentOffer.mode || 'discount').toLowerCase();
    const finalPolicy = (mode === 'increase' || mode === 'markup' || mode === 'acrescimo')
      ? basePolicy - extra
      : basePolicy + extra;

    const policyPrice = priceByPolicy(p, finalPolicy);
    if (policyPrice != null) return policyPrice;

    // Fallback raro para produto antigo sem preço base salvo.
    const basePrice = applyConsultorPolicy(original);
    if (mode === 'increase' || mode === 'markup' || mode === 'acrescimo') {
      return basePrice * (1 + extra / 100);
    }
    return basePrice * (1 - extra / 100);
  }

  function getDisplayPrice(p) {
    const effective = getEffectivePriceNum(p);
    return effective == null ? '' : formatPrecoBR(effective);
  }

  function productForCart(p) {
    const original = parsePreco(p);
    const effective = getEffectivePriceNum(p);
    return {
      ...p,
      precoOriginal: (currentOffer?.discount && !currentOffer?.isExpired ? getNormalPolicyPriceNum(p) : original) != null ? formatPrecoBR(currentOffer?.discount && !currentOffer?.isExpired ? getNormalPolicyPriceNum(p) : original) : p.preco,
      precoOriginalNum: currentOffer?.discount && !currentOffer?.isExpired ? getNormalPolicyPriceNum(p) : original,
      preco: effective != null ? formatPrecoBR(effective) : p.preco,
      precoNum: effective,
      conditionKey: currentOffer?.token && !currentOffer?.isExpired ? `oferta:${currentOffer.token}` : (currentConsultorId ? `consultor:${currentConsultorId}` : ''),
      conditionLabel: currentOffer?.token && !currentOffer?.isExpired ? 'Condição especial' : (currentConsultorId ? 'Perfil de consultor' : ''),
    };
  }

  function offerDateText(value) {
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') : '';
  }


  function updateHeroConsultorUX2() {
    const nameEl = document.getElementById('heroConsultorName');
    const hintEl = document.getElementById('heroConsultorHint');
    const seller = getActiveSeller() || getDefaultSeller();
    if (!nameEl || !seller) return;
    nameEl.textContent = seller.nome || 'Z Automotiva';
    if (hintEl) {
      hintEl.textContent = currentConsultorId
        ? 'Você está montando o pedido diretamente com este consultor.'
        : 'Escolha as peças e envie seu orçamento pelo WhatsApp.';
    }
  }

  function appendContextToInternalLinks() {
    if (!currentOffer?.token && !currentConsultorId) return;
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      try {
        const url = new URL(href, window.location.href);
        if (currentOffer?.token) url.searchParams.set('o', currentOffer.token);
        const clientName = currentOffer?.clientName || readClientNameFromUrl();
        if (clientName) url.searchParams.set('cliente', clientName);
        if (currentConsultorId && !currentOffer?.token) url.searchParams.set('consultor', currentConsultorId);
        a.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
      } catch {}
    });
  }

  function productKey(p) { return `${p.catalogoId || catalogId}|${p.marca || ''}|${p.cod || ''}|${p.codFab || ''}|${p.nome || ''}`; }
  function isInCart(p) { return window.ZCart.load(catalogId).some((i) => productKey(i) === productKey(p)); }

  function populateMarcaFilter() {
    if (!els.marcaFilter) return;
    const marcas = [...new Set(products.map((p) => p.marca).filter(Boolean))].sort();
    els.marcaFilter.innerHTML = '<option value="">Todas as marcas</option>' + marcas.map((m) => `<option value="${escapeAttr(m)}">${escapeHtml(m)}</option>`).join('');
  }

  function populateCatalogoFilter() {
    if (!els.catalogoFilter) return;
    const catalogos = [...new Set(products.map((p) => p.catalogo).filter(Boolean))].sort();
    els.catalogoFilter.innerHTML = '<option value="">Todos os catálogos</option>' + catalogos.map((c) => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
  }

  function populateQuickFilters() {
    if (!els.quickFilters) return;
    const base = [...new Set(products.map((p) => p.catalogo || p.marca).filter(Boolean))].slice(0, 10);
    els.quickFilters.innerHTML = '<button type="button" class="quick-filter active" data-catalogo="">Todos</button>' + base.map((c) => `<button type="button" class="quick-filter" data-catalogo="${escapeAttr(c)}">${escapeHtml(c)}</button>`).join('');
  }

  function ensureSuggestionsBox() {
    if (!FEATURES.searchSuggestions || !els.busca || document.getElementById('searchSuggestions')) return;
    const box = document.createElement('div');
    box.id = 'searchSuggestions';
    box.className = 'search-suggestions';
    box.hidden = true;
    els.busca.insertAdjacentElement('afterend', box);
  }

  function renderSearchSuggestions() {
    if (!FEATURES.searchSuggestions || !els.busca) return;
    const box = document.getElementById('searchSuggestions');
    if (!box) return;
    const q = els.busca.value || '';
    if (normalizeSearch(q).length < 2) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    const suggestions = products
      .map((p) => ({ p, score: scoreSuggestion(p, q) }))
      .filter((x) => x.score > 0 && productMatchesQuery(x.p, q))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.p);

    if (!suggestions.length) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }

    box.hidden = false;
    box.innerHTML = suggestions.map((p) => {
      const code = window.ZCart.displayCode(p);
      const vehicle = p.marca || p.catalogo || '';
      const name = String(p.nome || '').slice(0, 70);
      return `
        <button type="button" class="search-suggestion search-suggestion-ux2" data-suggest-code="${escapeAttr(p.cod || p.codFab || '')}">
          <b>${escapeHtml(code || 'Código')}</b>
          <span>${escapeHtml(name)}${String(p.nome || '').length > 70 ? '...' : ''}</span>
          ${vehicle ? `<small>${escapeHtml(cleanCatalogLabel(vehicle))}</small>` : ''}
        </button>`;
    }).join('');
  }

  function applyFilters() {
    const q = normalizeSearch(els.busca?.value || '');
    const marca = els.marcaFilter?.value || '';
    const catalogo = els.catalogoFilter?.value || '';
    const min = els.precoMin?.value ? parseFloat(els.precoMin.value) : null;
    const max = els.precoMax?.value ? parseFloat(els.precoMax.value) : null;
    const sort = els.sort?.value || '';

    filtered = products.filter((p) => {
      if (q && !productMatchesQuery(p, q)) return false;
      if (marca && p.marca !== marca) return false;
      if (catalogo && p.catalogo !== catalogo) return false;
      const price = getEffectivePriceNum(p);
      if (min != null && price != null && price < min) return false;
      if (max != null && price != null && price > max) return false;
      return true;
    });

    filtered.sort((a, b) => {
      const pa = getEffectivePriceNum(a) ?? 0;
      const pb = getEffectivePriceNum(b) ?? 0;
      const na = (a.nome || '').toLowerCase();
      const nb = (b.nome || '').toLowerCase();
      switch (sort) {
        case 'price-asc': return pa - pb;
        case 'price-desc': return pb - pa;
        case 'name-desc': return nb.localeCompare(na);
        case 'name-asc':
        default: return na.localeCompare(nb);
      }
    });
    currentPage = 1;
    render();
  }

  function renderCard(p) {
    const key = productKey(p);
    const preco = getDisplayPrice(p);
    const original = currentOffer?.discount && !currentOffer?.isExpired ? getNormalPolicyPriceNum(p) : parsePreco(p);
    const effective = getEffectivePriceNum(p);
    const hasOfferPrice = currentOffer?.discount && !currentOffer?.isExpired && original != null && effective != null && Math.abs(original - effective) > 0.001;
    const img = p.imgSrc || '';
    const inCart = isInCart(p);
    const code = window.ZCart.displayCode(p);
    const catalogLabel = cleanCatalogLabel(p.catalogo) || p.marca || 'Produto';
    return `
      <article class="prod-card prod-card-v3${inCart ? ' in-cart' : ''}" data-product-key="${escapeAttr(key)}" id="produto-${escapeAttr(slugify(key))}">
        <div class="prod-img" data-action-card="details" role="button" tabindex="0" aria-label="Ver detalhes">
          ${p.catalogo ? `<span class="prod-badge">${escapeHtml(catalogLabel)}</span>` : ''}
          <button type="button" class="prod-fav" data-action-card="favorite" aria-label="Favoritar">${isFavorite(p) ? '♥' : '♡'}</button>
          ${img ? `<img src="${escapeAttr(img)}" alt="${escapeAttr(p.nome || 'Produto')}" loading="lazy" decoding="async">` : '<span class="no-img">Sem imagem</span>'}
        </div>
        <div class="prod-body">
          <div class="prod-desc">${escapeHtml(p.nome)}</div>
          <div class="prod-code-pill">${escapeHtml(code || '-')}</div>
          <div class="prod-preco${preco ? '' : ' empty'}">${preco || 'Consulte'}</div>
          ${hasOfferPrice ? `<div class="preco-original">De ${escapeHtml(formatPrecoBR(original))}</div><div class="offer-badge">Condição especial</div>` : '<div class="card-price-row"><div class="ipi-badge">✓ Valor com IPI incluso</div><button type="button" class="btn-details-inline" data-action-card="details">+ Detalhes</button></div>'}
        </div>
        <div class="prod-footer prod-footer-v3">
          <div class="qty-control compact" role="group" aria-label="Quantidade">
            <button type="button" class="qty-btn" data-action="minus" aria-label="Diminuir">−</button>
            <span class="qty-num">1</span>
            <button type="button" class="qty-btn" data-action="plus" aria-label="Aumentar">+</button>
          </div>
          <button type="button" class="btn-add">+ Adicionar</button>
        </div>
      </article>`;
  }

  function render() {
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);

    if (els.totalBadge) els.totalBadge.textContent = `${total} de ${products.length} produto${products.length !== 1 ? 's' : ''}`;
    if (!els.grid) return;
    if (!total) {
      els.grid.innerHTML = '<div class="empty-results"><strong>Nenhum produto encontrado.</strong><p>Tente buscar por código, código de fabricação, marca ou descrição.</p><button type="button" id="emptyWhatsBtn" class="btn-whats">Não encontrei minha peça</button></div>';
      document.getElementById('emptyWhatsBtn')?.addEventListener('click', sendNotFoundMessage);
    } else {
      els.grid.innerHTML = slice.map(renderCard).join('');
      els.grid.querySelectorAll('.prod-img img').forEach((img) => {
        const onLoad = () => img.classList.add('loaded');
        if (img.complete) onLoad();
        else {
          img.addEventListener('load', onLoad, { once: true });
          img.addEventListener('error', () => { img.style.display = 'none'; img.parentElement?.classList.add('sem-img'); }, { once: true });
        }
      });
    }
    renderPagination(pages);
    renderCart();
  }

  function renderPagination(pages) {
    if (!els.pagination) return;
    if (pages <= 1) { els.pagination.innerHTML = ''; return; }
    const btns = [`<button type="button" data-page="prev" ${currentPage <= 1 ? 'disabled' : ''}>‹</button>`];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(pages, start + 4);
    start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) btns.push(`<button type="button" data-page="${i}" class="${i === currentPage ? 'active' : ''}">${i}</button>`);
    btns.push(`<button type="button" data-page="next" ${currentPage >= pages ? 'disabled' : ''}>›</button>`);
    els.pagination.innerHTML = btns.join('');
  }

  function renderCart() {
    const items = window.ZCart.load(catalogId);
    const pieces = window.ZCart.totalPieces(items);
    const subtotal = window.ZCart.subtotal ? window.ZCart.subtotal(items) : 0;
    if (els.cartTitle) els.cartTitle.innerHTML = `Carrinho <span>(${pieces} ${pieces === 1 ? 'item' : 'itens'})</span>`;
    if (els.cartTotal) els.cartTotal.textContent = pieces ? items.map((i) => `${i.qty}x ${window.ZCart.displayCode(i)}`).join(' · ') : '';
    if (els.cartSubtotal) els.cartSubtotal.innerHTML = subtotal > 0 ? `<span>Total</span><strong>${formatPrecoBR(subtotal)}</strong><small>Valor com IPI incluso</small>` : '';
    if (els.mobileCartBtn) {
      const activeSeller = getActiveSeller() || getDefaultSeller();
      const sellerName = activeSeller?.nome || 'consultor';
      els.mobileCartBtn.classList.toggle('has-items', pieces > 0);
      els.mobileCartBtn.disabled = !pieces;
      els.mobileCartBtn.setAttribute('aria-label', pieces ? `Ver pedido com ${sellerName}` : 'Carrinho vazio');
      els.mobileCartBtn.innerHTML = pieces
        ? `<span class="mobile-cart-icon">🛒<b>${pieces}</b></span><span class="mobile-cart-price">${subtotal > 0 ? escapeHtml(formatPrecoBR(subtotal)) : 'Pedido'}</span>`
        : '<span class="mobile-cart-icon">🛒</span>';
    }
    if (!els.cartList) return;
    if (!items.length) {
      els.cartList.innerHTML = '';
      if (els.cartEmpty) els.cartEmpty.style.display = 'flex';
      els.btnWhats.forEach((btn) => { btn.disabled = true; });
      return;
    }
    if (els.cartEmpty) els.cartEmpty.style.display = 'none';
    els.btnWhats.forEach((btn) => { if (btn.style.display !== 'none') btn.disabled = false; });
    els.cartList.innerHTML = items.map((item, idx) => `
      <div class="cart-item cart-item-v3" data-idx="${idx}">
        <div class="cart-item-thumb">${item.imgSrc ? `<img src="${escapeAttr(item.imgSrc)}" alt="">` : ''}</div>
        <div class="cart-item-main">
          <button type="button" class="qty-btn cart-remove" data-cart-action="remove" data-idx="${idx}" aria-label="Remover">×</button>
          ${item.nome ? `<div class="cart-item-name">${escapeHtml(item.nome)}</div>` : ''}
          <span class="cart-item-code">${escapeHtml(window.ZCart.displayCode(item))}</span>
          ${item.preco ? `<div class="cart-item-price">${escapeHtml(item.preco)}</div>` : ''}
          <div class="qty-control compact">
            <button type="button" class="qty-btn" data-cart-action="minus" data-idx="${idx}">−</button>
            <span class="qty-num">${item.qty}</span>
            <button type="button" class="qty-btn" data-cart-action="plus" data-idx="${idx}">+</button>
          </div>
        </div>
      </div>`).join('');
  }

  function configureOfferBanner() {
    if (!els.offerBanner) return;

    // Segurança extra: se a página abriu com link curto (?o=...) mas por algum motivo
    // currentOffer ainda não foi preenchido no init, tenta ler novamente aqui.
    if (!currentOffer) currentOffer = readOfferFromUrl();

    const params = new URLSearchParams(window.location.search);
    const rawShortOffer = params.get('o') || '';
    const hasRawOffer = Boolean(rawShortOffer || params.get('oferta'));

    // Fallback comercial: mesmo que algum formato de token não seja reconhecido,
    // ainda mostra o banner para o cliente perceber a condição especial.
    if (!currentOffer?.token && hasRawOffer) {
      currentOffer = {
        token: rawShortOffer || params.get('oferta'),
        seller: rawShortOffer ? String(rawShortOffer).split('-').filter(Boolean).slice(0, -3).join('-') : '',
        discount: 0,
        mode: 'discount',
        expiresAt: rawShortOffer ? compactDateToIso(String(rawShortOffer).split('-').filter(Boolean).pop()) : '',
        isExpired: false,
        clientName: readClientNameFromUrl(),
        isFallback: true,
      };
    }

    const activeSeller = getActiveSeller();
    const sellerName = activeSeller?.nome || 'Consultor Z Automotiva';
    const exp = offerDateText(currentOffer?.expiresAt);
    const clientName = currentOffer?.clientName || readClientNameFromUrl();

    els.offerBanner.hidden = false;

    if (currentOffer?.token && currentOffer.isExpired) {
      els.offerBanner.className = 'offer-top-banner special-access-banner expired';
      els.offerBanner.innerHTML = `
        <div class="special-access-icon" aria-hidden="true">⏰</div>
        <div class="special-access-content">
          <span class="special-access-kicker">${escapeHtml(TEXTOS.offerExpiredKicker)}</span>
          <strong>${escapeHtml(TEXTOS.offerExpiredTitle)}</strong>
          <p>${escapeHtml(TEXTOS.offerExpiredText)}</p>
        </div>
        <div class="special-access-consultant">
          <span>${escapeHtml(TEXTOS.offerConsultantLabel)}</span>
          <strong>${escapeHtml(sellerName)}</strong>
          <small>Solicite uma nova condição</small>
        </div>`;
      return;
    }

    if (currentOffer?.token) {
      const personalizedTitle = clientName
        ? `Condição exclusiva para ${clientName}`
        : TEXTOS.offerActiveTitle;
      const personalizedText = clientName
        ? 'Este catálogo foi preparado com valores comerciais diferenciados e atendimento dedicado.'
        : TEXTOS.offerActiveText;

      els.offerBanner.className = 'offer-top-banner special-access-banner premium-client-banner';
      els.offerBanner.innerHTML = `
        <div class="special-access-icon" aria-hidden="true">🔥</div>
        <div class="special-access-content">
          <span class="special-access-kicker">${escapeHtml(TEXTOS.offerActiveKicker)}</span>
          <strong>${escapeHtml(personalizedTitle)}</strong>
          <p>${escapeHtml(personalizedText)}</p>
          <div class="special-access-benefits" aria-label="Benefícios da condição especial">
            <span>✓ ${escapeHtml(TEXTOS.offerBenefit1)}</span>
            <span>✓ ${escapeHtml(TEXTOS.offerBenefit2)}</span>
            <span>✓ ${escapeHtml(TEXTOS.offerBenefit3)}</span>
          </div>
        </div>
        <div class="special-access-consultant">
          <span>${escapeHtml(TEXTOS.offerConsultantLabel)}</span>
          <strong>${escapeHtml(sellerName)}</strong>
          ${exp ? `<small>${escapeHtml(TEXTOS.offerValidUntilPrefix)} ${escapeHtml(exp)}</small>` : `<small>${escapeHtml(TEXTOS.offerLimitedText)}</small>`}
        </div>`;
      return;
    }

    if (currentConsultorId) {
      const consultorTitle = TEXTOS.consultorProfileTitle
        ? String(TEXTOS.consultorProfileTitle).replace(/\{consultor\}/g, sellerName)
        : `Consultor responsável: ${sellerName}`;
      els.offerBanner.className = 'offer-top-banner special-access-banner consultant-profile-banner compact-partner-banner';
      els.offerBanner.innerHTML = `
        <div class="special-access-icon" aria-hidden="true">🤝</div>
        <div class="special-access-content">
          <span class="special-access-kicker">${escapeHtml(TEXTOS.consultorProfileKicker || 'Condição comercial personalizada')}</span>
          <strong>${escapeHtml(consultorTitle)}</strong>
          <p>${escapeHtml(TEXTOS.consultorProfileText || 'Este catálogo possui atendimento dedicado e condições comerciais personalizadas para facilitar sua cotação e fechamento de pedidos.')}</p>
          <div class="special-access-benefits" aria-label="Benefícios do atendimento personalizado">
            <span>✓ Pedido rápido pelo WhatsApp</span>
            <span>✓ Atendimento direto com consultor</span>
            <span>✓ Suporte na escolha das peças</span>
            <span>✓ Agilidade no orçamento</span>
          </div>
        </div>
        <div class="special-access-consultant">
          <span>${escapeHtml(TEXTOS.offerConsultantLabel)}</span>
          <strong>${escapeHtml(sellerName)}</strong>
          <small>${escapeHtml(TEXTOS.consultorProfileSmall || 'Atendimento especializado Z Automotiva')}</small>
        </div>`;
      return;
    }

    els.offerBanner.className = 'offer-top-banner special-access-banner partnership-banner';
    els.offerBanner.innerHTML = `
      <div class="special-access-icon" aria-hidden="true">🤝</div>
      <div class="special-access-content">
        <span class="special-access-kicker">${escapeHtml(TEXTOS.partnershipKicker)}</span>
        <strong>${escapeHtml(TEXTOS.partnershipTitle)}</strong>
        <p>${escapeHtml(TEXTOS.partnershipText)}</p>
        <div class="special-access-benefits" aria-label="Benefícios para parceiros">
          <span>✓ ${escapeHtml(TEXTOS.partnershipBenefit1)}</span>
          <span>✓ ${escapeHtml(TEXTOS.partnershipBenefit2)}</span>
          <span>✓ ${escapeHtml(TEXTOS.partnershipBenefit3)}</span>
        </div>
      </div>
      <div class="special-access-consultant">
        <span>${escapeHtml(TEXTOS.partnershipBadge)}</span>
        <strong>Z AUTOMOTIVA</strong>
        <small>Consulte peças e envie seu orçamento</small>
      </div>`;
  }

  function configureWhatsButtons() {
    const vendedores = getConsultores();
    const activeSeller = getActiveSeller();

    if (activeSeller) {
      els.btnWhats.forEach((btn, idx) => {
        if (idx === 0) {
          btn.style.display = '';
          btn.dataset.whatsIndex = '0';
          btn.textContent = `Finalizar pedido com ${activeSeller.nome || 'Consultor'}`;
        } else {
          btn.style.display = 'none';
        }
      });
      return;
    }

    els.btnWhats.forEach((btn) => {
      const idx = Number(btn.dataset.whatsIndex || 0);
      const vendedor = vendedores[idx] || null;
      if (!vendedor) { btn.style.display = 'none'; return; }
      btn.style.display = '';
      btn.textContent = `Finalizar com ${vendedor.nome || `Consultor ${idx + 1}`}`;
    });
  }

  function closeProductModal() {
    if (!els.productModal) return;
    els.productModal.classList.remove('show');
    els.productModal.setAttribute('aria-hidden', 'true');
    if (els.productModalBody) els.productModalBody.innerHTML = '';
  }

  function openProductModal(product) {
    rememberProduct(product, 'view');
    if (!els.productModal || !els.productModalBody) return;
    const preco = getDisplayPrice(product) || 'Consulte';
    const original = currentOffer?.discount && !currentOffer?.isExpired ? getNormalPolicyPriceNum(product) : parsePreco(product);
    const effective = getEffectivePriceNum(product);
    const hasOfferPrice = currentOffer?.discount && !currentOffer?.isExpired && original != null && effective != null && Math.abs(original - effective) > 0.001;
    const img = product.imgSrc || '';
    els.productModalBody.innerHTML = `
      <div class="product-detail-layout product-detail-v3" data-product-key="${escapeAttr(productKey(product))}">
        <div class="product-detail-image">${img ? `<img src="${escapeAttr(img)}" alt="${escapeAttr(product.nome || 'Produto')}">` : '<span class="no-img">Sem imagem</span>'}</div>
        <div class="product-detail-info">
          <div class="detail-topline">
            <span class="prod-badge static">${escapeHtml(cleanCatalogLabel(product.catalogo) || product.marca || 'Produto')}</span>
            <button class="btn-linkish compact" id="modalFavorite">${isFavorite(product) ? "♥ Salvo" : "♡ Favoritar"}</button>
          </div>
          <h2>${escapeHtml(product.nome || 'Produto')}</h2>
          <div class="detail-buy-row detail-buy-v3">
            <div class="detail-price-box">
              <div class="prod-preco">${escapeHtml(preco)}</div>
              ${hasOfferPrice ? `<div class="preco-original">De ${escapeHtml(formatPrecoBR(original))}</div><div class="offer-badge">Condição especial</div>` : '<div class="ipi-badge ipi-badge-strong">✓ Valor com IPI incluso</div>'}
            </div>
            <div class="prod-footer detail-footer">
              <div class="qty-control"><button type="button" class="qty-btn" data-modal-qty="minus">−</button><span class="qty-num" id="modalQty">1</span><button type="button" class="qty-btn" data-modal-qty="plus">+</button></div>
              <button type="button" class="btn-add" id="modalAdd">Adicionar ao pedido</button>
            </div>
          </div>
          <div class="detail-meta-line detail-meta-v3">
            ${product.cod ? `<span><b>Código</b> ${escapeHtml(product.cod)}</span>` : ''}
            ${product.codFab ? `<span><b>Fab.</b> ${escapeHtml(product.codFab)}</span>` : ''}
            ${product.marca ? `<span><b>Veículo</b> ${escapeHtml(product.marca)}</span>` : ''}
            ${product.catalogo ? `<span><b>Catálogo</b> ${escapeHtml(cleanCatalogLabel(product.catalogo))}</span>` : ''}
          </div>
          <div class="detail-actions"><button class="btn-linkish" id="modalCopy">📋 Copiar código</button><button class="btn-linkish" id="modalShare">🔗 Compartilhar</button></div>
          ${renderRelatedProducts(product)}
        </div>
      </div>`;
    els.productModal.classList.add('show');
    els.productModal.setAttribute('aria-hidden', 'false');
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); showToast('Copiado', true); }
    catch { showToast('Não foi possível copiar'); }
  }

  function productShareUrl(product) {
    const url = new URL(window.location.href);
    url.searchParams.set('produto', slugify(productKey(product)));
    if (currentOffer?.token) url.searchParams.set('o', currentOffer.token);
    const clientName = currentOffer?.clientName || readClientNameFromUrl();
    if (clientName) url.searchParams.set('cliente', clientName);
    return url.href;
  }

  async function shareProduct(product) {
    const url = productShareUrl(product);
    const text = `${product.nome || 'Produto'} - ${window.ZCart.displayCode(product)}\n${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: product.nome || 'Produto', text, url }); return; } catch {}
    }
    copyText(url);
  }

  function findProductFromCard(card) {
    const key = card?.dataset?.productKey;
    return products.find((p) => productKey(p) === key);
  }

  function addProductToCart(product, qty) {
    const item = productForCart(product);
    window.ZCart.add(catalogId, item, qty);
    trackEvent('add_to_cart', { product, qty });
    rememberProduct(product, 'cart');
    renderTopProducts();
    renderCart();
    render();
    showToast(`${window.ZCart.displayCode(item)} adicionado`, true);
  }

  function quickOrder() {
    const raw = String(els.quickOrderInput?.value || '').trim();
    if (!raw) { showToast('Cole os códigos e quantidades'); return; }
    const lines = raw.split(/\n|,/).map((l) => l.trim()).filter(Boolean);
    let added = 0;
    const notFound = [];
    lines.forEach((line) => {
      const parts = line.split(/\s+/);
      const code = normalizeSearch(parts[0] || '');
      const qty = Math.max(1, parseInt(parts[1] || '1', 10) || 1);
      const product = products.find((p) => normalizeSearch(p.cod) === code || normalizeSearch(p.codFab) === code);
      if (product) { window.ZCart.add(catalogId, productForCart(product), qty); trackEvent('add_to_cart', { product, qty }); added += qty; }
      else notFound.push(parts[0]);
    });
    renderCart();
    render();
    if (added) showToast(`${added} peça(s) adicionada(s)`, true);
    if (notFound.length) showToast(`Não encontrados: ${notFound.join(', ')}`);
  }

  function getDefaultSeller() {
    return getActiveSeller() || (Array.isArray(cfg.vendedores) ? cfg.vendedores[0] : null) || {};
  }

  function sendCartToWhatsApp(vendedorOverride) {
    const items = window.ZCart.load(catalogId);
    if (!items.length) {
      showToast('Adicione pelo menos uma peça ao pedido');
      return;
    }

    const vendedor = vendedorOverride || getActiveSeller() || getDefaultSeller();
    const numero = String(vendedor.whatsapp || '').replace(/\D/g, '');
    if (!numero) { showToast('Número do WhatsApp não configurado'); return; }

    const msg = window.ZCart.buildWhatsAppMessage(items, {
      vendedor,
      offer: currentOffer || {},
      note: els.cartNote?.value || ''
    });

    items.forEach((item) => trackEvent('whatsapp', { product: item, qty: item.qty || 1 }));
    renderTopProducts();
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function sendNotFoundMessage() {
    const vendedor = getDefaultSeller();
    const numero = String(vendedor.whatsapp || '').replace(/\D/g, '');
    if (!numero) { showToast('Número do WhatsApp não configurado'); return; }
    const busca = els.busca?.value ? `\nBusca digitada: ${els.busca.value}` : '';
    const msg = `Olá ${vendedor.nome || ''}, não encontrei a peça que procuro no catálogo. Pode me ajudar?${busca}`;
    trackEvent('not_found', { query: els.busca?.value || '' });
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function bindEvents() {
    const debouncedFilter = debounce(() => {
      if (els.busca?.value) trackEvent('search', { query: els.busca.value });
      applyFilters();
      renderSearchSuggestions();
    }, 220);
    els.busca?.addEventListener('input', () => {
      renderSearchSuggestions();
      debouncedFilter();
    });
    els.marcaFilter?.addEventListener('change', applyFilters);
    els.catalogoFilter?.addEventListener('change', applyFilters);
    els.precoMin?.addEventListener('input', debouncedFilter);
    els.precoMax?.addEventListener('input', debouncedFilter);
    els.sort?.addEventListener('change', applyFilters);
    els.clearFilters?.addEventListener('click', () => {
      if (els.busca) els.busca.value = '';
      if (els.marcaFilter) els.marcaFilter.value = '';
      if (els.catalogoFilter) els.catalogoFilter.value = '';
      if (els.precoMin) els.precoMin.value = '';
      if (els.precoMax) els.precoMax.value = '';
      els.quickFilters?.querySelectorAll('.quick-filter').forEach((b, i) => b.classList.toggle('active', i === 0));
      applyFilters();
    });
    document.getElementById('searchSuggestions')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-suggest-code]');
      if (!btn) return;
      if (els.busca) els.busca.value = btn.dataset.suggestCode || '';
      document.getElementById('searchSuggestions').hidden = true;
      trackEvent('suggestion_click', { query: els.busca?.value || '' });
      applyFilters();
    });
    document.addEventListener('click', (e) => {
      const box = document.getElementById('searchSuggestions');
      if (!box || box.hidden) return;
      if (e.target === els.busca || box.contains(e.target)) return;
      box.hidden = true;
    });

    els.quickFilters?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-catalogo]');
      if (!btn) return;
      els.quickFilters.querySelectorAll('.quick-filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (els.catalogoFilter) els.catalogoFilter.value = btn.dataset.catalogo || '';
      applyFilters();
    });
    els.topProducts?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-top-code]');
      if (!btn) return;
      if (els.busca) els.busca.value = btn.dataset.topCode || '';
      applyFilters();
      document.querySelector('.search-hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.addEventListener('click', (e) => {
      const trendBtn = e.target.closest('#trendingProducts [data-top-code]');
      if (trendBtn) {
        if (els.busca) els.busca.value = trendBtn.dataset.topCode || '';
        applyFilters();
        document.querySelector('.search-hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const personalBtn = e.target.closest('[data-personal-key]');
      if (!personalBtn) return;
      const item = [...Object.values(loadFavorites()), ...loadHistory()].find((x) => x.key === personalBtn.dataset.personalKey);
      const product = findProductByCompact(item);
      if (product) openProductModal(product);
    });
    els.quickOrderBtn?.addEventListener('click', quickOrder);
    els.notFoundBtn?.addEventListener('click', sendNotFoundMessage);
    els.mobileCartBtn?.addEventListener('click', () => sendCartToWhatsApp());

    els.grid?.addEventListener('click', (e) => {
      const card = e.target.closest('.prod-card');
      if (!card) return;
      const product = findProductFromCard(card);
      if (!product) return;
      if (e.target.closest('.img-zoom-btn')) { openProductModal(product); return; }
      const actionCard = e.target.closest('[data-action-card]')?.dataset.actionCard;
      if (actionCard === 'details') { openProductModal(product); return; }
      if (actionCard === 'copy-code') { copyText(window.ZCart.displayCode(product)); return; }
      if (actionCard === 'share') { shareProduct(product); return; }
      if (actionCard === 'favorite') { toggleFavorite(product); return; }
      if (e.target.closest('.qty-btn')) {
        const action = e.target.dataset.action;
        const numEl = card.querySelector('.qty-num');
        let n = parseInt(numEl.textContent, 10) || 1;
        if (action === 'plus') n = Math.min(99, n + 1);
        if (action === 'minus') n = Math.max(1, n - 1);
        numEl.textContent = String(n);
        return;
      }
      if (e.target.closest('.btn-add')) {
        const qty = parseInt(card.querySelector('.qty-num')?.textContent || '1', 10) || 1;
        addProductToCart(product, qty);
      }
    });

    els.productModal?.addEventListener('click', (e) => {
      if (e.target === els.productModal) closeProductModal();
      const wrapper = els.productModalBody?.querySelector('[data-product-key]');
      const key = wrapper?.dataset.productKey;
      const product = products.find((p) => productKey(p) === key);
      if (!product) return;
      const qtyEl = document.getElementById('modalQty');
      if (e.target.closest('[data-modal-qty]')) {
        let n = parseInt(qtyEl?.textContent || '1', 10) || 1;
        if (e.target.dataset.modalQty === 'plus') n = Math.min(99, n + 1);
        if (e.target.dataset.modalQty === 'minus') n = Math.max(1, n - 1);
        if (qtyEl) qtyEl.textContent = String(n);
      }
      if (e.target.closest('#modalAdd')) addProductToCart(product, parseInt(qtyEl?.textContent || '1', 10) || 1);
      if (e.target.closest('#modalCopy')) copyText(window.ZCart.displayCode(product));
      if (e.target.closest('#modalShare')) shareProduct(product);
      if (e.target.closest('#modalFavorite')) { toggleFavorite(product); openProductModal(product); }
      const addRelated = e.target.closest('[data-related-add]');
      if (addRelated) {
        const related = products.find((p) => productKey(p) === addRelated.dataset.relatedAdd);
        if (related) addProductToCart(related, 1);
        return;
      }
      const addAll = e.target.closest('#modalAddRelatedAll');
      if (addAll) {
        const keys = Array.from(els.productModalBody.querySelectorAll('[data-related-key]')).map((el) => el.dataset.relatedKey);
        keys.slice(0, 4).forEach((key) => {
          const related = products.find((p) => productKey(p) === key);
          if (related) addProductToCart(related, 1);
        });
        return;
      }
      const relatedBtn = e.target.closest('[data-related-open], [data-related-key]');
      if (relatedBtn) {
        const key = relatedBtn.dataset.relatedOpen || relatedBtn.dataset.relatedKey;
        const related = products.find((p) => productKey(p) === key);
        if (related) openProductModal(related);
      }
    });
    els.productModalClose?.addEventListener('click', closeProductModal);

    els.cartList?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cart-action]');
      if (!btn) return;
      const idx = parseInt(btn.dataset.idx, 10);
      const items = window.ZCart.load(catalogId);
      const item = items[idx];
      if (!item) return;
      if (btn.dataset.cartAction === 'remove') window.ZCart.remove(catalogId, idx);
      else if (btn.dataset.cartAction === 'plus') window.ZCart.setQty(catalogId, idx, item.qty + 1);
      else if (btn.dataset.cartAction === 'minus') window.ZCart.setQty(catalogId, idx, item.qty - 1);
      renderCart();
      render();
    });

    els.btnClear?.addEventListener('click', () => { window.ZCart.clear(catalogId); renderCart(); render(); showToast('Carrinho limpo'); });
    els.btnWhats.forEach((btn) => {
      btn.addEventListener('click', () => {
        const items = window.ZCart.load(catalogId);
        if (!items.length) return;
        const idx = Number(btn.dataset.whatsIndex || 0);
        const vendedores = getConsultores();
        const activeSeller = getActiveSeller();
        const vendedor = activeSeller || vendedores[idx] || {};
        const numero = String(vendedor.whatsapp || '').replace(/\D/g, '');
        if (!numero) { showToast('Número do WhatsApp não configurado'); return; }
        sendCartToWhatsApp(vendedor);
      });
    });

    function closeImageModal() {
      if (!els.imageModal) return;
      els.imageModal.classList.remove('show');
      els.imageModal.setAttribute('aria-hidden', 'true');
      if (els.imageModalImg) els.imageModalImg.src = '';
    }
    els.imageModal?.addEventListener('click', (e) => { if (e.target === els.imageModal) closeImageModal(); });
    els.imageModalClose?.addEventListener('click', closeImageModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeImageModal(); closeProductModal(); } });

    els.pagination?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      const pages = Math.ceil(filtered.length / PAGE_SIZE);
      const p = btn.dataset.page;
      if (p === 'prev') currentPage = Math.max(1, currentPage - 1);
      else if (p === 'next') currentPage = Math.min(pages, currentPage + 1);
      else currentPage = parseInt(p, 10);
      render();
      document.querySelector('.produtos-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function highlightProductFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const target = params.get('produto') || '';
    if (!target) return;
    const index = filtered.findIndex((p) => slugify(productKey(p)) === target);
    if (index < 0) return;
    currentPage = Math.floor(index / PAGE_SIZE) + 1;
    render();
    setTimeout(() => {
      const el = document.getElementById(`produto-${target}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.classList.add('highlight');
    }, 150);
  }

  function init() {
    currentOffer = readOfferFromUrl();
    currentConsultorId = readConsultorFromUrl();
    trackEvent('view');
    restoreCartFromUrl();
    applyTextConfig();
    appendContextToInternalLinks();
    const dataEl = document.getElementById('catalog-data');
    if (dataEl) {
      try {
        products = JSON.parse(dataEl.textContent).map((p) => {
          const search = buildSearchText(p);
          return { ...p, _search: search, _searchCompact: normalizeCompact(search) };
        });
      } catch { products = []; }
    }
    filtered = [...products];
    configureOfferBanner();
    updateHeroConsultorUX2();
    configureWhatsButtons();
    populateMarcaFilter();
    populateCatalogoFilter();
    populateQuickFilters();
    ensureSuggestionsBox();
    renderTopProducts();
    refreshRemoteTopProducts();
    refreshRemoteTrends();
    renderAnalyticsPanelIfRequested();
    renderPersonalSections();
    ensureCartShareButton();
    bindEvents();
    applyFilters();
    setTimeout(highlightProductFromUrl, 200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();



/* V3.1 UI enhancer: clean header, separate search row and real consultant status */
(function(){
  function ready(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function norm(v){ return String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function slug(v){ return norm(v).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
  function sellersList(){
    var cfg = window.CATALOG_CONFIG || {};
    var list = [];
    if (Array.isArray(cfg.vendedores)) list = list.concat(cfg.vendedores);
    var ext = window.Z_CONSULTORES;
    if (Array.isArray(ext)) list = list.concat(ext);
    else if (ext && typeof ext === 'object') {
      Object.keys(ext).forEach(function(k){ list.push(Object.assign({slug:k}, ext[k] || {})); });
    }
    var map = {};
    list.forEach(function(s){
      if(!s) return;
      var key = s.id || s.slug || slug(s.nome);
      if(!key) return;
      map[key] = Object.assign({}, map[key] || {}, s, { id: s.id || key, slug: s.slug || key });
    });
    return Object.keys(map).map(function(k){ return map[k]; });
  }
  function currentSeller(){
    var params = new URLSearchParams(location.search);
    var raw = params.get('consultor') || params.get('vendedor') || params.get('seller') || params.get('c') || '';
    var list = sellersList();
    if(raw){
      var n = norm(raw), sl = slug(raw);
      var found = list.find(function(s){
        return norm(s.id) === n || norm(s.slug) === n || slug(s.nome) === sl || norm(s.nome) === n;
      });
      if(found) return found;
    }
    return list[0] || {nome:'Z Automotiva'};
  }
  function isBusinessOnline(){
    var d = new Date();
    var day = d.getDay();
    var h = d.getHours();
    return day >= 1 && day <= 5 && h >= 8 && h < 18;
  }
  function renderConsultor(){
    var right = document.querySelector('.topbar-right');
    if(!right) return;
    var seller = currentSeller();
    var online = isBusinessOnline();
    var initial = String(seller.nome || 'Z').charAt(0).toUpperCase();
    right.innerHTML =
      '<div class="v3-consultor v3-consultor-fixed '+(online?'is-online':'is-offline')+'">'+
        '<div class="v3-avatar">'+initial+'</div>'+
        '<div class="v3-consultor-text">'+
          '<small>Atendimento pelo consultor</small>'+
          '<strong>'+String(seller.nome || 'Z Automotiva')+'</strong>'+
          '<span>'+(online?'● Online no WhatsApp':'● Offline agora')+'</span>'+
        '</div>'+
        '<a class="v3-whats-icon" aria-label="WhatsApp" href="'+(seller.whatsapp ? 'https://wa.me/'+String(seller.whatsapp).replace(/\D/g,'') : '#')+'" target="_blank" rel="noopener">☘</a>'+
      '</div>';
  }
  ready(function(){
    document.body.classList.add('v3-ui','v3-ux-clean');
    var topbar = document.querySelector('.topbar');
    var input = document.getElementById('buscaInput');

    if(topbar && input && !document.querySelector('.v3-search-section')){
      var section = document.createElement('section');
      section.className = 'v3-search-section';
      var holder = document.createElement('div');
      holder.className = 'v3-search-holder';
      var title = document.createElement('div');
      title.className = 'v3-search-title';
      title.textContent = 'Encontre sua peça';
      var wrap = document.createElement('div');
      wrap.className = 'v3-top-search';
      wrap.innerHTML = '<span class="v3-search-icon">⌕</span>';
      input.parentNode && input.parentNode.removeChild(input);
      wrap.appendChild(input);
      var examples = document.createElement('div');
      examples.className = 'v3-search-examples';
      examples.textContent = 'Ex: retrovisor gol g5  •  parachoque ka  •  355751';
      holder.appendChild(title);
      holder.appendChild(wrap);
      holder.appendChild(examples);
      section.appendChild(holder);
      topbar.insertAdjacentElement('afterend', section);
      setTimeout(function(){ try{ input.focus(); }catch(e){} }, 250);
    }

    renderConsultor();
    setInterval(renderConsultor, 60000);
  });
})();

