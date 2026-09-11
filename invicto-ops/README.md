# INVICTO OPS

Centro de operaciones de Universo Invicto.

## Estado actual

MVP operativo desplegable en GitHub Pages. La versión actual usa almacenamiento local del navegador para validar el flujo antes de conectar Supabase.

Incluye:
- Inicio de sesión de prueba.
- Dashboard principal y pendientes iniciales.
- Ventas del día y confirmación de pedidos.
- Surtidos automáticos y edición unidad por unidad.
- Importador de inventario Hoko, LogiGho y Bucaramanga.
- Reserva de stock al confirmar.
- Recuperación.
- Cortes y agrupación por bodega.
- Garantías.
- Novedades logísticas e importación por Excel.
- Dashboard de reportes.
- KPIs globales e individuales con control por rol.
- Panel INVICTO I.A. para alertas operativas.

## Seguridad

No se deben subir al repositorio credenciales, contraseñas reales, tokens de API ni datos sensibles de clientes. El acceso real, la base compartida y los inventarios persistentes se migrarán a Supabase Auth + PostgreSQL con RLS.

## Próxima fase

1. Crear proyecto Supabase.
2. Aplicar el esquema de base de datos.
3. Crear usuarios reales y permisos.
4. Migrar inventario inicial.
5. Reemplazar localStorage por Supabase.
6. Integrar Hoko API.
7. Integrar LogiGho cuando disponga de API.
