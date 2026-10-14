/* ==========================================================================
   ojjyMelon proxy relay — a tiny Cloudflare Worker (free tier is plenty).
   Why: browsers can't call your district's StudentVUE server directly
   (the server sends no CORS headers), and the browser itself may not set
   the Cookie header the SOAP endpoint needs. This relay forwards requests
   to Edupoint servers and adds the required security key cookie.

   Deploy (2 minutes, free):
     1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
     2. Name it ojjymelon-proxy, paste this file, Deploy
     3. Copy the URL (https://ojjymelon-proxy.<your-name>.workers.dev)
     4. In ojjyMelon: Settings → Proxy relay → paste the URL → Save

   Endpoints:
     GET  /ping                     -> "ok" (health check)
     POST /relay?url=<edupoint-url> -> forwards method + safe-listed headers + body
          header `x-ojjy-key: <key>` -> relay attaches the Synergy cookie
                                          (needed for the SOAP path; the JSON
                                          path just uses the edupointkeyversion
                                          header, which is forwarded as-is)
   Safety: the relay only talks to *.edupoint.com hosts. Nothing is logged.
   ========================================================================== */

const ALLOWED_HOST_SUFFIX = '.edupoint.com';
const PASS_HEADERS = [
  'content-type',
  'authorization',
  'edupointkeyversion',
  'appnameosandversion',
  'x-ojjy-key',
  'accept',
];
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === '/ping') {
      return new Response('ok', { headers: CORS_HEADERS });
    }

    if (url.pathname !== '/relay') {
      return json({ error: 'not found' }, 404);
    }

    if (request.method !== 'GET' && request.method !== 'POST') {
      return json({ error: 'method not allowed' }, 405);
    }

    const target = url.searchParams.get('url');
    let targetURL;
    try { targetURL = new URL(target || ''); } catch { return json({ error: 'bad url' }, 400); }
    if (targetURL.protocol !== 'https:' || !targetURL.hostname.endsWith(ALLOWED_HOST_SUFFIX)) {
      return json({ error: 'only Edupoint district servers are allowed' }, 403);
    }

    const forwardHeaders = new Headers();
    for (const h of PASS_HEADERS) {
      const v = request.headers.get(h);
      if (v) forwardHeaders.set(h, v);
    }
    // The SOAP endpoint needs the key as a cookie — browsers can't set Cookie,
    // so the app sends it as x-ojjy-key and the relay attaches the cookie.
    const relayKey = request.headers.get('x-ojjy-key');
    if (relayKey) {
      forwardHeaders.set('Cookie', `AppSupportsSession=1; edupointkey=1; edupointkeyversion=${relayKey}`);
    }

    let body;
    if (request.method === 'POST') body = await request.arrayBuffer();

    try {
      const upstream = await fetch(targetURL.toString(), {
        method: request.method,
        headers: forwardHeaders,
        body,
      });
      const headers = new Headers(upstream.headers);
      for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch (e) {
      return json({ error: 'relay failure', message: String(e && e.message || e) }, 502);
    }
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
