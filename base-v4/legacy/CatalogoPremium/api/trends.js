const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = process.env.SUPABASE_ANALYTICS_TABLE || 'catalog_events';

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
  res.end(JSON.stringify(data));
}

function isoDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function productKey(product) {
  return String(product?.cod || product?.codFab || product?.nome || '').trim().toLowerCase();
}

async function fetchRows({ since, catalogId }) {
  const filters = [
    'select=event_type,catalog_id,qty,product,created_at',
    `created_at=gte.${encodeURIComponent(since)}`,
    'event_type=in.(add_to_cart,whatsapp,order_submitted)',
    'order=created_at.desc',
    'limit=5000',
  ];
  if (catalogId) filters.push(`catalog_id=eq.${encodeURIComponent(catalogId)}`);

  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${TABLE}?${filters.join('&')}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`supabase_select_failed: ${text.slice(0, 500)}`);
  }

  return response.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 200, { ok: true, stored: false, items: [], reason: 'Supabase não configurado.' });
  }

  const catalogId = String(req.query.catalogId || '');
  const limit = Math.max(1, Math.min(20, parseInt(req.query.limit || '8', 10) || 8));

  try {
    const rows = await fetchRows({ since: isoDaysAgo(14), catalogId });
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
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
        catalogo: product.catalogo || row.catalog_id || '',
        current: 0,
        previous: 0,
      };

      const qty = Math.max(1, Number(row.qty || 1));
      const created = new Date(row.created_at || 0).getTime();
      if (now - created <= sevenDays) current.current += qty;
      else current.previous += qty;

      grouped.set(key, current);
    }

    const items = Array.from(grouped.values())
      .map((item) => {
        const growth = item.previous === 0 ? (item.current > 0 ? 999 : 0) : ((item.current - item.previous) / item.previous) * 100;
        return { ...item, growth: Math.round(growth), score: item.current * 10 + Math.max(0, growth) };
      })
      .filter((item) => item.current > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return json(res, 200, { ok: true, stored: true, items });
  } catch (error) {
    return json(res, 500, { ok: false, error: 'trends_failed', details: String(error.message || error) });
  }
};
