# GeFi para Android: gastos desde Mercado Pago

Esta variante Android contiene un `NotificationListenerService` que observa **únicamente** el paquete oficial `com.mercadopago.wallet`. Las notificaciones se guardan localmente hasta que GeFi está abierta y hay una sesión iniciada.

GeFi importa solamente avisos que parecen gastos (por ejemplo, “Pagaste”, “Compra aprobada” o “Pago realizado”). Ignora ingresos, rendimientos, devoluciones y reembolsos. Cada aviso tiene un identificador y no puede registrarse dos veces.

## Compilar

1. Abrir la carpeta `android` con Android Studio.
2. Esperar la sincronización de Gradle.
3. Ejecutar `app` en un teléfono Android 8 o posterior.
4. En GeFi, abrir **Perfil → Tus datos → Gastos de Mercado Pago**.
5. Android mostrará “Acceso a notificaciones”; habilitar **GeFi · gastos de Mercado Pago**.

La PWA instalada desde Chrome no puede leer notificaciones de otras aplicaciones. Esta función solo aparece dentro del APK Android.
