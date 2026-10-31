'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Clock,
  ShieldCheck,
  User,
  ArrowRight,
  Phone,
  Search,
  CheckCircle,
  Package,
  MapPin,
  AlertCircle,
  QrCode,
} from '@/presentation/components/common/Icons';
import { useAuth } from '@/presentation/context/AuthContext';
import { SupabaseOrderRepository, OrderWithItems } from '@/infrastructure/repositories/SupabaseOrderRepository';

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; desc: string }
> = {
  pending_payment: {
    label: 'Pendiente de Pago',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    desc: 'Esperando confirmación del pago para alistar materiales.',
  },
  paid: {
    label: 'Pago Confirmado',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    desc: 'Tu pago fue aprobado exitosamente. Pasando a bodega.',
  },
  preparing: {
    label: 'En Preparación en Bodega',
    badgeClass: 'bg-orange-100 text-[#EA580C] border-orange-200',
    desc: 'Don Carlos y el equipo están empacando tus herramientas.',
  },
  ready_for_pickup: {
    label: 'Listo para Retiro en Mesón',
    badgeClass: 'bg-[#DCFCE7] text-[#15803D] border-emerald-200',
    desc: '¡Tu pedido ya está empacado en el mostrador! Pasa a recogerlo.',
  },
  delivered: {
    label: 'Entregado',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'Pedido entregado a satisfacción.',
  },
  cancelled: {
    label: 'Cancelado',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    desc: 'Este pedido fue cancelado.',
  },
};

export default function HistorialPage() {
  const { user, profile, role, isLoading: isAuthLoading } = useAuth();
  const [orderQuery, setOrderQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OrderWithItems[] | null>(null);
  const [userOrders, setUserOrders] = useState<OrderWithItems[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingUserOrders, setIsLoadingUserOrders] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const orderRepo = React.useMemo(() => new SupabaseOrderRepository(), []);

  // Fetch logged user orders
  const loadUserOrders = useCallback(async (email: string) => {
    setIsLoadingUserOrders(true);
    try {
      const orders = await orderRepo.findByCustomerEmail(email);
      setUserOrders(orders);
    } catch (err) {
      console.error('Error cargando pedidos del cliente:', err);
    } finally {
      setIsLoadingUserOrders(false);
    }
  }, [orderRepo]);

  useEffect(() => {
    if (user?.email) {
      loadUserOrders(user.email);
    } else {
      setUserOrders([]);
    }
  }, [user?.email, loadUserOrders]);

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = orderQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await orderRepo.searchOrders(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Error buscando orden en Supabase:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-3 border-[#F97316] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Cargando pedidos de FerroMax...</p>
        </div>
      </div>
    );
  }

  const renderOrderCard = (order: OrderWithItems) => {
    const statusInfo = STATUS_CONFIG[order.status] || {
      label: order.status,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      desc: '',
    };

    const isPickup = order.deliveryType === 'pickup';

    return (
      <div
        key={order.id}
        className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs transition hover:shadow-sm"
      >
        {/* Encabezado de la Orden */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-slate-900">
                #{order.orderNumber}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">{formatDate(order.createdAt)}</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Cliente: <span className="font-medium text-slate-800">{order.customerName}</span>
              {order.customerPhone && (
                <span className="text-slate-400"> ({order.customerPhone})</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}
            >
              {order.status === 'ready_for_pickup' && <CheckCircle className="h-3.5 w-3.5" />}
              {statusInfo.label}
            </span>

            {isPickup && order.pickupPin && (
              <span className="bg-slate-900 text-white font-mono font-bold text-xs px-2.5 py-1 rounded flex items-center gap-1.5 shadow-xs">
                <span>PIN:</span>
                <span className="tracking-wider text-orange-400">{order.pickupPin}</span>
              </span>
            )}
          </div>
        </div>

        {/* Modalidad de Entrega */}
        <div className="mt-3 py-2 px-3 bg-slate-50 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#F97316] shrink-0" />
            <span className="text-slate-700">
              {isPickup ? (
                <>
                  <strong className="text-slate-900">Retiro en Mostrador:</strong> FerroMax Calle Principal #45-12
                </>
              ) : (
                <>
                  <strong className="text-slate-900">Despacho a Domicilio:</strong>{' '}
                  {order.deliveryAddress || 'Dirección acordada'}
                </>
              )}
            </span>
          </div>
          <span className="text-slate-500 capitalize text-[11px]">
            Método: <strong>{order.paymentMethod || 'Efectivo'}</strong>
          </span>
        </div>

        {/* Lista de Productos Reales */}
        <div className="mt-3.5 space-y-2 text-xs text-slate-700">
          {order.items && order.items.length > 0 ? (
            order.items.map((it) => (
              <div key={it.id} className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                    {it.quantity}x
                  </span>
                  <span>{it.productName}</span>
                  {it.productSku && (
                    <span className="text-[10px] font-mono text-slate-400">({it.productSku})</span>
                  )}
                </div>
                <span className="font-semibold text-slate-900">
                  ${(it.subtotalCop || it.unitPriceCop * it.quantity).toLocaleString('es-CO')} COP
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">Suministros y materiales ferreteros</p>
          )}

          {/* Resumen Total */}
          <div className="border-t border-slate-200 pt-2.5 mt-2 flex justify-between items-center text-sm font-bold text-slate-900">
            <span>Total Facturado:</span>
            <span className="text-base text-[#EA580C]">
              ${order.totalCop.toLocaleString('es-CO')} COP
            </span>
          </div>
        </div>

        {/* Mensaje de Asistencia */}
        {order.status === 'ready_for_pickup' && (
          <div className="mt-3.5 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-800 flex items-center justify-between gap-2">
            <span>
              💡 Acércate a nuestro mostrador y presenta tu PIN <strong>{order.pickupPin}</strong> para entrega inmediata sin filas.
            </span>
            <a
              href={`https://wa.me/573001234567?text=Hola%20FerroMax,%20voy%20en%20camino%20a%20recoger%20mi%20pedido%20%23${order.orderNumber}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 bg-[#25D366] text-white px-2.5 py-1 rounded text-[11px] font-bold hover:bg-emerald-600 shrink-0"
            >
              <Phone className="h-3 w-3" />
              <span>Avisar por WhatsApp</span>
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[85vh] bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Encabezado de la Vista */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F97316] uppercase tracking-wider mb-1">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Mis Pedidos y Retiro en Mesón</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Historial de Compras y Comprobantes
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulta el estado de tu orden en tiempo real para retirar en 30 minutos o seguimiento de entrega.
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-2.5 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                {profile?.fullName?.slice(0, 2).toUpperCase() || 'CL'}
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900 truncate">{profile?.fullName || user.email}</p>
                <p className="text-[10px] text-slate-400 capitalize">{role || 'Cliente'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Banner para usuarios no autenticados */}
        {!user && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold">¿Tienes una cuenta en FerroMax?</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-lg">
                Inicia sesión para sincronizar automáticamente todas tus compras, historial de compras de mostrador y facturas oficiales.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="bg-[#F97316] hover:bg-[#EA580C] text-white px-4 py-2 rounded text-xs font-semibold transition"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                className="border border-slate-500 hover:bg-slate-700 text-white px-4 py-2 rounded text-xs font-semibold transition"
              >
                Registrarme
              </Link>
            </div>
          </div>
        )}

        {/* Buscador de Orden en Vivo */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">
            Buscar pedido por número de comprobante, teléfono o correo
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Ingresa tu código de orden (ej. <code className="font-mono text-[#F97316]">FM-2025-001</code>) o tu teléfono celular de contacto.
          </p>

          <form onSubmit={handleSearchOrder} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="Ej. FM-2025-001 o 300 123 4567..."
                className="w-full rounded bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#F97316] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white px-4 py-2 rounded text-xs font-semibold transition shrink-0 flex items-center gap-1.5"
            >
              {isSearching ? (
                <>
                  <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <span>Consultar</span>
              )}
            </button>
          </form>

          {/* Resultados de Búsqueda Manual */}
          {hasSearched && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Resultados de búsqueda ({searchResults?.length || 0})
                </h3>
                <button
                  onClick={() => {
                    setSearchResults(null);
                    setHasSearched(false);
                    setOrderQuery('');
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                >
                  Limpiar búsqueda
                </button>
              </div>

              {searchResults && searchResults.length > 0 ? (
                searchResults.map(renderOrderCard)
              ) : (
                <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                  <AlertCircle className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    No encontramos ningún pedido con el criterio &quot;{orderQuery}&quot;.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Verifica que el número coincida exactamente con el de tu comprobante o consulta con Don Carlos por WhatsApp.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sección de Pedidos Vinculados al Usuario Logueado */}
        {user && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-[#F97316]" />
                <span>Mis Compras Registradas ({userOrders.length})</span>
              </h2>
              {isLoadingUserOrders && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <div className="h-2.5 w-2.5 rounded-full border-2 border-[#F97316] border-t-transparent animate-spin" />
                  Actualizando...
                </span>
              )}
            </div>

            {userOrders.length > 0 ? (
              <div className="space-y-4">{userOrders.map(renderOrderCard)}</div>
            ) : !isLoadingUserOrders ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                <ShoppingBag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Aún no tienes compras asociadas a tu cuenta.</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Cuando realices un pedido en el catálogo o compres en el mostrador dando tu correo, aparecerán listadas aquí con su comprobante.
                </p>
                <Link
                  href="/catalogo"
                  className="mt-4 inline-flex items-center gap-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white px-4 py-2 rounded text-xs font-bold transition shadow-xs"
                >
                  <span>Explorar el Catálogo</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : null}
          </div>
        )}

        {/* Enlace al Catálogo */}
        <div className="text-center pt-2">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] hover:underline"
          >
            <span>Ir al Catálogo e Inventario en Tiempo Real</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
