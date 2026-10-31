# Documentación del Sistema Administrativo y Operativo (FerroMax)

Este documento resume la arquitectura, flujo de datos, integración con Supabase y lógica de negocio implementada en el panel de administración (`/admin`) y seguimiento de órdenes (`/historial`).

---

## 1. Arquitectura General y Modularización

El panel administrativo (`src/app/admin/page.tsx`) fue refactorizado para separar responsabilidades en componentes modulares alojados en `src/presentation/components/admin/`:

1. **`AdminDashboardTab.tsx` (Panel Principal y Resumen Operativo):**
   * Visualización de métricas en tiempo real: Ventas del día, pedidos pendientes, cartera de clientes con crédito activo, valor total del inventario y alertas de stock crítico.
   * Vista rápida de últimos pedidos y productos en umbral mínimo.
   * La tabla del panel principal funciona en modo de solo lectura para evitar desincronizaciones accidentales.

2. **`AdminInventoryTab.tsx` (Gestión de Inventario y Catálogo):**
   * Paginación en cliente a 10 productos por página con navegación (*Anterior / Siguiente* y números de página).
   * Tres modales interactivos:
     * **Ficha Técnica Detallada (<Eye>):** Muestra especificaciones completas, pasillo, stock, precio, categoría, SKU y estado.
     * **Editar Producto (<Edit>):** Permite actualizar nombre, precio, stock, pasillo, unidad y categoría con guardado directo en Supabase mediante `editProductAction`.
     * **Eliminar Producto (<Trash2>):** Confirmación modal con manejo de integridad referencial (fallback a desactivación si tiene pedidos asociados).
   * Se eliminó el botón redundante de guardado masivo y el icono de check innecesario.

3. **`AdminOrdersTab.tsx` (Despachos y Seguimiento de Pedidos):**
   * Filtro por estados: *Pendiente*, *En Preparación*, *Listo para Retiro*, *Entregado*, *Cancelado*.
   * Actualización instantánea de estado conectada a `updateOrderStatusAction` y persistida en Supabase.
   * Detalle de cada ítem, cliente, teléfono, canal de venta (Web / Mostrador POS) y código PIN de entrega.

4. **`AdminCustomersTab.tsx` (Clientes, Créditos y Fiados):**
   * Consulta de saldo pendiente de cobro y límite de crédito por cliente.
   * Registro modal de abonos en efectivo conectado a `registerCustomerAbonoAction`.
   * Historial de transacciones de cartera y compras asociadas.

5. **`AdminPosTab.tsx` (Punto de Venta / Ventas Mostrador):**
   * Carrito rápido con atajos de búsqueda de productos por nombre, SKU o pasillo.
   * Descuento automático (5%) para clientes frecuentes seleccionados.
   * **Billetes Rápidos (Pesos Colombianos - COP):**
     * Botones directos: `Exacto`, `$10k`, `$20k`, `$50k`, `$100k`.
     * Fila de acumulación: `+$10k`, `+$20k`, `+$50k` y `Limpiar`.
     * Campo numérico editable con formato en pesos colombianos.
     * Alerta visual de vuelto a entregar (verde) o monto insuficiente faltante (ámbar).
     * Validación obligatoria de dinero recibido antes de emitir la venta.
   * Emisión de orden mediante `createPosSaleAction` conectada inmediatamente con el estado global.

6. **`AdminCashTab.tsx` (Cierre de Caja y Arqueo Físico):**
   * **Conexión en vivo con el POS:** Recibe las órdenes reales del día. Solo las ventas cobradas en método `efectivo` incrementan el *Efectivo Esperado en Gaveta* (`Base Inicial + Ventas Efectivo Hoy`).
   * Desglose separado para conciliar Datáfono (Tarjetas), Pagos QR (Nequi / Bancolombia / PSE) y Cuentas por Cobrar (Fiado).
   * **Denominaciones Oficiales de Colombia:**
     * **Billetes:** $100.000, $50.000, $20.000, $10.000, $5.000, $2.000.
     * **Monedas:** $1.000 (bicolor), $500 (bicolor), $200 (dorada), $100 (plateada), $50 (pequeña).
   * Conteo directo mediante inputs numéricos o botones `+` / `-`.
   * Cálculo en tiempo real de Subtotal Billetes, Subtotal Monedas y Diferencia (Cuadrada, Sobrante o Faltante). Guardado en tabla `cash_shifts`.

---

## 2. Server Actions y Capa de Datos

Ubicados en `src/app/actions/`:
* `inventoryActions.ts`:
  * `editProductAction`: Valida y actualiza precios, stock y atributos del producto en Supabase.
  * `deleteProductAction`: Elimina o marca como inactivo el producto manteniendo integridad referencial.
* `posActions.ts`:
  * `createPosSaleAction`: Crea la cabecera en `orders` y los detalles en `order_items`, descuenta stock y registra cliente regular si aplica.
* `customerActions.ts`:
  * `registerCustomerAbonoAction`: Registra abonos y disminuye el saldo adeudado en `customers` y `customer_credits`.
* `orderActions.ts`:
  * `updateOrderStatusAction`: Modifica el ciclo de vida del pedido (`orders.status`).

---

## 3. Repositorios de Infraestructura

* `src/infrastructure/repositories/SupabaseAdminRepository.ts`:
  * Operaciones directas a Supabase con aislamiento seguro de credenciales (`anon key` en cliente / fallback seguro).
  * Métodos: `getDashboardMetrics`, `getOrders`, `getProducts`, `getCustomers`, `getCashShift`, `updateProduct`, `saveCashCount`.
* `src/infrastructure/repositories/SupabaseOrderRepository.ts`:
  * Consulta de pedidos para clientes públicos en `/historial` mediante PIN de entrega, número de orden (`FM-XXXX-XXX`) o celular.

---

## 4. Script de Datos Sintéticos

* `scripts/seed-synthetic-data.mjs`:
  * Script ejecutable con `node scripts/seed-synthetic-data.mjs` para poblar la base de datos Supabase con clientes colombianos típicos (Don Carlos, Doña Martha, etc.), inventario de ferretería con stock balanceado, órdenes recientes y turnos de caja para pruebas.
