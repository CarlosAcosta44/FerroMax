# Documentación del Proyecto: FerroMax (Demo Telar Web)

Bienvenido a la carpeta de especificaciones y documentación técnica de **FerroMax** ("Tu Ferretería de Barrio"), la demo de **Telar Web** para el sector ferretero tradicional con catálogo de productos, inventario en tiempo real, portal de pagos, retiro en mostrador (Click & Collect) y panel de administración completo (POS, Inventario, Pedidos, Clientes Frecuentes).

> **Aclaración de Marca**: En los mockups preliminares de la carpeta `Designs/` aparecía como marcador de posición el nombre "El Maestro". **El nombre oficial, consistente y definitivo de la ferretería y de la plataforma es FERROMAX.**

---

## Índice de Documentos

1. [**`context.md`**](./context.md):
   - **Visión General y Estratégica**: Planteamiento del problema para la ferretería de Don Carlos y para el cliente del barrio.
   - **Público Objetivo**: Vecinos para arreglos del hogar, aficionados al bricolaje y trabajadores independientes locales (electricistas, plomeros, albañiles).
   - **User Journey y Flujo de Demostración**: Diagrama de secuencia con compra web, retiro en tienda en 30 minutos y notificación por WhatsApp.

2. [**`architecture.md`**](./architecture.md):
   - **Clean Architecture**: Estructura de capas concéntricas (`domain`, `application`, `infrastructure`, `presentation`).
   - **Stack Tecnológico**: Next.js 16.3.8 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL + Realtime).
   - **Estructura de Rutas**: Portal público y suite completa de administración (`/admin`, `/admin/inventario`, `/admin/ventas`, `/admin/pedidos`, `/admin/clientes`, `/admin/configuracion`).

3. [**`database.md`**](./database.md):
   - **Diagrama Entidad-Relación (ERD)**: Modelo relacional completo para web y mostrador.
   - **Esquema SQL (DDL)**: Tablas `categories`, `products`, `customers`, `orders`, `order_items` y `payments`.
   - **Disparadores y Transacciones**: Descuento automático de inventario con bloqueo transaccional (`FOR UPDATE`).
   - **Políticas de Seguridad (RLS)**: Reglas de acceso granular para clientes y para el ferretero.

4. [**`planning.md`**](./planning.md):
   - **Diseño UI/UX Basado en Maquetas**: Integración directa de las pantallas de `Designs/` (Inicio, Catálogo, Checkout, Panel Principal, Inventario, POS, Pedidos y Clientes).
   - **Tokens de Diseño**: Deep Slate (`#0F172A`), Industrial Orange (`#F97316`), Primary Canvas (`#F8FAFC`) e Inter / JetBrains Mono.
   - **Roadmap por Fases**: Plan de desarrollo estructurado de la Fase 1 a la Fase 4.

5. [**`business_rules.md`**](./business_rules.md):
   - **Control de Inventario**: Umbrales de stock crítico, límites por carrito y concurrencia.
   - **Modalidades de Entrega**: Políticas de *Click & Collect* (Retiro en Mostrador en 30 min) y Despachos locales.
   - **Máquina de Estados de la Orden**: Transiciones desde `pending_payment` hasta `delivered`.
   - **Integración WhatsApp First**: Plantillas de enlaces contextuales pre-cargados para asistencia y ventas directas.

6. [**`Designs/`**](./Designs/):
   - Maquetas exportadas en HTML y capturas de pantalla para cada vista de la plataforma y el panel de administración.
