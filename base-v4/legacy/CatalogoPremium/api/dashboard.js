const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = process.env.SUPABASE_ANALYTICS_TABLE || 'catalog_events';
const DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN || '';

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
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

function addToMap(map, key, amount = 1, extra = {}) {
  const safeKey = String(key || '').trim();
  if (!safeKey) return;
  const current = map.get(safeKey) || { key: safeKey, total: 0, ...extra };
  current.total += amount;
  map.set(safeKey, { ...current, ...extra, total: current.total });
}

function topFromMap(map, limit = 10) {
  return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, limit);
}

function authorize(req) {
  if (!DASHBOARD_TOKEN) return true;
  const header = req.headers['x-dashboard-token'];
  const query = req.query?.token;
  return header === DASHBOARD_TOKEN || query === DASHBOARD_TOKEN;
}

async function fetchRows({ since, catalogId, consultorId }) {
  const filters = [
    'select=event_type,catalog_id,consultor_id,query,qty,product,payload,created_at',
    `created_at=gte.${encodeURIComponent(since)}`,
    'order=created_at.desc',
    'limit=5000',
  ];
  if (catalogId) filters.push(`catalog_id=eq.${encodeURIComponent(catalogId)}`);
  if (consultorId) filters.push(`consultor_id=eq.${encodeURIComponent(consultorId)}`);

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

  if (!authorize(req)) {
    return json(res, 401, { ok: false, error: 'unauthorized' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 200, {
      ok: true,
      stored: false,
      warning: 'Supabase não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.',
      totals: { events: 0, views: 0, searches: 0, addToCart: 0, whatsapp: 0, notFound: 0 },
      topProducts: [],
      topSearches: [],
      noResultSearches: [],
      consultants: [],
      catalogs: [],
      brands: [],
      timeline: [],
    });
  }

  const range = String(req.query.range || '30d');
  const since = rangeToDate(range);
  const catalogId = String(req.query.catalogId || '');
  const consultorId = String(req.query.consultorId || '');

  try {
    const rows = await fetchRows({ since, catalogId, consultorId });

    const totals = { events: rows.length, views: 0, searches: 0, addToCart: 0, whatsapp: 0, notFound: 0 };
    const products = new Map();
    const searches = new Map();
    const noResults = new Map();
    const consultants = new Map();
    const catalogs = new Map();
    const brands = new Map();
    const timeline = new Map();

    for (const row of Array.isArray(rows) ? rows : []) {
      const type = row.event_type || '';
      const qty = Math.max(1, Number(row.qty || 1));
      const product = row.product || {};
      const day = String(row.created_at || '').slice(0, 10);

      if (type === 'view') totals.views += 1;
      if (type === 'search') totals.searches += 1;
      if (type === 'add_to_cart') totals.addToCart += qty;
      if (type === 'whatsapp' || type === 'order_submitted') totals.whatsapp += qty;
      if (type === 'not_found') totals.notFound += 1;

      if (day) {
        const current = timeline.get(day) || { date: day, events: 0, views: 0, searches: 0, addToCart: 0, whatsapp: 0, notFound: 0 };
        current.events += 1;
        if (type === 'view') current.views += 1;
        if (type === 'search') current.searches += 1;
        if (type === 'add_to_cart') current.addToCart += qty;
        if (type === 'whatsapp' || type === 'order_submitted') current.whatsapp += qty;
        if (type === 'not_found') current.notFound += 1;
        timeline.set(day, current);
      }

      if (row.consultor_id) addToMap(consultants, row.consultor_id, type === 'whatsapp' ? qty : 1);
      if (row.catalog_id) addToMap(catalogs, row.catalog_id, type === 'whatsapp' ? qty : 1);

      if (type === 'search' && row.query) {
        const q = String(row.query).trim().toLowerCase();
        addToMap(searches, q, 1, { query: q });
        const resultsCount = Number(row.payload?.resultsCount);
        if (Number.isFinite(resultsCount) && resultsCount === 0) addToMap(noResults, q, 1, { query: q });
      }

      if ((type === 'add_to_cart' || type === 'whatsapp' || type === 'order_submitted') && productKey(product)) {
        const key = productKey(product);
        const current = products.get(key) || {
          cod: product.cod || '',
          codFab: product.codFab || '',
          nome: product.nome || '',
          marca: product.marca || '',
          catalogo: product.catalogo || row.catalog_id || '',
          total: 0,
          whatsapp: 0,
          addToCart: 0,
        };
        current.total += qty;
        if (type === 'whatsapp' || type === 'order_submitted') current.whatsapp += qty;
        if (type === 'add_to_cart') current.addToCart += qty;
        products.set(key, current);
        if (product.marca) addToMap(brands, product.marca, qty, { marca: product.marca });
      }
    }

    return json(res, 200, {
      ok: true,
      stored: true,
      range,
      since,
      generatedAt: new Date().toISOString(),
      totals,
      topProducts: topFromMap(products, 20),
      topSearches: topFromMap(searches, 20),
      noResultSearches: topFromMap(noResults, 20),
      consultants: topFromMap(consultants, 20),
      catalogs: topFromMap(catalogs, 20),
      brands: topFromMap(brands, 20),
      timeline: Array.from(timeline.values()).sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    return json(res, 500, { ok: false, error: 'dashboard_failed', details: String(error.message || error) });
  }
};
