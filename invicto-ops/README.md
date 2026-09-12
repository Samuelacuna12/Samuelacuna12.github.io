# INVICTO OPS

Centro de operaciones interno de Universo Invicto.

## Estado actual · v23

Aplicación operativa desplegada en GitHub Pages con autenticación real en Supabase Auth, datos compartidos en PostgreSQL, RLS por rol, sincronización de Shopify mediante webhooks y agente interno INVICTO I.A. ejecutado desde Supabase Edge Functions.

La versión v23 añade historial mensual de ventas y endurecimiento de producción. El flujo transaccional `confirmar → reservar stock → crear corte → despachar → consumir inventario` fue validado en una transacción de prueba con rollback, sin alterar datos reales. Durante esa validación se detectó y corrigió el despacho por UUID de bodega.

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
- Dashboard operativo, meta mensual y KPIs.
- **Ventas por mes v23:** consulta independiente por mes, comparación contra mes anterior, ventas individuales, filtros, paginación, detalle de pedido, facturación, unidades, conversión, borradores, surtido, bodega, guía y exportación Excel.
- Diagnóstico interno de integraciones y salud operativa.
- INVICTO I.A. con contexto vivo de ventas, stock, alertas, recuperación, logística y KPIs.
- Búsqueda global con Ctrl/Cmd + K.

## Arquitectura

- Frontend: GitHub Pages.
- Auth y base de datos: Supabase.
- Seguridad: RLS + permisos por rol + funciones operativas con validación de `auth.uid()` y permisos.
- Shopify: webhooks con validación HMAC desde Supabase Edge Functions. Webhook v8 con validación del dominio de tienda y recuperación automática ante concurrencia de clientes por teléfono.
- I.A.: OpenAI API consumida únicamente desde una Edge Function; la clave no se expone al navegador ni al repositorio.
- Inventario: PostgreSQL como fuente de verdad; Shopify no se utiliza como inventario físico real.
- Historial mensual: vista PostgreSQL `monthly_sales_detail` con `security_invoker` y acceso solo autenticado.
- `localStorage` se conserva únicamente como compatibilidad/cache para módulos heredados mientras se consolida el frontend.

## Reglas críticas

- No reservar inventario al recibir una venta; reservar únicamente cuando se confirma.
- No confirmar si no existe stock exacto suficiente para toda la orden en una sola bodega.
- Una venta solo puede pertenecer a un corte de despacho.
- Un corte solo admite ventas confirmadas con reserva completa.
- El stock físico se descuenta al despachar y se restaura únicamente al recibir físicamente una devolución.
- Nunca inventar IDs externos de Hoko/LogiGho.
- No subir credenciales, tokens, service-role keys ni secretos al repositorio.

## Pendientes externos

- Integración directa con API de Hoko: Hoko confirma públicamente que dispone de API de integración, pero para producción se requieren los endpoints/documentación técnica vigentes y credenciales de la cuenta. No se deben inferir endpoints.
- LogiGho: los IDs de producto están cargados y el MASSIVE está preparado, pero falta cargar el catálogo oficial de códigos de ciudad/destino para automatizar ese campo.
- Supabase Auth: activar Leaked Password Protection desde la configuración del proyecto; el conector actual no expone esa mutación administrativa.

## Operación

URL: https://samuelacuna12.github.io/invicto-ops/
