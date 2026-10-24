# Arquitectura y Stack Tecnológico: FerroMax

Este documento especifica la arquitectura de software, patrones de diseño y conjunto de tecnologías adoptados para el desarrollo de la plataforma **FerroMax**. Se conservan y extienden las tecnologías y convenciones arquitectónicas implementadas con éxito en el ecosistema **Telar Web**.

---

## 1. Stack Tecnológico Base

| Componente | Tecnología | Versión / Justificación Técnica |
| :--- | :--- | :--- |
| **Framework Core** | [Next.js](https://nextjs.org/) (App Router) | Versión 15/16 con React 19. Aprovecha Server Components (RSC) para renderizado ultrarrápido y SEO del catálogo, junto con Server Actions para mutaciones seguras. |
| **Lenguaje de Programación** | TypeScript | Tipado estático riguroso (`strict: true`) en entidades de dominio, DTOs, casos de uso y contratos de bases de datos. |
| **Diseño y Estilos** | [Tailwind CSS v4](https://tailwindcss.com/) | Utilidades de alto rendimiento compiladas vía `@tailwindcss/postcss`. Paleta temática de ferretería industrial (tonos grafito/carbón, acentos en naranja mecánico `#F97316` y amarillo ámbar, y feedback verde esmeralda para stock disponible). |
| **Validación de Datos** | [Zod](https://zod.dev/) | Esquemas declarativos para validación de formularios de checkout, entradas de Server Actions y sanitización de payloads de pago. |
| **Backend-as-a-Service (BaaS)** | [Supabase](https://supabase.com/) | Base de datos relacional PostgreSQL 15+, autenticación nativa, almacenamiento de imágenes (Storage) y canales en tiempo real (WebSockets / Supabase Realtime) para sincronización de stock. |
| **Íconos e Interfaz** | Lucide React | Paquete de iconografía técnica coherente para herramientas, estados de orden y elementos de UI. |
| **Generación de Comprobantes** | Impresión Web CSS / HTML2Canvas | Plantilla de comprobante tipo recibo térmico/factura comercial lista para impresión o exportación digital directa. |
| **Despliegue y CI/CD** | Vercel & GitHub Actions | Despliegue continuo con previsualizaciones automáticas por rama (Gitflow: `develop` -> `release` -> `main`). |

---

## 2. Enfoque Arquitectónico: Clean Architecture Adaptada a Next.js

Para garantizar que el software sea testeable, mantenible, desacoplado de proveedores externos y fácil de evolucionar, se implementa una arquitectura en capas concéntricas con regla de dependencia estricta: las capas internas nunca dependen de las capas externas.

```
       +-------------------------------------------------------+
       |                  PRESENTACIÓN / APP                   |
       |     (Next.js App Router, RSC, Client Components,      |
       |              Server Actions, Tailwind UI)             |
       +-------------------------------------------------------+
                                  |
                                  v
       +-------------------------------------------------------+
       |               APLICACIÓN / CASOS DE USO               |
       |    (CreateOrder, UpdateStock, GetCatalog, DTOs,       |
       |                 Reglas de Aplicación)                 |
       +-------------------------------------------------------+
                                  |
                                  v
       +-------------------------------------------------------+
       |                   DOMINIO (CORE)                      |
       |   (Entidades: Product, Order, Customer, Payment;      |
       |             Interfaces de Repositorios)               |
       +-------------------------------------------------------+
                                  ^
                                  | (Implementa)
       +-------------------------------------------------------+
       |                    INFRAESTRUCTURA                    |
       |   (Supabase Repositories, Clientes DB, Storage,       |
       |             Gateways de Pago, WhatsApp API)           |
       +-------------------------------------------------------+
```

---

## 3. Estructura de Directorios (`src/`)

```
src/
├── app/                                 # Capa de Enrutamiento y Server Actions (Next.js)
│   ├── layout.tsx                       # Layout raíz (Navbar, Footer, Providers)
│   ├── page.tsx                         # Landing Page institucional
│   ├── catalogo/                        # Vistas de catálogo y detalle
│   │   ├── page.tsx                     # Listado de productos con filtros
│   │   └── [slug]/page.tsx              # Ficha detallada de producto
│   ├── carrito/                         # Resumen del carrito de compras
│   │   └── page.tsx
│   ├── checkout/                        # Formulario de checkout y pago
│   │   ├── page.tsx
│   │   └── confirmacion/page.tsx        # Pantalla de éxito y recibo
│   ├── historial/                       # Portal del cliente (consulta de órdenes)
│   │   └── page.tsx
│   ├── admin/                           # Panel simple de administración
│   │   ├── layout.tsx                   # Layout con protección de sesión/admin
│   │   ├── page.tsx                     # Dashboard de stock y órdenes
│   │   └── inventario/page.tsx          # Gestión directa de existencias y precios
│   └── actions/                         # Server Actions tipadas
│       ├── orderActions.ts              # Creación de orden y validación de stock
│       ├── paymentActions.ts            # Confirmación de pago y emisión de recibo
│       └── inventoryActions.ts          # Ajuste de existencias y actualización de precios
│
├── domain/                              # Capa de Dominio (Pura, sin dependencias externas)
│   ├── entities/                        # Modelos y entidades del negocio
│   │   ├── Product.ts                   # Entidad Producto con reglas de stock
│   │   ├── Category.ts                  # Entidad Categoría
│   │   ├── Customer.ts                  # Entidad Cliente/Comprador
│   │   ├── Order.ts                     # Entidad Orden de Compra y estados
│   │   ├── OrderItem.ts                 # Ítem individual dentro de una orden
│   │   └── Payment.ts                   # Registro de transacción y estado
│   └── repositories/                    # Contratos e Interfaces de persistencia
│       ├── IProductRepository.ts
│       ├── ICategoryRepository.ts
│       ├── IOrderRepository.ts
│       ├── ICustomerRepository.ts
│       └── IPaymentRepository.ts
│
├── application/                         # Capa de Casos de Uso (Lógica de Negocio)
│   ├── use-cases/
│   │   ├── GetCatalogProducts.ts        # Consulta filtrada del catálogo
│   │   ├── GetProductBySlug.ts          # Consulta de ficha técnica
│   │   ├── CreateOrder.ts               # Validación de stock y generación de pedido
│   │   ├── ProcessPayment.ts            # Aprobación de pago y reserva de inventario
│   │   ├── UpdateProductStock.ts        # Ajuste de unidades en almacén
│   │   ├── GetCustomerOrderHistory.ts   # Búsqueda de órdenes por email/teléfono
│   │   └── GetLowStockAlerts.ts         # Productos por debajo del umbral mínimo
│   └── dtos/                            # Objetos de Transferencia de Datos y esquemas Zod
│       ├── OrderDTO.ts
│       ├── ProductDTO.ts
│       └── PaymentDTO.ts
│
├── infrastructure/                      # Capa de Infraestructura (Servicios Externos)
│   ├── db/
│   │   └── supabaseClient.ts            # Cliente Supabase anónimo y cliente Service Role
│   ├── repositories/                    # Implementación de los repositorios de Dominio
│   │   ├── SupabaseProductRepository.ts
│   │   ├── SupabaseCategoryRepository.ts
│   │   ├── SupabaseOrderRepository.ts
│   │   ├── SupabaseCustomerRepository.ts
│   │   └── SupabasePaymentRepository.ts
│   └── services/                        # Adaptadores y librerías externas
│       ├── WhatsAppService.ts           # Constructor de deep links para WhatsApp
│       ├── PaymentGatewayMock.ts        # Simulación de pasarela segura (PSE / Tarjeta)
│       └── ReceiptGenerator.ts          # Generador de plantilla de comprobante
│
└── presentation/                        # Capa de Presentación (UI y Componentes)
    ├── components/
    │   ├── common/                      # Header, Navbar, Footer, Modal, Badges
    │   ├── catalog/                     # ProductCard, ProductGrid, Filters, SearchBar
    │   ├── cart/                        # CartDrawer, CartItemRow, CartSummary
    │   ├── checkout/                    # CheckoutForm, PaymentMethodSelector
    │   ├── receipts/                    # PrintableReceipt, OrderStatusBadge
    │   └── admin/                       # StockModifierRow, LowStockAlertBanner, OrderTable
    ├── context/                         # Estado de cliente (ej. CartContext)
    └── hooks/                           # Hooks reutilizables (useCart, useRealtimeStock)
```

---

## 4. Patrones de Diseño y Estrategias Técnicas

### 4.1. Server Actions como Controladores de Entrada
En lugar de depender de endpoints tradicionales REST (`/api/*`), las mutaciones críticas utilizan **Server Actions** de Next.js ejecutadas en el servidor. Esto ofrece:
- Eliminación de sobrecarga de serialización HTTP innecesaria.
- Ejecución segura con acceso a credenciales privilegiadas (`SUPABASE_SERVICE_ROLE_KEY`) que nunca viajan al cliente.
- Revalidación automática de rutas (`revalidatePath('/catalogo')` y `revalidatePath('/admin')`) tras mutar datos.

### 4.2. Sincronización de Inventario en Tiempo Real (Supabase Realtime)
Para evitar que dos clientes compren la última broca o el último galón de pintura simultáneamente:
1. Las pantallas de catálogo y detalle suscriben un hook de React (`useRealtimeStock`) a los cambios en la tabla `products` de Supabase a través de WebSockets.
2. Cuando el dueño modifica el inventario en el panel o se completa una compra, Supabase emite un evento `UPDATE` que refresca instantáneamente los badges de stock en los navegadores de todos los compradores conectados sin necesidad de recargar la página.

### 4.3. Consistencia Transaccional y Control de Concurrencia
Para prevenir el problema de sobreventa (*overselling*):
- La base de datos PostgreSQL implementa una función transaccional `process_order_checkout` que verifica que `stock_quantity >= requested_quantity` antes de crear los registros de `order_items` y decrementar el inventario dentro de una misma transacción ACID con bloqueo de fila (`SELECT ... FOR UPDATE`).
- Si el stock es insuficiente, la transacción aborta y el Server Action retorna un error descriptivo al usuario: *"Uno de los productos seleccionados acaba de agotarse"*.

---

## 5. Estrategia de Renderizado (RSC + Client Islands)
- **Páginas Públicas (Landing & Catálogo)**: Se renderizan en el servidor como React Server Components (RSC) para máxima velocidad de carga (LCP < 1.2s), excelente SEO y consumo mínimo de JavaScript en dispositivos móviles de gama baja.
- **Islas de Interactividad**:
  - Buscador predictivo y selector de filtros (`'use client'`).
  - Drawer del carrito y botón flotante de WhatsApp (`'use client'`).
  - Pasarela interactiva de pago y simulación (`'use client'`).
  - Botones de ajuste de stock rápido en el panel admin (`'use client'`).
