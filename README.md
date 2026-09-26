<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a94cc835-b2e3-4297-b9d5-2f6cdda80b7d

## Reporte mensual seguro

`functions/monthlyFinanceReport` queda programada para el día 1 a las 09:00, zona `America/Argentina/Buenos_Aires`. Genera un documento inalterable en `users/{uid}/monthlyClosures/{AAAA-MM}` con ingresos, gastos, inversión del mes, mayor gasto y los saldos finales de cuenta, efectivo, inversiones, ahorros y patrimonio. Después envía una sola vez el resumen al correo de la cuenta; el usuario puede desactivarlo desde Configuración.

Antes de publicarla, instalar las dependencias de `functions/`, configurar `SMTP_HOST`, `SMTP_PORT` y `SMTP_FROM`, y crear los secretos de Firebase `SMTP_USER` y `SMTP_PASS`. Ninguna credencial SMTP se expone al navegador. La función reintenta hasta tres veces si el proveedor de correo falla y registra el estado del envío en el propio cierre.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
