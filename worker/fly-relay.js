/* ==========================================================================
   ojjyMelon relay — production build (fly.io / any Node host)
   Contract (identical to worker/ojjymelon-proxy.js and worker/local-relay.js):
     GET  /                      -> info page
     GET  /ping                  -> "ok"
     POST /relay?url=<edupoint>  -> forwards method + safe-listed headers + body
          header `x-ojjy-key`    -> attaches the Synergy cookie (SOAP path)
   Safety: only *.edupoint.com targets, 256 KB body cap, 30s upstream timeout,
           no logging of credentials or payloads.
   ========================================================================== */
const http = require('http');
const https = require('https');

const PORT = Number(process.env.PORT || 8080);
const ALLOWED_SUFFIX = '.edupoint.com';
const PASS_HEADERS = ['content-type', 'authorization', 'edupointkeyversion', 'appnameosandversion', 'x-ojjy-key', 'accept'];
const MAX_BODY = 256 * 1024;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }

  if (url.pathname === '/' ) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', ...CORS });
    return res.end('ojjyMelon relay is running.\n\nEndpoints: GET /ping · POST /relay?url=<edupoint-url>\nSource: https://github.com/jo-jo-home/ojjyMelon\n');
  }

  if (url.pathname === '/ping') { res.writeHead(200, CORS); return res.end('ok'); }

  if (url.pathname !== '/relay') {
    res.writeHead(404, CORS);
    return res.end(JSON.stringify({ error: 'not found' }));
  }

  const target = url.searchParams.get('url');
  let targetURL;
  try { targetURL = new URL(target || ''); } catch { res.writeHead(400, CORS); return res.end('bad url'); }
  if (targetURL.protocol !== 'https:' || !targetURL.hostname.endsWith(ALLOWED_SUFFIX)) {
    res.writeHead(403, CORS);
    return res.end(JSON.stringify({ error: 'only Edupoint district servers are allowed' }));
  }

  const chunks = [];
  let size = 0;
  let aborted = false;
  req.on('data', (c) => {
    size += c.length;
    if (size > MAX_BODY) {
      aborted = true;
      res.writeHead(413, CORS);
      res.end(JSON.stringify({ error: 'payload too large' }));
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on('end', () => {
    if (aborted) return;
    const body = Buffer.concat(chunks);
    const headers = {};
    for (const h of PASS_HEADERS) { if (req.headers[h]) headers[h] = req.headers[h]; }
    const relayKey = req.headers['x-ojjy-key'];
    if (relayKey) headers['Cookie'] = `AppSupportsSession=1; edupointkey=1; edupointkeyversion=${relayKey}`;

    const up = https.request(targetURL, {
      method: req.method,
      headers,
      timeout: 30000,
    }, (ur) => {
      const out = { ...CORS };
      for (const [k, v] of Object.entries(ur.headers)) {
        if (!['set-cookie', 'access-control-allow-origin', 'transfer-encoding'].includes(k)) out[k] = v;
      }
      res.writeHead(ur.statusCode, out);
      ur.pipe(res);
    });
    up.on('timeout', () => up.destroy(new Error('upstream timeout')));
    up.on('error', (e) => {
      if (res.headersSent) return res.end();
      res.writeHead(502, CORS);
      res.end(JSON.stringify({ error: 'relay failure', message: String(e.message || e) }));
    });
    if (body.length) up.write(body);
    up.end();
  });
}).listen(PORT, () => console.log(`ojjyMelon relay listening on :${PORT}`));
