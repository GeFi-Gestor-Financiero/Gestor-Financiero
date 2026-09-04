# GeFi Support Worker

Endpoint seguro para los formularios de soporte de GeFi. La clave de Resend se guarda como secreto de Cloudflare y nunca se incorpora a los sitios públicos.

Despliegue:

1. `wrangler secret put RESEND_API_KEY`
2. `wrangler deploy`

