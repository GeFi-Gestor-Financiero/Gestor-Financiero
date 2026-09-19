const allowedOrigins = new Set([
  'https://gefi-gestor-financiero.github.io',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://localhost:4175',
]);

const clean = (value, limit) => String(value || '').replace(/[<>\u0000-\u001F\u007F]/g, '').trim().slice(0, limit);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 12_000;
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 600;

async function rateLimit(request) {
  const address = request.headers.get('CF-Connecting-IP') || 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(address));
  const key = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const cacheKey = new Request(`https://gefi-rate-limit.invalid/${key}`);
  const cache = caches.default;
  const existing = await cache.match(cacheKey);
  const attempts = existing ? Number(await existing.text()) || 0 : 0;
  if (attempts >= RATE_LIMIT) return false;
  await cache.put(cacheKey, new Response(String(attempts + 1), {
    headers: { 'Cache-Control': `max-age=${RATE_WINDOW_SECONDS}` },
  }));
  return true;
}

function response(origin, status, body) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
  if (allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(body ? JSON.stringify(body) : null, { status, headers });
}

const base64UrlBytes = value => Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=')), character => character.charCodeAt(0));
const readJsonPart = value => JSON.parse(new TextDecoder().decode(base64UrlBytes(value)));
let firebaseKeysCache = { expiresAt: 0, keys: [] };

async function verifyFirebaseToken(request) {
  const token=String(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  const parts=token.split('.');
  if(parts.length!==3)return null;
  let header,payload;
  try{header=readJsonPart(parts[0]);payload=readJsonPart(parts[1])}catch{return null}
  if(header.alg!=='RS256'||payload.aud!=='gen-lang-client-0514785901'||payload.iss!=='https://securetoken.google.com/gen-lang-client-0514785901'||!payload.sub||Number(payload.exp||0)<=Date.now()/1000)return null;
  if(firebaseKeysCache.expiresAt<Date.now()){
    const keyResponse=await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
    if(!keyResponse.ok)return null;
    const cacheControl=keyResponse.headers.get('Cache-Control')||'',maxAge=Number(cacheControl.match(/max-age=(\d+)/)?.[1]||300);
    firebaseKeysCache={keys:(await keyResponse.json()).keys||[],expiresAt:Date.now()+maxAge*1000};
  }
  const jwk=firebaseKeysCache.keys.find(key=>key.kid===header.kid);
  if(!jwk)return null;
  try{const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']),valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,base64UrlBytes(parts[2]),new TextEncoder().encode(`${parts[0]}.${parts[1]}`));return valid?payload:null}catch{return null}
}

const safeSecretMatch = async (received, expected) => {
  const encoder=new TextEncoder(),left=encoder.encode(String(received||'')),right=encoder.encode(String(expected||''));
  if(!left.length||left.length!==right.length)return false;
  const [leftHash,rightHash]=await Promise.all([crypto.subtle.digest('SHA-256',left),crypto.subtle.digest('SHA-256',right)]),a=new Uint8Array(leftHash),b=new Uint8Array(rightHash);
  return a.every((value,index)=>value===b[index]);
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return response(origin, allowedOrigins.has(origin) ? 204 : 403);
    const url=new URL(request.url);
    if(url.pathname==='/iol/register'&&request.method==='POST'&&allowedOrigins.has(origin)){
      const identity=await verifyFirebaseToken(request);
      if(!identity?.email||!identity?.sub)return response(origin,401,{ok:false,error:'unauthorized'});
      await env.GEFI_SYNC.put(`iol-email:${String(identity.email).toLowerCase()}`,String(identity.sub));
      return response(origin,200,{ok:true});
    }
    if(url.pathname==='/iol/snapshot'&&request.method==='GET'&&allowedOrigins.has(origin)){
      const identity=await verifyFirebaseToken(request);
      if(!identity?.sub)return response(origin,401,{ok:false,error:'unauthorized'});
      const snapshot=await env.GEFI_SYNC.get(`iol-snapshot:${identity.sub}`,'json');
      return snapshot?response(origin,200,{ok:true,snapshot}):response(origin,404,{ok:false,error:'not_found'});
    }
    if(url.pathname==='/iol/sync'&&request.method==='POST'){
      const supplied=String(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
      if(!await safeSecretMatch(supplied,env.IOL_SYNC_SECRET))return response(origin,401,{ok:false,error:'unauthorized'});
      let payload;try{payload=await request.json()}catch{return response(origin,400,{ok:false,error:'invalid_json'})}
      const email=clean(payload.email,180).toLowerCase(),valuationArs=Number(payload.valuationArs),dailyChangeArs=Number(payload.dailyChangeArs||0),dailyChangePct=Number(payload.dailyChangePct||0),marketDate=String(payload.marketDate||'');
      if(!emailPattern.test(email)||!/^\d{4}-\d{2}-\d{2}$/.test(marketDate)||!Number.isFinite(valuationArs)||valuationArs<0||valuationArs>1e12||!Number.isFinite(dailyChangeArs)||!Number.isFinite(dailyChangePct))return response(origin,400,{ok:false,error:'invalid_snapshot'});
      const uid=await env.GEFI_SYNC.get(`iol-email:${email}`);
      if(!uid)return response(origin,404,{ok:false,error:'account_not_registered'});
      const positions=(Array.isArray(payload.positions)?payload.positions:[]).slice(0,200).flatMap(position=>{const symbol=clean(position?.symbol,24).toUpperCase(),quantity=Number(position?.quantity),unitPriceArs=Number(position?.unitPriceArs),positionValue=Number(position?.valuationArs),change=Number(position?.dailyChangePct||0);if(!symbol||![quantity,unitPriceArs,positionValue,change].every(Number.isFinite)||quantity<0||unitPriceArs<0||positionValue<0)return[];return[{symbol,description:clean(position.description,120),quantity,unitPriceArs,valuationArs:positionValue,dailyChangePct:change}]});
      const snapshot={provider:'iol',valuationArs,dailyChangeArs,dailyChangePct,marketDate,updatedAt:Date.now(),positions};
      await env.GEFI_SYNC.put(`iol-snapshot:${uid}`,JSON.stringify(snapshot));
      return response(origin,200,{ok:true,marketDate,valuationArs});
    }
    if (request.method !== 'POST' || !allowedOrigins.has(origin)||url.pathname!=='/') return response(origin, 403, { ok: false });
    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > MAX_BODY_BYTES) return response(origin, 413, { ok: false, error: 'payload_too_large' });
    if (!await rateLimit(request)) return response(origin, 429, { ok: false, error: 'rate_limited' });

    let payload;
    try { payload = await request.json(); } catch { return response(origin, 400, { ok: false, error: 'invalid_json' }); }
    if (payload.website) return response(origin, 200, { ok: true });

    const name = clean(payload.name, 100);
    const email = clean(payload.email, 180);
    const message = clean(payload.message, 3000);
    const source = clean(payload.source, 50) || 'GeFi';
    if (name.length < 2 || message.length < 10 || !emailPattern.test(email)) {
      return response(origin, 400, { ok: false, error: 'invalid_fields' });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'GeFi Soporte <onboarding@resend.dev>',
        to: ['gefisupport@gmail.com'],
        reply_to: email,
        subject: `Consulta de soporte GeFi · ${name}`,
        text: `Nombre: ${name}\nCorreo: ${email}\nOrigen: ${source}\n\n${message}`,
      }),
    });

    if (!resendResponse.ok) {
      console.error('Resend delivery failed', resendResponse.status, await resendResponse.text());
      return response(origin, 502, { ok: false, error: 'delivery_failed' });
    }
    return response(origin, 200, { ok: true });
  },
};
