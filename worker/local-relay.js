/* ==========================================================================
   Local relay for development & testing — identical contract to the
   Cloudflare Worker (worker/ojjymelon-proxy.js), so anything that works
   here works on the deployed worker too.

     node worker/local-relay.js          (default port 8932)

   Endpoints:
     GET  /ping                     -> "ok"
     POST /relay?url=<edupoint-url> -> forwards method + headers + body
          header `x-ojjy-key`      -> attaches the Synergy cookie (SOAP path)
   Only *.edupoint.com targets are allowed. Nothing is logged.
   ========================================================================== */
const http = require('http');
const https = require('https');

const PORT = Number(process.env.PORT || 8932);
const ALLOWED_SUFFIX = '.edupoint.com';
const PASS_HEADERS = ['content-type', 'authorization', 'edupointkeyversion', 'appnameosandversion', 'x-ojjy-key', 'accept'];
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (url.pathname === '/ping') { res.writeHead(200, CORS); return res.end('ok'); }
  if (url.pathname !== '/relay') { res.writeHead(404, CORS); return res.end(JSON.stringify({ error: 'not found' })); }

  const target = url.searchParams.get('url');
  let targetURL;
  try { targetURL = new URL(target || ''); } catch { res.writeHead(400, CORS); return res.end('bad url'); }
  if (targetURL.protocol !== 'https:' || !targetURL.hostname.endsWith(ALLOWED_SUFFIX)) {
    res.writeHead(403, CORS);
    return res.end(JSON.stringify({ error: 'only Edupoint district servers are allowed' }));
  }

  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const fwd = { ...CORS };
    const headers = {};
    for (const h of PASS_HEADERS) { if (req.headers[h]) headers[h] = req.headers[h]; }
    const relayKey = req.headers['x-ojjy-key'];
    if (relayKey) headers['Cookie'] = `AppSupportsSession=1; edupointkey=1; edupointkeyversion=${relayKey}`;

    const up = https.request(targetURL, { method: req.method, headers }, (ur) => {
      const out = { ...CORS };
      for (const [k, v] of Object.entries(ur.headers)) {
        if (!['set-cookie', 'access-control-allow-origin', 'transfer-encoding'].includes(k)) out[k] = v;
      }
      res.writeHead(ur.statusCode, out);
      ur.pipe(res);
    });
    up.on('error', (e) => {
      res.writeHead(502, CORS);
      res.end(JSON.stringify({ error: 'relay failure', message: String(e.message || e) }));
    });
    if (body.length) up.write(body);
    up.end();
  });
}).listen(PORT, () => console.log(`ojjyMelon local relay on http://localhost:${PORT}`));
