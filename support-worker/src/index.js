const allowedOrigins = new Set([
  'https://gefi-gestor-financiero.github.io',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://localhost:4175',
]);

const clean = (value, limit) => String(value || '').replace(/[<>]/g, '').trim().slice(0, limit);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function response(origin, status, body) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
  if (allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(body ? JSON.stringify(body) : null, { status, headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return response(origin, allowedOrigins.has(origin) ? 204 : 403);
    if (request.method !== 'POST' || !allowedOrigins.has(origin)) return response(origin, 403, { ok: false });

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

