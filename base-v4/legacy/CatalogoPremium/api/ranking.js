const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = process.env.SUPABASE_ANALYTICS_TABLE || 'catalog_events';

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function rangeToDate(range) {
  const now = new Date();
  const value = String(range || '30d').toLowerCase();
  const days = value === '24h' ? 1 : value === '7d' ? 7 : value === '90d' ? 90 : value === 'all' ? 3650 : 30;
  now.setDate(now.getDate() - days);
  return now.toISOString();
}

function productKey(product) {
  return String(product?.cod || product?.codFab || product?.nome || '').trim().toLowerCase();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 200, {
      ok: true,
      stored: false,
      items: [],
      reason: 'Supabase não configurado.',
    });
  }

  const catalogId = String(req.query.catalogId || '');
  const limit = Math.max(1, Math.min(30, parseInt(req.query.limit || '8', 10) || 8));
  const since = rangeToDate(req.query.range);

  const filters = [
    'select=event_type,catalog_id,qty,product,created_at',
    `created_at=gte.${encodeURIComponent(since)}`,
    'event_type=in.(add_to_cart,whatsapp,order_submitted)',
    'order=created_at.desc',
    'limit=2500',
  ];

  if (catalogId) filters.push(`catalog_id=eq.${encodeURIComponent(catalogId)}`);

  try {
    const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${TABLE}?${filters.join('&')}`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return json(res, 500, { ok: false, error: 'supabase_select_failed', details: text.slice(0, 500) });
    }

    const rows = await response.json();
    const grouped = new Map();

    for (const row of Array.isArray(rows) ? rows : []) {
      const product = row.product || {};
      const key = productKey(product);
      if (!key) continue;

      const current = grouped.get(key) || {
        cod: product.cod || '',
        codFab: product.codFab || '',
        nome: product.nome || '',
        marca: product.marca || '',
        catalogo: product.catalogo || '',
        total: 0,
      };

      const qty = Math.max(1, Number(row.qty || 1));
      current.total += qty;
      grouped.set(key, current);
    }

    const items = Array.from(grouped.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    return json(res, 200, { ok: true, stored: true, items });
  } catch (error) {
    return json(res, 500, { ok: false, error: 'ranking_failed', details: String(error.message || error) });
  }
};
