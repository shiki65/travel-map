// Cloudflare Pages Function: functions/api/amap-search.js
// Configure AMAP_WEB_SERVICE_KEY as a secret in Cloudflare Pages.
const buckets = new Map();

export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Type': 'application/json; charset=utf-8'
  };
  const reply = (status, body) => new Response(JSON.stringify(body), { status, headers });

  if (request.method !== 'GET') return reply(405, { error: '仅支持 GET 请求' });

  const origin = request.headers.get('Origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host)
        return reply(403, { error: '不允许跨站调用' });
    } catch {
      return reply(403, { error: '来源不合法' });
    }
  }

  // Best-effort rate limit; isolate memory is not shared across all edge instances.
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const bucket = buckets.get(ip) || { start: now, count: 0 };
  if (now - bucket.start > 60000) { bucket.start = now; bucket.count = 0; }
  bucket.count++;
  buckets.set(ip, bucket);
  if (bucket.count > 20) return reply(429, { error: '搜索太频繁，请稍后再试' });
  if (buckets.size > 1000) {
    for (const [k, v] of buckets) if (now - v.start > 60000) buckets.delete(k);
  }

  const url = new URL(request.url);
  const keywords = (url.searchParams.get('keywords') || '').trim().slice(0, 100);
  const city = (url.searchParams.get('city') || '').trim().slice(0, 50);
  if (!keywords) return reply(400, { error: '请填写搜索关键词' });
  const key = env.AMAP_WEB_SERVICE_KEY;
  if (!key) return reply(503, { error: '尚未配置高德服务密钥' });

  const params = new URLSearchParams({ key, keywords, offset: '10', page: '1', extensions: 'base', output: 'JSON' });
  if (city) params.set('city', city);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    let response;
    try {
      response = await fetch('https://restapi.amap.com/v3/place/text?' + params, { signal: controller.signal });
    } finally { clearTimeout(timer); }
    if (!response.ok) throw new Error('高德接口暂时不可用');
    const data = await response.json();
    if (data.status !== '1') return reply(502, { error: '高德搜索失败：' + String(data.info || '请检查 Key 权限').slice(0, 100) });
    const pois = Array.isArray(data.pois) ? data.pois.slice(0, 10).map(p => ({
      name: typeof p.name === 'string' ? p.name : '',
      location: typeof p.location === 'string' ? p.location : '',
      address: typeof p.address === 'string' ? p.address : '',
      district: typeof p.adname === 'string' ? p.adname : '',
      city: typeof p.cityname === 'string' ? p.cityname : ''
    })) : [];
    return reply(200, { pois });
  } catch (e) {
    return reply(502, { error: e.name === 'AbortError' ? '搜索超时，请重试' : '高德搜索暂时不可用' });
  }
}
