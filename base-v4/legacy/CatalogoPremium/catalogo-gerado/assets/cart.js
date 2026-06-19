/**
 * Shopping cart with global localStorage persistence (browser).
 * The cart is shared across all catalog pages so items do not disappear when navigating.
 */
(function (global) {
  const STORAGE_KEY = 'zautomotiva_cart_global_v3';

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function save(_catalogId, items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }

  function lineKey(item) {
    return [item.catalogoId || '', item.marca || '', item.cod || '', item.codFab || '', item.nome || '', item.conditionKey || ''].join('|');
  }

  function add(_catalogId, product, qty = 1) {
    const items = load();
    const key = lineKey(product);
    const existing = items.find((i) => lineKey(i) === key);
    if (existing) {
      existing.qty += Math.max(1, qty);
    } else {
      items.unshift({
        cod: product.cod,
        codFab: product.codFab,
        nome: product.nome,
        desc: product.desc,
        marca: product.marca,
        catalogo: product.catalogo,
        catalogoId: product.catalogoId,
        imgSrc: product.imgSrc,
        preco: product.preco,
        precoNum: product.precoNum,
        precoOriginal: product.precoOriginal,
        precoOriginalNum: product.precoOriginalNum,
        conditionKey: product.conditionKey || '',
        conditionLabel: product.conditionLabel || '',
        qty: Math.max(1, qty),
      });
    }
    save(null, items);
    return items;
  }

  function setQty(_catalogId, index, qty) {
    const items = load();
    if (index < 0 || index >= items.length) return items;
    if (qty <= 0) items.splice(index, 1);
    else items[index].qty = qty;
    save(null, items);
    return items;
  }

  function remove(_catalogId, index) {
    const items = load();
    items.splice(index, 1);
    save(null, items);
    return items;
  }

  function clear() { save(null, []); return []; }

  function totalPieces(items) { return items.reduce((s, i) => s + Number(i.qty || 0), 0); }

  function subtotal(items) {
    return items.reduce((s, i) => {
      const n = Number(i.precoNum);
      return Number.isFinite(n) ? s + n * Number(i.qty || 1) : s;
    }, 0);
  }

  function displayCode(item) {
    if (item.cod && item.codFab) return `${item.cod} / ${item.codFab}`;
    return item.cod || item.codFab || '—';
  }

  function formatBR(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function buildWhatsAppMessage(items, options = {}) {
    const sellerName = options.vendedor?.nome || '';
    const offer = options.offer || {};
    const note = String(options.note || '').trim();
    const hasCondition = Boolean(offer.token && !offer.isExpired);
    const expiresAt = offer.expiresAt ? new Date(offer.expiresAt) : null;
    const expiresText = expiresAt && !Number.isNaN(expiresAt.getTime())
      ? expiresAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';

    const lines = [
      sellerName ? `Olá ${sellerName}, tudo bem?` : 'Olá, tudo bem?',
      '',
      'Tenho interesse nos itens abaixo e gostaria de confirmar disponibilidade, prazo e condições:',
      '',
    ];

    if (hasCondition) {
      lines.push('Condição especial recebida através do catálogo online.');
      if (expiresText) lines.push(`Validade da condição: ${expiresText}.`);
      lines.push('');
    }

    let total = 0;
    items.forEach((item) => {
      const qty = Number(item.qty || 1);
      const unit = Number(item.precoNum);
      const lineTotal = Number.isFinite(unit) ? unit * qty : null;
      if (lineTotal != null) total += lineTotal;

      lines.push(`• ${qty}x ${displayCode(item)}`);
      if (item.nome) lines.push(`  Produto: ${item.nome}`);
      if (item.marca) lines.push(`  Montadora: ${item.marca}`);
      if (item.catalogo) lines.push(`  Catálogo: ${item.catalogo}`);
      if (Number.isFinite(unit)) lines.push(`  Valor unit.: ${formatBR(unit)}`);
      if (lineTotal != null) lines.push(`  Total: ${formatBR(lineTotal)}`);
      lines.push('');
    });

    lines.push(`Total de peças: ${totalPieces(items)}`);
    if (total > 0) lines.push(`Subtotal estimado: ${formatBR(total)}`);
    if (note) {
      lines.push('');
      lines.push(`Observação: ${note}`);
    }
    lines.push('');
    lines.push('Valores sujeitos à confirmação de estoque e disponibilidade.');
    lines.push('Aguardo retorno para finalizar o pedido.');
    return lines.join('\n');
  }

  global.ZCart = { load, save, add, setQty, remove, clear, totalPieces, subtotal, displayCode, formatBR, buildWhatsAppMessage, storageKey: () => STORAGE_KEY };
})(typeof window !== 'undefined' ? window : global);
