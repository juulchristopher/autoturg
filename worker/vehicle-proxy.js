/**
 * Cloudflare Worker: Vehicle Lookup Proxy
 *
 * Bridges client-side JavaScript to the Transpordiamet ATV API
 * and mntstat.ee scraper. Handles CORS and auth secrets.
 *
 * Setup:
 *   1. Create a Cloudflare Workers account (free tier: 100K requests/day)
 *   2. Install Wrangler CLI: npm install -g wrangler
 *   3. Set secrets:
 *      wrangler secret put ATV_API_KEY
 *      wrangler secret put ATV_API_URL
 *   4. Deploy:
 *      cd worker && wrangler deploy
 *
 * Endpoints:
 *   GET /api/vehicle?reg=123ABC    — lookup by registration number
 *   GET /api/vehicle?vin=WBAPH...  — lookup by VIN (ATV API only)
 *   GET /api/health                — health check
 *
 * Environment variables (Cloudflare secrets):
 *   ATV_API_KEY  — Transpordiamet API key
 *   ATV_API_URL  — API base URL (default: https://abi.ria.ee/teabevarav/api/v1)
 *
 * CORS: Allows requests from juulchristopher.github.io and localhost
 */

const ALLOWED_ORIGINS = [
  'https://juulchristopher.github.io',
  'http://localhost:8000',
  'http://localhost:3000',
  'http://127.0.0.1:8000',
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, status = 200, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  });
}

// ── ATV API lookup ──────────────────────────────
async function atvLookup(query, type, env) {
  const apiKey = env.ATV_API_KEY || '';
  const apiUrl = env.ATV_API_URL || 'https://abi.ria.ee/teabevarav/api/v1';

  if (!apiKey) {
    return null; // Not configured, fall through to mntstat
  }

  const param = type === 'vin' ? `vin=${encodeURIComponent(query)}` : `regNumber=${encodeURIComponent(query)}`;
  const url = `${apiUrl}/vehicles?${param}`;

  try {
    const resp = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'autoturg-bot/1.0',
      },
    });

    if (!resp.ok) {
      if (resp.status === 401) return { error: 'ATV API key invalid' };
      if (resp.status === 404) return { error: `Vehicle '${query}' not found` };
      return { error: `ATV API error: HTTP ${resp.status}` };
    }

    const data = await resp.json();
    const vehicle = Array.isArray(data) ? data[0] : data;

    if (!vehicle) return { error: `Vehicle '${query}' not found` };

    return {
      source: 'atv',
      regNumber: vehicle.regNumber || query,
      vin: vehicle.vin || vehicle.VIN || '',
      make: (vehicle.make || vehicle.mark || '').toUpperCase(),
      model: vehicle.model || vehicle.mudel || '',
      variant: vehicle.variant || '',
      prodYear: parseInt(vehicle.prodYear || vehicle.year || vehicle.aasta) || null,
      bodyType: vehicle.bodyType || vehicle.keretüüp || '',
      color: vehicle.color || vehicle.värv || '',
      fuelType: vehicle.fuelType || vehicle.mootoritüüp || '',
      transmission: vehicle.transmission || vehicle.käigukast || '',
      powerKw: parseInt(vehicle.powerKw || vehicle.kw) || null,
      engineCc: parseInt(vehicle.engineCc || vehicle.cc) || null,
      weightKg: parseInt(vehicle.weightKg || vehicle.kg) || null,
      county: vehicle.county || vehicle.maakond || '',
      status: vehicle.status || vehicle.staatus || '',
      firstRegDate: vehicle.firstRegDate || '',
      firstRegInEstonia: vehicle.firstRegInEstonia || '',
      ownerChangeCount: parseInt(vehicle.ownerChangeCount) || null,
    };
  } catch (e) {
    return { error: `ATV API error: ${e.message}` };
  }
}

// ── mntstat.ee scraper (fallback) ───────────────
async function mntstatLookup(regNumber) {
  const reg = regNumber.replace(/[^A-Z0-9]/g, '').toUpperCase();
  const url = `https://www.mntstat.ee/search.php?reg_nr=${encodeURIComponent(reg)}`;

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'text/html',
      },
    });

    if (!resp.ok) return { error: `mntstat.ee returned HTTP ${resp.status}` };

    const html = await resp.text();

    // Parse searchResult table
    const tableMatch = html.match(/<table[^>]*id=["']searchResult["'][^>]*>([\s\S]*?)<\/table>/);
    if (!tableMatch) {
      if (html.includes('ei leitud')) return { error: `Vehicle '${reg}' not found` };
      return { error: 'No results from mntstat.ee' };
    }

    // Extract td cells
    const cells = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let m;
    while ((m = cellRegex.exec(tableMatch[1])) !== null) {
      cells.push(m[1].trim());
    }

    if (cells.length < 13) return { error: 'Unexpected table format' };

    // Map to our schema (13 columns: status, count, make, model, bodyType, year, color, fuelType, transmission, kw, cc, kg, county)
    return {
      source: 'mntstat',
      regNumber: reg,
      status: cells[0] || '',
      make: (cells[2] || '').toUpperCase(),
      model: cells[3] || '',
      bodyType: cells[4] || '',
      prodYear: parseInt(cells[5]) || null,
      color: cells[6] || '',
      fuelType: cells[7] || '',
      transmission: cells[8] || '',
      powerKw: parseInt(cells[9]) || null,
      engineCc: parseInt(cells[10]) || null,
      weightKg: parseInt(cells[11]) || null,
      county: cells[12] || '',
    };
  } catch (e) {
    return { error: `mntstat.ee error: ${e.message}` };
  }
}

// ── Request handler ─────────────────────────────
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/api/health') {
      return jsonResponse({
        status: 'ok',
        atvConfigured: !!(env.ATV_API_KEY),
        timestamp: new Date().toISOString(),
      }, 200, request);
    }

    // Vehicle lookup
    if (url.pathname === '/api/vehicle') {
      const reg = url.searchParams.get('reg');
      const vin = url.searchParams.get('vin');

      if (!reg && !vin) {
        return jsonResponse(
          { error: 'Provide ?reg=123ABC or ?vin=WBAPH5C55BA123456' },
          400, request
        );
      }

      let result;

      if (vin) {
        // VIN lookup: ATV only
        result = await atvLookup(vin, 'vin', env);
        if (!result) {
          result = { error: 'VIN lookup requires ATV API. Configure ATV_API_KEY secret.' };
        }
      } else {
        // Reg lookup: ATV first, fallback to mntstat
        result = await atvLookup(reg, 'reg', env);
        if (!result || result.error) {
          const atvError = result?.error || 'ATV not configured';
          result = await mntstatLookup(reg);
          if (result.error) {
            result.error += ` (ATV: ${atvError})`;
          }
        }
      }

      const status = result.error ? 404 : 200;
      return jsonResponse({
        data: result,
        meta: { source: result.source || 'unknown', timestamp: new Date().toISOString() },
      }, status, request);
    }

    return jsonResponse({ error: 'Not found. Use /api/vehicle?reg=123ABC' }, 404, request);
  },
};
