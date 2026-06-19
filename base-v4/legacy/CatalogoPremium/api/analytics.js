const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = process.env.SUPABASE_ANALYTICS_TABLE || 'catalog_events';

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function safeString(value, max = 500) {
  return String(value || '').slice(0, max);
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return json(res, 200, {
      ok: true,
      service: 'catalog-analytics',
      database: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  let body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch { body = {}; }
  }

  const eventType = safeString(body.eventType || body.type, 64);
  if (!eventType) return json(res, 400, { ok: false, error: 'missing_event_type' });

  const row = {
    event_type: eventType,
    catalog_id: safeString(body.catalogId, 80),
    consultor_id: safeString(body.consultorId, 80),
    client_id: safeString(body.clientId, 120),
    url: safeString(body.url, 1000),
    user_agent: safeString(body.userAgent, 1000),
    query: safeString(body.query, 300),
    qty: Number.isFinite(Number(body.qty)) ? Number(body.qty) : 1,
    product: body.product && typeof body.product === 'object' ? body.product : null,
    payload: body && typeof body === 'object' ? body : {},
  };

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 202, {
      ok: true,
      stored: false,
      reason: 'Supabase não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.',
    });
  }

  try {
    const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });

    if (!response.ok) {
      const text = await response.text();
      return json(res, 500, { ok: false, error: 'supabase_insert_failed', details: text.slice(0, 500) });
    }

    return json(res, 200, { ok: true, stored: true });
  } catch (error) {
    return json(res, 500, { ok: false, error: 'analytics_failed', details: String(error.message || error) });
  }
};
