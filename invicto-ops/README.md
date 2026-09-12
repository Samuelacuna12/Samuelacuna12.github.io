# INVICTO OPS

Centro de operaciones interno de Universo Invicto.

## Estado actual · v21

Aplicación operativa desplegada en GitHub Pages con autenticación real en Supabase Auth, datos compartidos en PostgreSQL, RLS por rol, sincronización de Shopify mediante webhooks y agente interno INVICTO I.A. ejecutado desde Supabase Edge Functions.

## Módulos operativos

- Inicio con cola automática de prioridades y alertas.
- Ventas Shopify, Draft Orders y ventas manuales.
- Asignación equitativa de asesores.
- Gestión comercial con SLA hábil Lun–Sáb 08:00–18:00.
- Mapeo de pedido a referencias exactas por talla/diseño/color.
- Inventario persistente separado en Hoko Bogotá, Hoko Medellín, LogiGho Medellín y Bucaramanga.
- Validación preventiva de archivos de stock y trazabilidad de cargas.
- Reserva transaccional de stock únicamente al confirmar.
- Recuperación y seguimientos programados.
- Cortes de despacho con validación de reserva completa.
- Exportación MASSIVE Hoko y LogiGho.
- Guías, despacho y devolución física.
- Garantías y novedades logísticas.
- Dashboard, meta mensual y KPIs.
- Diagnóstico interno de integraciones y salud operativa.
- INVICTO I.A. con contexto vivo de ventas, stock, alertas, recuperación, logística y KPIs.
- Búsqueda global con Ctrl/Cmd + K.

## Arquitectura

- Frontend: GitHub Pages.
- Auth y base de datos: Supabase.
- Seguridad: RLS + permisos por rol + funciones operativas con validación de `auth.uid()` y permisos.
- Shopify: webhooks con validación HMAC desde Supabase Edge Functions.
- I.A.: OpenAI API consumida únicamente desde una Edge Function; la clave no se expone al navegador ni al repositorio.
- Inventario: PostgreSQL como fuente de verdad; `localStorage` solo se conserva como capa de compatibilidad/cache para módulos heredados mientras se termina la consolidación de frontend.

## Reglas críticas

- No reservar inventario al recibir una venta; reservar únicamente cuando se confirma.
- No confirmar si no existe stock exacto suficiente para toda la orden en una sola bodega.
- Una venta solo puede pertenecer a un corte de despacho.
- Un corte solo admite ventas confirmadas con reserva completa.
- El stock físico se descuenta al despachar y se restaura únicamente al recibir físicamente una devolución.
- Nunca inventar IDs externos de Hoko/LogiGho.
- No subir credenciales, tokens, service-role keys ni secretos al repositorio.

## Pendientes externos

- Integración directa con API de Hoko cuando se disponga de documentación oficial/endpoints y credenciales adecuadas.
- LogiGho permanece con MASSIVE/manual mientras no exista una API disponible para esta operación.

## Operación

URL: https://samuelacuna12.github.io/invicto-ops/
