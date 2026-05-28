/**
 * wow-proxy Cloudflare Worker
 * 1순위: R2 버킷 (사전 캐시된 m2/skin/js)
 * 2순위: Cloudflare Edge Cache
 * 3순위: wow.zamimg.com (tbc→wrath→live 폴백)
 */

const ZAMIMG = 'https://wow.zamimg.com';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Referer': 'https://www.wowhead.com/',
  'Origin': 'https://www.wowhead.com',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

function getContentType(path) {
  if (path.endsWith('.mo3'))  return 'application/octet-stream';
  if (path.endsWith('.m2'))   return 'application/octet-stream';
  if (path.endsWith('.skin')) return 'application/octet-stream';
  if (path.endsWith('.anim')) return 'application/octet-stream';
  if (path.endsWith('.js'))   return 'application/javascript';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.png'))  return 'image/png';
  return 'application/octet-stream';
}

// tbc → wrath → live 폴백 경로
function getFallbackPaths(urlPath) {
  // 구버전 mo3 포맷
  if (urlPath.includes('/tbc/mo3/')) {
    const file = urlPath.split('/tbc/mo3/')[1];
    return [urlPath, `/modelviewer/wrath/mo3/${file}`, `/modelviewer/live/mo3/${file}`];
  }
  // 신버전 m2 포맷
  if (urlPath.includes('/tbc/m2/')) {
    const file = urlPath.split('/tbc/m2/')[1];
    return [urlPath, `/modelviewer/wrath/m2/${file}`, `/modelviewer/live/m2/${file}`];
  }
  // 신버전 skin 포맷
  if (urlPath.includes('/tbc/skin/')) {
    const file = urlPath.split('/tbc/skin/')[1];
    return [urlPath, `/modelviewer/wrath/skin/${file}`, `/modelviewer/live/skin/${file}`];
  }
  // anim 포맷
  if (urlPath.includes('/tbc/anim/')) {
    const file = urlPath.split('/tbc/anim/')[1];
    return [urlPath, `/modelviewer/wrath/anim/${file}`, `/modelviewer/live/anim/${file}`];
  }
  if (urlPath.includes('/tbc/meta/')) {
    const file = urlPath.split('/tbc/meta/')[1];
    return [urlPath, `/modelviewer/wrath/meta/${file}`];
  }
  if (urlPath.includes('/tbc/bone/')) {
    const file = urlPath.split('/tbc/bone/')[1];
    return [urlPath, `/modelviewer/wrath/bone/${file}`];
  }
  return [urlPath];
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const urlPath = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── Wowhead XML 프록시: /wowhead-xml/{version}/{item_id} ──
    // version: classic | tbc
    const whMatch = urlPath.match(/^\/wowhead-xml\/(classic|tbc)\/(\d+)$/);
    if (whMatch) {
      const [, version, itemId] = whMatch;
      const whUrl = `https://www.wowhead.com/${version}/item=${itemId}&xml&locale=ko`;
      try {
        const upstream = await fetch(whUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/xml, text/xml, */*',
            'Referer': 'https://www.wowhead.com/',
          },
        });
        const text = await upstream.text();
        return new Response(text, {
          status: upstream.status,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/xml; charset=utf-8' },
        });
      } catch (e) {
        return new Response('Wowhead fetch failed', { status: 502, headers: CORS_HEADERS });
      }
    }

    const isHead = request.method === 'HEAD';
    const paths = getFallbackPaths(urlPath);

    // ── 1순위: R2 버킷 확인 ──────────────────────────────────
    for (const p of paths) {
      const r2Key = p.startsWith('/') ? p.slice(1) : p;
      try {
        const obj = await env.MODEL_CACHE.get(r2Key);
        if (obj) {
          const headers = {
            ...CORS_HEADERS,
            'Content-Type': obj.httpMetadata?.contentType || getContentType(p),
            'Cache-Control': 'public, max-age=604800',
            'X-Source': 'r2',
          };
          return new Response(isHead ? null : obj.body, { status: 200, headers });
        }
      } catch (_) {}
    }

    // ── 2순위: Edge Cache 확인 ────────────────────────────────
    const cache = caches.default;
    const cacheKey = new Request(`${ZAMIMG}${paths[0]}`);
    const cached = await cache.match(cacheKey);
    if (cached) {
      const filteredHeaders = Object.fromEntries(
        [...cached.headers].filter(([k]) => !k.toLowerCase().startsWith('access-control-'))
      );
      return new Response(isHead ? null : cached.body, {
        status: 200,
        headers: { ...filteredHeaders, ...CORS_HEADERS, 'X-Source': 'edge-cache' },
      });
    }

    // ── 3순위: zamimg.com 폴백 (tbc→wrath→live) ───────────────
    for (const p of paths) {
      const targetUrl = `${ZAMIMG}${p}`;
      try {
        const upstream = await fetch(targetUrl, {
          method: isHead ? 'HEAD' : 'GET',
          headers: FETCH_HEADERS,
          redirect: 'follow',
        });

        if (upstream.ok) {
          const contentType = upstream.headers.get('Content-Type') || getContentType(p);
          const body = isHead ? null : await upstream.arrayBuffer();
          const r2Key = p.startsWith('/') ? p.slice(1) : p;

          const response = new Response(body, {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=604800',
              'X-Source': 'zamimg',
            },
          });

          // Edge Cache + R2에 저장 (비동기)
          if (!isHead && body) {
            const bodyClone = body.slice(0);
            ctx.waitUntil(Promise.all([
              cache.put(new Request(targetUrl), response.clone()),
              env.MODEL_CACHE.put(r2Key, bodyClone, {
                httpMetadata: { contentType },
              }),
            ]));
          }
          return response;
        }
      } catch (_) {}
    }

    return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
  },
};
