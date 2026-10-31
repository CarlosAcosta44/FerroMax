'use client';

import React, { useState, useRef, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Store,
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Search,
} from '@/presentation/components/common/Icons';
import { useAuth } from '@/presentation/context/AuthContext';
import {
  SupabaseAdminRepository,
  AdminProduct,
  AdminCustomer,
  AdminOrder,
  CashShift,
} from '@/infrastructure/repositories/SupabaseAdminRepository';

// Server Actions
import { updateStockAction, updatePriceAction } from '@/app/actions/inventoryActions';
import { updateOrderStatusAction } from '@/app/actions/orderActions';

// Tab Components
import { AdminDashboardTab } from '@/presentation/components/admin/AdminDashboardTab';
import { AdminInventoryTab } from '@/presentation/components/admin/AdminInventoryTab';
import { AdminPosTab } from '@/presentation/components/admin/AdminPosTab';
import { AdminOrdersTab } from '@/presentation/components/admin/AdminOrdersTab';
import { AdminCustomersTab } from '@/presentation/components/admin/AdminCustomersTab';
import { AdminCashTab } from '@/presentation/components/admin/AdminCashTab';

type AdminTab = 'dashboard' | 'inventory' | 'pos' | 'orders' | 'customers' | 'cash';

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, role, isLoading: isAuthLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const adminRepo = useMemo(() => SupabaseAdminRepository.getInstance(), []);

  // Real Database States
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [cashShift, setCashShift] = useState<CashShift | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real data from Supabase
  const loadRealData = async () => {
    setIsDataLoading(true);
    try {
      const [prods, custs, ords, shift] = await Promise.all([
        adminRepo.getProducts(),
        adminRepo.getCustomers(),
        adminRepo.getOrders(),
        adminRepo.getCashShift(),
      ]);
      setProducts(prods);
      setCustomers(custs);
      setOrders(ords);
      setCashShift(shift);
    } catch (err) {
      console.error('Error fetching Supabase admin data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, [adminRepo]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    await signOut();
    router.push('/');
  };

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'FM';
  };

  // -----------------------------------------------------------------
  // INVENTORY SERVER ACTION HANDLERS
  // -----------------------------------------------------------------
  const handleAdjustStock = async (id: string, delta: number) => {
    const item = products.find((p) => p.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock_quantity + delta);
    const newStatus: 'ok' | 'low' | 'out' =
      newStock === 0 ? 'out' : newStock <= item.min_stock ? 'low' : 'ok';

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock_quantity: newStock, status: newStatus } : p))
    );

    startTransition(async () => {
      const res = await updateStockAction({ productId: id, delta });
      if (res.success) {
        showToast(`Stock actualizado: ${item.name} (${newStock} unidades)`);
      } else {
        // Fallback to direct client repo if needed
        await adminRepo.updateProduct(id, { stock_quantity: newStock });
        showToast(`Stock actualizado: ${item.name} (${newStock} unidades)`);
      }
    });
  };

  const handleUpdatePrice = async (id: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price_cop: newPrice } : p))
    );

    startTransition(async () => {
      const res = await updatePriceAction({ productId: id, newPriceCop: newPrice });
      if (res.success) {
        showToast('Precio de venta actualizado en base de datos');
      } else {
        await adminRepo.updateProduct(id, { price_cop: newPrice });
        showToast('Precio de venta actualizado en base de datos');
      }
    });
  };

  // -----------------------------------------------------------------
  // ORDERS SERVER ACTION HANDLERS
  // -----------------------------------------------------------------
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: 'preparing' | 'ready_for_pickup' | 'delivered'
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

    startTransition(async () => {
      const res = await updateOrderStatusAction({ orderId, status });
      if (res.success) {
        showToast('Estado del pedido actualizado en base de datos');
      } else {
        await adminRepo.updateOrderStatus(orderId, status);
        showToast('Estado del pedido actualizado en base de datos');
      }
    });
  };

  // -----------------------------------------------------------------
  // POS SALE COMPLETED HANDLER
  // -----------------------------------------------------------------
  const handlePosSaleCompleted = (newOrder: AdminOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  // -----------------------------------------------------------------
  // CUSTOMER ABONO SUCCESS HANDLER
  // -----------------------------------------------------------------
  const handleCustomerAbonoSuccess = (customerId: string, newBalance: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, credit_balance_cop: newBalance } : c))
    );
  };

  // -----------------------------------------------------------------
  // CASH SHIFT SAVE HANDLER
  // -----------------------------------------------------------------
  const handleSaveShift = async (
    denominations: Record<string, number>,
    countedTotal: number
  ) => {
    await adminRepo.saveCashCount(cashShift?.id, denominations, countedTotal);
    setCashShift((prev) =>
      prev
        ? {
            ...prev,
            denominations,
            counted_cash_cop: countedTotal,
            difference_cop: countedTotal - (prev.expected_cash_cop || 1395000),
          }
        : null
    );
  };

  // Computed metrics
  const criticalStockCount = useMemo(
    () => products.filter((p) => p.status === 'low').length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.status === 'out').length,
    [products]
  );
  const totalInventoryValue = useMemo(
    () => products.reduce((sum, p) => sum + p.price_cop * p.stock_quantity, 0),
    [products]
  );
  const totalOutstandingCredit = useMemo(
    () => customers.reduce((sum, c) => sum + c.credit_balance_cop, 0),
    [customers]
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-medium animate-fade-in">
          <CheckCircle className="h-4 w-4 text-[#F97316]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. SIDEBAR IZQUIERDO: Deep Slate #0F172A strictly following DESIGN.md */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#0F172A] z-50 flex flex-col justify-between border-r border-slate-800 shadow-xl select-none">
        <div className="flex flex-col">
          {/* Logo y Nombre de Tienda: FerroMax */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-800/80">
            <Link href="/" className="flex flex-col group">
              <span className="text-2xl font-black tracking-tight text-white leading-none">
                FERRO<span className="text-[#F97316]">MAX</span>
              </span>
              <p className="text-[#F97316] font-semibold text-[11px] tracking-wider uppercase mt-1">
                Panel de Administración
              </p>
            </Link>
          </div>

          {/* Tarjeta de Perfil del Administrador */}
          <div className="relative mx-3.5 my-3.5" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-full p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 hover:border-[#F97316]/50 hover:bg-slate-800 transition flex items-center justify-between text-left group"
              aria-label="Abrir opciones de perfil"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center text-white font-bold text-sm shadow shrink-0">
                  {getInitials(profile?.fullName, user?.email)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-xs font-bold truncate leading-tight group-hover:text-orange-200 transition">
                    {profile?.fullName || user?.email?.split('@')[0] || 'Administrador'}
                  </span>
                  <span className="text-slate-400 text-[10px] truncate mt-0.5">
                    Administrador FerroMax
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  isProfileMenuOpen ? 'rotate-180 text-[#F97316]' : ''
                }`}
              />
            </button>

            {/* Menú Desplegable en la Tarjetita de Perfil */}
            {isProfileMenuOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-50 text-xs text-slate-200">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-[11px] text-slate-400">Sesión iniciada como:</p>
                  <p className="font-semibold text-white truncate">{user?.email || 'admin@ferromax.co'}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded bg-[#F97316]/15 border border-[#F97316]/40 px-2 py-0.5 text-[10px] font-bold text-[#F97316]">
                    <ShieldCheck className="h-3 w-3" />
                    Rol: Administrador
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition"
                  >
                    <Store className="h-4 w-4 text-slate-400" />
                    <span>Ver Tienda Pública</span>
                  </Link>
                  <Link
                    href="/catalogo"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition"
                  >
                    <Package className="h-4 w-4 text-slate-400" />
                    <span>Catálogo de Productos</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-semibold transition text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navegación de los 6 Módulos Oficiales del Diseño */}
          <nav className="flex flex-col gap-1.5 px-3 mt-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'dashboard'
                  ? 'bg-[#F97316] text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              <span>Panel Principal</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'inventory'
                  ? 'bg-[#F97316] text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 shrink-0" />
                <span>Inventario y Precios</span>
              </div>
              {criticalStockCount > 0 && (
                <span
                  title={`${criticalStockCount} producto(s) en alerta de stock bajo`}
                  className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40"
                >
                  {criticalStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'pos'
                  ? 'bg-[#F97316] text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Store className="h-5 w-5 shrink-0" />
              <span>Ventas Mostrador (POS)</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'orders'
                  ? 'bg-[#F97316] text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0" />
                <span>Retiro en Mesón</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                Online
              </span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'customers'
                  ? 'bg-[#F97316] text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Users className="h-5 w-5 shrink-0" />
              <span>Clientes & Abonos</span>
            </button>

            <button
              onClick={() => setActiveTab('cash')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'cash'
                  ? 'bg-[#F97316] text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <DollarSign className="h-5 w-5 shrink-0" />
              <span>Caja y Arqueo</span>
            </button>
          </nav>
        </div>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Caja y Mesón Abiertos
          </span>
          <span className="font-mono text-[11px] text-slate-500">v1.0-prod</span>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL DE CONTENIDO */}
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <span className="px-2.5 py-1 rounded-full bg-orange-50 text-[#EA580C] text-xs font-bold border border-orange-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
              Tienda Abierta • 07:30 a 18:30
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-medium">
              Mesón Principal y Despacho Local
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/80">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Base de Datos Conectada</span>
            </div>
          </div>
        </header>

        {/* Contenido Dinámico por Pestaña */}
        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <AdminDashboardTab
              products={products}
              orders={orders}
              criticalStockCount={criticalStockCount}
              outOfStockCount={outOfStockCount}
              onNavigateTab={(t) => setActiveTab(t)}
              getInitials={getInitials}
            />
          )}

          {activeTab === 'inventory' && (
            <AdminInventoryTab
              products={products}
              criticalStockCount={criticalStockCount}
              outOfStockCount={outOfStockCount}
              totalInventoryValue={totalInventoryValue}
              onAdjustStock={handleAdjustStock}
              onUpdatePrice={handleUpdatePrice}
              onProductUpdated={(updated) =>
                setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
              }
              onProductDeleted={(deletedId) =>
                setProducts((prev) => prev.filter((p) => p.id !== deletedId))
              }
              showToast={showToast}
            />
          )}

          {activeTab === 'pos' && (
            <AdminPosTab
              products={products}
              customers={customers}
              orders={orders}
              cashierName={profile?.fullName || user?.email?.split('@')[0] || 'Administrador'}
              onSaleCompleted={handlePosSaleCompleted}
              showToast={showToast}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTab
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              getInitials={getInitials}
              showToast={showToast}
            />
          )}

          {activeTab === 'customers' && (
            <AdminCustomersTab
              customers={customers}
              totalOutstandingCredit={totalOutstandingCredit}
              onCustomerAbonoSuccess={handleCustomerAbonoSuccess}
              getInitials={getInitials}
              showToast={showToast}
            />
          )}

          {activeTab === 'cash' && (
            <AdminCashTab
              cashShift={cashShift}
              orders={orders}
              onSaveShift={handleSaveShift}
              showToast={showToast}
            />
          )}
        </main>
      </div>
    </div>
  );
}
