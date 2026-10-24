# Arquitectura y Stack Tecnológico: FerroMax

Este documento especifica la arquitectura de software, patrones de diseño, estructura de rutas y conjunto de tecnologías adoptados para el desarrollo de la plataforma **FerroMax**. Se conservan y extienden las tecnologías y convenciones arquitectónicas implementadas con éxito en el ecosistema **Telar Web**.

> **Identidad de Marca**: En los paneles de administración, el sidebar y toda la interfaz portan el nombre y marca oficial **FERROMAX** ("Tu Ferretería de Barrio"), unificando el portal público con el espacio de gestión de Don Carlos.

---

## 1. Stack Tecnológico Base

| Componente | Tecnología | Versión / Justificación Técnica |
| :--- | :--- | :--- |
| **Framework Core** | [Next.js](https://nextjs.org/) (App Router) | Versión 16.3.8 con React 19. Aprovecha Server Components (RSC) para velocidad extrema y SEO del catálogo público, junto con Server Actions para mutaciones transaccionales y panel de control. |
| **Lenguaje de Programación** | TypeScript | Tipado estático riguroso (`strict: true`) en entidades de dominio, DTOs, casos de uso y contratos de bases de datos. |
| **Diseño y Estilos** | [Tailwind CSS v4](https://tailwindcss.com/) | Utilidades de alto rendimiento compiladas vía `@tailwindcss/postcss`. Paleta temática de ferretería industrial definida en `DESIGN.md`: Primary Canvas `#F8FAFC`, Deep Slate `#0F172A`, Industrial Orange `#F97316` y WhatsApp Green `#25D366`. |
| **Validación de Datos** | [Zod](https://zod.dev/) | Esquemas declarativos para validación de formularios de checkout, entradas de Server Actions, ventas POS y sanitización de payloads de pago. |
| **Backend-as-a-Service (BaaS)** | [Supabase](https://supabase.com/) | Base de datos relacional PostgreSQL 15+, autenticación nativa, almacenamiento de imágenes (Storage) y canales en tiempo real (WebSockets / Supabase Realtime) para sincronización de stock de mesón. |
| **Íconos e Interfaz** | Módulo SVG Nativo (`Icons.tsx`) | Componentes vectoriales optimizados en línea sin dependencias externas pesadas, asegurando carga instantánea y cero fallos por red. |
| **Generación de Comprobantes** | CSS Print / Recibo Digital QR | Plantilla de comprobante tipo recibo comercial lista para impresión o exportación digital directa con código QR de verificación. |
| **Despliegue y CI/CD** | Vercel & GitHub Actions | Despliegue continuo con previsualizaciones automáticas por rama (Gitflow: `develop` -> `release` -> `main`). |

---

## 2. Enfoque Arquitectónico: Clean Architecture Adaptada a Next.js

Para garantizar que el software sea testeable, mantenible, desacoplado de proveedores externos y fácil de evolucionar, se implementa una arquitectura en capas concéntricas con regla de dependencia estricta: las capas internas nunca dependen de las capas externas.

```
       +-------------------------------------------------------+
       |                  PRESENTACIÓN / APP                   |
       |     (Next.js App Router, RSC, Client Components,      |
       |     Server Actions, Tailwind UI, Admin FERROMAX)      |
       +-------------------------------------------------------+
                                  |
                                  v
       +-------------------------------------------------------+
       |               APLICACIÓN / CASOS DE USO               |
       |    (CreateOrder, UpdateStock, ProcessSalePOS,         |
       |        GetCatalog, DTOs, Reglas de Aplicación)        |
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
│   ├── layout.tsx                       # Layout raíz público (Navbar, Footer, CartProvider)
│   ├── page.tsx                         # Landing Page institucional (inicio_ferromax)
│   ├── catalogo/                        # Catálogo con inventario en tiempo real
│   │   ├── page.tsx                     # Vista de catálogo con alternancia Grid/Lista
│   │   └── [slug]/page.tsx              # Ficha técnica detallada del producto
│   ├── carrito/                         # Resumen del carrito de compras
│   │   └── page.tsx
│   ├── checkout/                        # Formulario de checkout y selección de retiro/envío
│   │   ├── page.tsx
│   │   └── confirmacion/page.tsx        # Pantalla de confirmación con comprobante y código QR
│   ├── historial/                       # Portal del cliente (consulta de órdenes y comprobantes)
│   │   └── page.tsx
│   ├── admin/                           # Panel de Administración de Don Carlos
│   │   ├── layout.tsx                   # Layout administrativo con Sidebar FERROMAX
│   │   ├── page.tsx                     # Panel Principal (KPIs diarios y actividad)
│   │   ├── inventario/page.tsx          # Inventario y Precios (Ajuste rápido +/- 1 clic)
│   │   ├── ventas/page.tsx              # Terminal de Ventas y Mostrador (POS)
│   │   ├── pedidos/page.tsx             # Pedidos y Retiro en Tienda (Click & Collect)
│   │   ├── clientes/page.tsx            # Directorio de Clientes Frecuentes
│   │   └── configuracion/page.tsx       # Configuración de Caja, Pagos y Tienda
│   └── actions/                         # Server Actions tipadas
│       ├── orderActions.ts              # Creación de orden y validación de stock
│       ├── paymentActions.ts            # Confirmación de pago y emisión de recibo
│       ├── posActions.ts                # Registro de ventas directas de mostrador
│       └── inventoryActions.ts          # Ajuste de existencias y actualización de precios
│
├── domain/                              # Capa de Dominio (Pura, sin dependencias externas)
│   ├── entities/                        # Modelos y entidades del negocio
│   │   ├── Product.ts                   # Entidad Producto con reglas de stock
│   │   ├── Category.ts                  # Entidad Categoría
│   │   ├── Customer.ts                  # Entidad Cliente Frecuente / Comprador
│   │   ├── Order.ts                     # Entidad Orden de Compra (Web y Mostrador)
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
│   │   ├── ProcessPayment.ts            # Aprobación de pago y descuento de inventario
│   │   ├── UpdateProductStock.ts        # Ajuste de unidades en almacén (+/- 1 clic)
│   │   ├── RecordPosSale.ts             # Venta rápida de mostrador en caja
│   │   ├── GetCustomerOrderHistory.ts   # Búsqueda de órdenes por email/teléfono
│   │   └── GetLowStockAlerts.ts         # Productos por debajo del umbral mínimo (< 5 uds)
│   └── dtos/                            # Objetos de Transferencia de Datos y esquemas Zod
│       ├── OrderDTO.ts
│       ├── ProductDTO.ts
│       ├── PosSaleDTO.ts
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
│       └── ReceiptGenerator.ts          # Generador de plantilla de comprobante con QR
│
└── presentation/                        # Capa de Presentación (UI y Componentes)
    ├── components/
    │   ├── common/                      # Header, Footer, Icons, Badges, Modales
    │   ├── catalog/                     # ProductCard, ProductGrid, ProductList, Filters
    │   ├── cart/                        # CartDrawer, CartItemRow, CartSummary
    │   ├── checkout/                    # CheckoutForm, PickupSelector, PaymentSelector
    │   ├── receipts/                    # PrintableReceipt, OrderStatusBadge
    │   └── admin/                       # AdminSidebar (FERROMAX), StockModifierRow, PosTerminal, OrdersBoard
    ├── context/                         # Estado de cliente (CartContext)
    └── hooks/                           # Hooks reutilizables (useCart, useRealtimeStock)
```

---

## 4. Patrones de Diseño y Estrategias Técnicas

### 4.1. Server Actions como Controladores de Entrada
Las mutaciones críticas (creación de orden, venta POS, ajuste de stock) utilizan **Server Actions** de Next.js ejecutadas en el servidor:
- Eliminación de sobrecarga de endpoints REST intermedios.
- Seguridad de credenciales privileged (`SUPABASE_SERVICE_ROLE_KEY`) exclusivamente en el servidor.
- Revalidación automática de rutas (`revalidatePath('/catalogo')` y `revalidatePath('/admin/inventario')`) tras modificar datos.

### 4.2. Sincronización de Inventario en Tiempo Real (Supabase Realtime)
Para garantizar que el stock mostrado en la web y el mostrador sea idéntico:
1. El catálogo público y la terminal POS del admin suscriben un hook de React (`useRealtimeStock`) a los eventos `UPDATE` de la tabla `products` vía WebSockets.
2. Cada vez que Don Carlos ajusta el stock con los botones `+1` / `-1` o se aprueba una venta web, Supabase emite un evento que actualiza los badges de existencias de inmediato en todos los dispositivos conectados.

### 4.3. Consistencia Transaccional y Control de Concurrencia
Para evitar sobreventa (*overselling*) de materiales con pocas unidades:
- Las transacciones críticas ejecutan la función transaccional `process_order_checkout` en PostgreSQL con bloqueo de fila (`SELECT stock_quantity FROM products WHERE id = $1 FOR UPDATE`).
- Si las unidades disponibles son menores a las requeridas, la transacción se aborta con rollback atómico y el usuario recibe el aviso informativo correspondiente.
