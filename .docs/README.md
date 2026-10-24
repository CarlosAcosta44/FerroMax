# Documentación del Proyecto: FerroMax (Demo Telar Web)

Bienvenido a la carpeta de especificaciones y documentación técnica de **FerroMax**, la demo de **Telar Web** sobre una ferretería tradicional común de barrio con catálogo de productos, inventario en tiempo real y portal de pagos.

---

## Índice de Documentos

1. [**`context.md`**](./context.md):
   - **Visión General y Estratégica**: Planteamiento del problema para la ferretería y para el comprador habitual.
   - **Público Objetivo**: Clientes de la ferretería común (trabajadores independientes locales: plomeros, electricistas, pintores, y vecinos para arreglos en el hogar y bricolaje).
   - **Propuesta de Valor & Flujo de Demostración**: User journey del cliente, valor para el portafolio comercial de Telar Web.

2. [**`architecture.md`**](./architecture.md):
   - **Clean Architecture**: Estructura de capas concéntricas (`domain`, `application`, `infrastructure`, `presentation`).
   - **Stack Tecnológico**: Next.js (App Router, Server Components y Server Actions), React 19, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL + Realtime).
   - **Estrategias Técnicas**: Sincronización en tiempo real vía WebSockets, prevención de sobreventa y revalidación de caché.

3. [**`database.md`**](./database.md):
   - **Diagrama Entidad-Relación (ERD)**: Modelo relacional completo.
   - **Esquema SQL (DDL)**: Tablas `categories`, `products`, `customers`, `orders`, `order_items` y `payments`.
   - **Disparadores y Funciones Atómicas**: Descuento automático de inventario con bloqueo transaccional.
   - **Políticas de Seguridad (RLS)**: Reglas de acceso granular para usuarios anónimos y administradores.

4. [**`planning.md`**](./planning.md):
   - **Mapa del Sitio & Vistas**: Landing Page, Catálogo Interactivo, Ficha Técnica, Carrito, Checkout, Portal de Historial y Panel Admin.
   - **Diseño de Interfaz**: Componentes visuales, semáforo de inventario y generador de recibos.
   - **Roadmap por Fases**: Plan de desarrollo estructurado de la Fase 1 a la Fase 4.

5. [**`business_rules.md`**](./business_rules.md):
   - **Control de Inventario**: Umbrales de stock crítico, límites por carrito y concurrencia.
   - **Modalidades de Venta y Entrega**: Políticas de *Click & Collect* (Retiro en Mostrador en 30 min) y Despachos locales.
   - **Máquina de Estados de la Orden**: Transiciones desde `pending_payment` hasta `delivered`.
   - **Integración WhatsApp First**: Plantillas de enlaces contextuales pre-cargados para asistencia y ventas directas.
