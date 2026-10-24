'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Store,
  Clock,
  Users,
  DollarSign,
  Search,
  CheckCircle,
  AlertCircle,
  LogOut,
  ShoppingBag,
  ShoppingCart,
  ChevronDown,
  ShieldCheck,
  Plus,
  Minus,
  Receipt,
  CreditCard,
  Phone,
  MessageSquare,
  Printer,
  RefreshCw,
  Bell,
  ArrowRight,
} from '@/presentation/components/common/Icons';
import { useAuth } from '@/presentation/context/AuthContext';

type AdminTab = 'dashboard' | 'inventory' | 'pos' | 'orders' | 'customers' | 'cash';

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, role, isLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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
    return 'AD';
  };

  // State for POS Counter sale
  const [posCart, setPosCart] = useState<Array<{ id: string; name: string; price: number; qty: number }>>([
    { id: '1', name: 'Disco de Corte Fino 4.5" DeWalt', price: 6500, qty: 2 },
    { id: '2', name: 'Cinta Aislante Negra 3M Scotch 20m', price: 9200, qty: 1 },
  ]);
  const [posCustomerType, setPosCustomerType] = useState('mostrador');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [posSaleSuccess, setPosSaleSuccess] = useState(false);

  // State for Inventory adjustments
  const [inventoryList, setInventoryList] = useState([
    { id: 'SKU-001', name: 'Taladro Percutor DeWalt 20V Max', category: 'Herramientas Eléctricas', aisle: 'Pasillo 1', stock: 12, price: 385000, status: 'ok' },
    { id: 'SKU-002', name: 'Caja Tornillos Drywall 6x1 (500 und)', category: 'Tornillería y Fijaciones', aisle: 'Pasillo 4', stock: 3, price: 28000, status: 'low' },
    { id: 'SKU-003', name: 'Cinta Teflón 3/4" x 10m Alta Densidad', category: 'Plomería y Grifería', aisle: 'Pasillo 2', stock: 4, price: 4500, status: 'low' },
    { id: 'SKU-004', name: 'Esmalte Sintético Blanco Brillante 1 Gal', category: 'Pinturas y Adhesivos', aisle: 'Pasillo 3', stock: 18, price: 68000, status: 'ok' },
    { id: 'SKU-005', name: 'Tubo Sanitario PVC 2" x 3m Pavco', category: 'Plomería y Grifería', aisle: 'Patio Tubos', stock: 0, price: 34500, status: 'out' },
    { id: 'SKU-006', name: 'Llave Ajustable 10" Stanley Cromo', category: 'Herramientas Manuales', aisle: 'Pasillo 1', stock: 9, price: 48900, status: 'ok' },
  ]);

  // State for Click & Collect Orders
  const [ordersList, setOrdersList] = useState([
    {
      id: 'FM-2025-001',
      customer: 'Juan Carlos Pérez',
      phone: '310 987 6543',
      items: 'Taladro DeWalt 20V + Brocas (2 items)',
      total: 395000,
      status: 'ready',
      pin: '7492',
      time: 'Hace 15 min',
    },
    {
      id: 'FM-2025-002',
      customer: 'Construcciones del Valle',
      phone: '301 223 4455',
      items: 'Caja Tornillos Drywall + Cinta Teflón (2 items)',
      total: 32500,
      status: 'packing',
      pin: '1024',
      time: 'Hace 30 min',
    },
    {
      id: 'FM-2025-003',
      customer: 'Andrés Morales (Maestro)',
      phone: '315 444 8899',
      items: '2x Esmalte Sintético Blanco 1 Gal',
      total: 136000,
      status: 'delivered',
      pin: '5561',
      time: 'Hoy 10:15 AM',
    },
  ]);
  const [pinLookup, setPinLookup] = useState('');
  const [pinAlert, setPinAlert] = useState<string | null>(null);

  // State for Cash Count / Arqueo
  const [cashDenominations, setCashDenominations] = useState<{ [key: string]: number }>({
    '50000': 14,
    '20000': 22,
    '10000': 18,
    '5000': 15,
    '2000': 20,
    '1000': 25,
  });

  const totalCashCounted = Object.entries(cashDenominations).reduce(
    (acc, [denom, count]) => acc + parseInt(denom) * count,
    0
  );

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-3 border-[#F97316] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  // Role Gate: if not authenticated or not admin, show guard view
  if (!user || role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-[#EA580C] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Acceso Exclusivo de Administrador
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Esta sección está reservada para el personal administrativo de FerroMax.
            {user ? (
              <span className="block mt-2 font-medium text-slate-700">
                Tu cuenta (<span className="text-slate-900 font-semibold">{user.email}</span>) tiene rol de{' '}
                <span className="text-slate-900 font-semibold uppercase">{role || 'Cliente'}</span>.
              </span>
            ) : (
              <span className="block mt-2 font-medium text-slate-700">
                Debes iniciar sesión con una cuenta de rol Administrador.
              </span>
            )}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white py-2.5 px-4 rounded font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Iniciar Sesión como Administrador</span>
            </Link>

            <Link
              href="/"
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded font-semibold text-xs transition"
            >
              Volver a la Tienda Pública
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const adjustStock = (id: string, delta: number) => {
    setInventoryList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStock = Math.max(0, item.stock + delta);
          let newStatus = 'ok';
          if (newStock === 0) newStatus = 'out';
          else if (newStock <= 5) newStatus = 'low';
          return { ...item, stock: newStock, status: newStatus };
        }
        return item;
      })
    );
  };

  const handlePinDeliver = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinLookup.trim();
    if (!cleanPin) return;

    const matched = ordersList.find((o) => o.pin === cleanPin || o.id.toLowerCase() === cleanPin.toLowerCase());
    if (matched) {
      setOrdersList((prev) =>
        prev.map((o) => (o.id === matched.id ? { ...o, status: 'delivered' } : o))
      );
      setPinAlert(`¡Orden ${matched.id} (${matched.customer}) entregada exitosamente en mesón!`);
      setPinLookup('');
      setTimeout(() => setPinAlert(null), 4000);
    } else {
      setPinAlert('No se encontró ningún pedido pendiente con ese PIN o código.');
      setTimeout(() => setPinAlert(null), 3000);
    }
  };

  const addPosItem = (item: { id: string; name: string; price: number }) => {
    setPosCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const posTotal = posCart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-800 antialiased">
      {/* 1. SIDEBAR IZQUIERDO: Deep Slate #0F172A strictly following DESIGN.md */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#0F172A] z-50 flex flex-col justify-between border-r border-slate-800 shadow-xl">
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

          {/* Tarjeta de Perfil del Administrador (con menú desplegable integrado) */}
          <div className="relative mx-3.5 my-3.5" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-full p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 hover:border-[#F97316]/50 hover:bg-slate-800 transition flex items-center justify-between text-left group"
              aria-label="Abrir opciones de perfil"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center text-white font-bold text-sm shadow shrink-0">
                  {getInitials(profile?.fullName, user.email)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-xs font-bold truncate leading-tight group-hover:text-orange-200 transition">
                    {profile?.fullName || user.email.split('@')[0]}
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
                  <p className="font-semibold text-white truncate">{user.email}</p>
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
            {/* 1. Panel Principal */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'dashboard'
                  ? 'bg-[#F97316] text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Panel Principal</span>
            </button>

            {/* 2. Inventario y Precios */}
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'inventory'
                  ? 'bg-[#F97316] text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Package className="h-4 w-4 shrink-0" />
              <span>Inventario y Precios</span>
            </button>

            {/* 3. Ventas del Mostrador y Web */}
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'pos'
                  ? 'bg-[#F97316] text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Store className="h-4 w-4 shrink-0" />
              <span>Ventas Mostrador & Web</span>
            </button>

            {/* 4. Pedidos y Retiro en Tienda */}
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'orders'
                  ? 'bg-[#F97316] text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span>Pedidos y Retiro en Tienda</span>
            </button>

            {/* 5. Clientes Frecuentes */}
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'customers'
                  ? 'bg-[#F97316] text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Clientes Frecuentes</span>
            </button>

            {/* 6. Configuración de Caja */}
            <button
              onClick={() => setActiveTab('cash')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left ${
                activeTab === 'cash'
                  ? 'bg-[#F97316] text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>Configuración de Caja</span>
            </button>
          </nav>
        </div>

        {/* Estado Inferior de la Tienda */}
        <div className="p-4 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-800/70 flex items-center justify-between border border-slate-700/40">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-300">Caja y Tienda Abierta</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-medium">Turno Mañana</span>
          </div>
        </div>
      </aside>

      {/* 2. CONTENEDOR PRINCIPAL */}
      <div className="pl-72 flex-1 flex flex-col min-h-screen">
        {/* Topbar Superior: Limpio, consistente con el diseño */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between shadow-xs">
          {/* Buscador General de la Ferretería */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-100 border-none text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#F97316] transition-all"
                placeholder="Buscar SKU, tornillo, pintura, herramienta o cliente..."
                type="search"
              />
            </div>
          </div>

          {/* Estado de mostrador y enlaces rápidos */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Atención al público en mostrador</span>
            </div>

            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-[#F97316] transition flex items-center gap-1.5"
            >
              <Store className="h-4 w-4" />
              <span className="hidden md:inline">Tienda Pública</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              type="button"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* 3. VISTAS SEGÚN MÓDULO SELECCIONADO */}
        <main className="p-8 space-y-6 flex-1">
          {/* ======================================================== */}
          {/* MÓDULO 1: PANEL PRINCIPAL (DASHBOARD)                     */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Título de Bienvenida */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F97316] font-mono">
                      FerroMax • Ferretería de Barrio
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">Atención a Vecinos y Maestros</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Panel Principal de Administración
                  </h1>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Control diario de caja, inventario en estantes y pedidos para retiro en mesón o entrega local.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('cash')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-sm hover:shadow transition-all"
                  >
                    <Receipt className="h-4 w-4" />
                    <span>Cierre de Caja del Día</span>
                  </button>
                </div>
              </div>

              {/* 3 Tarjetas KPI Superiores (Siguiendo SCREEN_1) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* KPI 1 */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Ventas Totales Hoy
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-[#F97316]">
                        <Store className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">$1,485,000</span>
                      <span className="text-xs font-mono font-bold text-slate-400">COP</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>34 boletas del mostrador y web local</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      ↑ Buen ritmo
                    </span>
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Productos por Reponer
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-[#B45309] tracking-tight">4</span>
                      <span className="text-sm font-bold text-amber-700">artículos críticos</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2.5 rounded-lg bg-[#FEF3C7] text-[#B45309] border border-amber-200/80 text-xs flex flex-col gap-1">
                    <span className="font-bold flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Por agotarse en estantería:
                    </span>
                    <p className="text-[11px] leading-tight text-amber-900 font-medium">
                      Tornillos drywall, cinta aisladora, teflón, ampolletas LED.
                    </p>
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Pagos Recibidos en Caja
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CreditCard className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">$1,395,000</span>
                      <span className="text-xs font-mono font-bold text-slate-400">COP</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Efectivo, Datáfono, Bancolombia / Nequi
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Caja cuadrada al corte actual</span>
                  </div>
                </div>
              </div>

              {/* Tabla: Actualización Rápida de Inventario */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Package className="h-5 w-5 text-[#F97316]" />
                      Actualización Rápida de Inventario de Tienda
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Ajusta existencias inmediatas en estanterías o mesón con los botones +/-.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-1"
                  >
                    <span>Ir a Gestión Completa de Inventario</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Producto</th>
                        <th className="py-2.5 px-3">Ubicación</th>
                        <th className="py-2.5 px-3">Precio COP</th>
                        <th className="py-2.5 px-3">Stock en Estante</th>
                        <th className="py-2.5 px-3 text-right">Ajuste Rápido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {inventoryList.slice(0, 4).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">{item.id}</td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-[11px] text-slate-400">{item.category}</p>
                          </td>
                          <td className="py-3 px-3 text-slate-500">{item.aisle}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900 font-mono">
                            ${item.price.toLocaleString('es-CO')}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                item.status === 'ok'
                                  ? 'bg-[#DCFCE7] text-[#15803D]'
                                  : item.status === 'low'
                                  ? 'bg-[#FEF3C7] text-[#B45309]'
                                  : 'bg-[#FEE2E2] text-[#B91C1C]'
                              }`}
                            >
                              {item.stock} unidades
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => adjustStock(item.id, -1)}
                                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-200 text-slate-700 font-bold transition"
                                title="Restar 1"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-2.5 font-mono font-bold text-slate-800">{item.stock}</span>
                              <button
                                onClick={() => adjustStock(item.id, 1)}
                                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-200 text-slate-700 font-bold transition"
                                title="Sumar 1"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MÓDULO 2: INVENTARIO Y PRECIOS (SCREEN_2)                 */}
          {/* ======================================================== */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Encabezado con acento naranja */}
              <div className="bg-white p-6 rounded-xl shadow-xs border-t-2 border-[#F97316] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#EA580C] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      Inventario y Precios
                    </span>
                    <span className="text-xs text-slate-400">• Bodega & Estantes</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Gestión de Inventario y Precios de Barrio
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Controla existencias en estantes, márgenes de ganancia y recepción de mercadería.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-3.5 py-2 rounded-lg bg-orange-50 text-[#EA580C] border border-orange-200 font-semibold text-xs hover:bg-orange-100 transition">
                    Exportar Lista
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white font-semibold text-xs shadow-md shadow-orange-500/20 hover:from-[#d94e07] hover:to-[#ea580c] transition flex items-center gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span>+ Nuevo Producto</span>
                  </button>
                </div>
              </div>

              {/* 4 KPIs de Inventario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-white shadow-xs border-t-2 border-[#F97316]">
                  <span className="text-slate-500 text-xs font-semibold uppercase">Total Artículos</span>
                  <div className="text-slate-900 text-3xl font-extrabold mt-1">428</div>
                  <p className="text-slate-500 text-[11px] mt-1">Registrados en 6 categorías</p>
                </div>

                <div className="p-5 rounded-xl bg-white shadow-xs border-t-2 border-[#F97316] bg-gradient-to-b from-orange-50/20 to-white">
                  <span className="text-slate-500 text-xs font-semibold uppercase">Stock Crítico en Estante</span>
                  <div className="text-[#EA580C] text-3xl font-extrabold mt-1">8</div>
                  <p className="text-amber-700 text-[11px] mt-1">Menos de 5 unidades restantes</p>
                </div>

                <div className="p-5 rounded-xl bg-white shadow-xs border-t-2 border-rose-500">
                  <span className="text-slate-500 text-xs font-semibold uppercase">Agotados</span>
                  <div className="text-rose-600 text-3xl font-extrabold mt-1">2</div>
                  <p className="text-rose-700 text-[11px] mt-1">Tubos PVC y Mangueras sin stock</p>
                </div>

                <div className="p-5 rounded-xl bg-white shadow-xs border-t-2 border-[#F97316]">
                  <span className="text-slate-500 text-xs font-semibold uppercase">Valor Inventario Tienda</span>
                  <div className="text-slate-900 text-2xl font-extrabold font-mono mt-1">$18,450,000</div>
                  <p className="text-emerald-700 text-[11px] mt-1 font-semibold">+44.1% margen promedio</p>
                </div>
              </div>

              {/* Tabla Detallada con Filtros */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Código SKU</th>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-3">Categoría</th>
                        <th className="py-2.5 px-3">Pasillo / Estante</th>
                        <th className="py-2.5 px-3">Precio Venta (COP)</th>
                        <th className="py-2.5 px-3">Stock Físico</th>
                        <th className="py-2.5 px-3 text-right">Ajuste Rápido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {inventoryList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">{item.id}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{item.name}</td>
                          <td className="py-3 px-3 text-slate-500">{item.category}</td>
                          <td className="py-3 px-3 font-medium text-slate-600">{item.aisle}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ${item.price.toLocaleString('es-CO')}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                item.status === 'ok'
                                  ? 'bg-[#DCFCE7] text-[#15803D]'
                                  : item.status === 'low'
                                  ? 'bg-[#FEF3C7] text-[#B45309]'
                                  : 'bg-[#FEE2E2] text-[#B91C1C]'
                              }`}
                            >
                              {item.stock} un.
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => adjustStock(item.id, -1)}
                                className="px-2 py-1 bg-slate-50 hover:bg-slate-200 text-slate-700 font-bold transition"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-2.5 font-mono font-bold text-slate-900">{item.stock}</span>
                              <button
                                onClick={() => adjustStock(item.id, 1)}
                                className="px-2 py-1 bg-slate-50 hover:bg-slate-200 text-slate-700 font-bold transition"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MÓDULO 3: VENTAS DEL MOSTRADOR Y WEB (POS)                */}
          {/* ======================================================== */}
          {activeTab === 'pos' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-xs border-t-2 border-[#F97316]">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Terminal de Ventas y Mostrador (POS)
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Atención ágil en mesón para vecinos y maestros. Emisión de ticket y comprobante.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Caja #1 • Lista para Vender
                  </span>
                </div>
              </div>

              {/* Área Operativa en 2 Columnas (65% / 35%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Columna Izquierda: Buscador y Productos Frecuentes */}
                <div className="lg:col-span-8 space-y-5">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Escanear código de barra o buscar producto (F3)..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-[#F97316] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Acceso Rápido a Productos Más Vendidos */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Productos de Alta Rotación en Mesón
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'pos-1', name: 'Disco de Corte 4.5" DeWalt', price: 6500 },
                        { id: 'pos-2', name: 'Cinta Aislante Negra 3M', price: 9200 },
                        { id: 'pos-3', name: 'Cinta Teflón 3/4"', price: 4500 },
                        { id: 'pos-4', name: 'Broca Concreto 1/4" Stanley', price: 12500 },
                        { id: 'pos-5', name: 'Tornillo Drywall x100 und', price: 6800 },
                        { id: 'pos-6', name: 'Pegamento PVC Pavco 1/4 Gal', price: 18900 },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addPosItem(item)}
                          className="flex flex-col items-start p-3 rounded-lg border border-slate-200 hover:border-[#F97316] hover:bg-orange-50/50 transition text-left group"
                        >
                          <span className="font-semibold text-slate-900 text-xs group-hover:text-[#F97316]">
                            {item.name}
                          </span>
                          <span className="font-mono font-bold text-slate-600 text-xs mt-1">
                            ${item.price.toLocaleString('es-CO')} COP
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">+ Agregar</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Ticket de Venta Actual */}
                <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-[#F97316]" />
                      Ticket de Venta
                    </h3>
                    <button
                      onClick={() => setPosCart([])}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Vaciar
                    </button>
                  </div>

                  {/* Lista de Items */}
                  <div className="space-y-2.5 max-h-64 overflow-y-auto">
                    {posCart.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No hay productos en el ticket</p>
                    ) : (
                      posCart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-xs pb-2 border-b border-slate-50">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {item.qty} x ${item.price.toLocaleString('es-CO')}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-slate-900 shrink-0">
                            ${(item.price * item.qty).toLocaleString('es-CO')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Resumen de Total */}
                  <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-mono">${Math.round(posTotal * 0.81).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>IVA (19%)</span>
                      <span className="font-mono">${Math.round(posTotal * 0.19).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                      <span>Total COP</span>
                      <span className="text-[#F97316] font-mono">${posTotal.toLocaleString('es-CO')}</span>
                    </div>
                  </div>

                  {/* Métodos de Pago */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2">
                    <button
                      onClick={() => setPosPaymentMethod('efectivo')}
                      className={`py-2 px-1 text-center rounded text-[11px] font-bold border transition ${
                        posPaymentMethod === 'efectivo'
                          ? 'border-[#F97316] bg-orange-50 text-[#EA580C]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Efectivo
                    </button>
                    <button
                      onClick={() => setPosPaymentMethod('tarjeta')}
                      className={`py-2 px-1 text-center rounded text-[11px] font-bold border transition ${
                        posPaymentMethod === 'tarjeta'
                          ? 'border-[#F97316] bg-orange-50 text-[#EA580C]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Datáfono
                    </button>
                    <button
                      onClick={() => setPosPaymentMethod('transferencia')}
                      className={`py-2 px-1 text-center rounded text-[11px] font-bold border transition ${
                        posPaymentMethod === 'transferencia'
                          ? 'border-[#F97316] bg-orange-50 text-[#EA580C]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      QR / Nequi
                    </button>
                  </div>

                  {/* Botón de Cobro */}
                  <button
                    disabled={posCart.length === 0}
                    onClick={() => {
                      setPosSaleSuccess(true);
                      setPosCart([]);
                      setTimeout(() => setPosSaleSuccess(false), 3000);
                    }}
                    className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:bg-slate-200 text-white font-bold py-3 rounded-lg text-xs transition shadow-md shadow-orange-500/20"
                  >
                    Cobrar e Imprimir Comprobante
                  </button>

                  {posSaleSuccess && (
                    <div className="p-2.5 rounded bg-emerald-50 text-emerald-800 text-xs font-semibold text-center border border-emerald-200">
                      ✓ ¡Venta registrada y comprobante emitido!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MÓDULO 4: PEDIDOS Y RETIRO EN TIENDA                      */}
          {/* ======================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-xs border-t-2 border-[#F97316]">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Gestión de Pedidos Web y Retiro en Mesón
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Clientes que compran en línea y retiran en el mostrador en 30 minutos.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold">
                    Click & Collect Activo
                  </span>
                </div>
              </div>

              {/* Formulario de Verificación por PIN de Retiro */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  Entrega Rápida con PIN de Retiro (Mesón)
                </h3>
                <form onSubmit={handlePinDeliver} className="flex gap-2 max-w-lg">
                  <input
                    type="text"
                    value={pinLookup}
                    onChange={(e) => setPinLookup(e.target.value)}
                    placeholder="Ingresa PIN (ej. 7492) o Nº Orden (FM-2025-001)..."
                    className="flex-1 rounded bg-slate-50 border border-slate-200 py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#F97316] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-[#F97316] hover:bg-[#EA580C] text-white px-4 py-2 rounded text-xs font-bold transition shrink-0"
                  >
                    Verificar y Entregar
                  </button>
                </form>

                {pinAlert && (
                  <div className="mt-3 p-2.5 rounded bg-orange-50 text-orange-800 text-xs font-semibold border border-orange-200">
                    {pinAlert}
                  </div>
                )}
              </div>

              {/* Cola de Pedidos */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Nº Orden</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Productos</th>
                        <th className="py-2.5 px-3">Total COP</th>
                        <th className="py-2.5 px-3">PIN Retiro</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {ordersList.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{ord.id}</td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-900">{ord.customer}</p>
                            <a
                              href={`https://wa.me/57${ord.phone.replace(/\s+/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-[#25D366] font-medium hover:underline flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3" />
                              {ord.phone}
                            </a>
                          </td>
                          <td className="py-3 px-3">{ord.items}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ${ord.total.toLocaleString('es-CO')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="bg-slate-900 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px]">
                              {ord.pin}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {ord.status === 'ready' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D]">
                                Listo para Retiro
                              </span>
                            )}
                            {ord.status === 'packing' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#B45309]">
                                Empacando en Bodega
                              </span>
                            )}
                            {ord.status === 'delivered' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                                Entregado
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {ord.status === 'packing' && (
                              <button
                                onClick={() =>
                                  setOrdersList((prev) =>
                                    prev.map((o) => (o.id === ord.id ? { ...o, status: 'ready' } : o))
                                  )
                                }
                                className="border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1 rounded text-[11px] font-semibold transition"
                              >
                                Marcar Listo
                              </button>
                            )}
                            {ord.status === 'ready' && (
                              <button
                                onClick={() =>
                                  setOrdersList((prev) =>
                                    prev.map((o) => (o.id === ord.id ? { ...o, status: 'delivered' } : o))
                                  )
                                }
                                className="bg-[#F97316] hover:bg-[#EA580C] text-white px-3 py-1 rounded text-[11px] font-bold transition"
                              >
                                Entregar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MÓDULO 5: CLIENTES FRECUENTES                             */}
          {/* ======================================================== */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-xs border-t-2 border-[#F97316]">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Directorio de Clientes Frecuentes y Maestros
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Historial de compras, descuentos preferenciales y cuentas corrientes de confianza.
                  </p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-md shadow-orange-500/20 transition">
                  + Registrar Nuevo Cliente
                </button>
              </div>

              {/* Tarjetas de Clientes Frecuentes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: 'Hernán Morales',
                    trade: 'Maestro de Obra Constructor',
                    club: 'Club Maestro Oro (10% Dcto)',
                    phone: '312 841 9011',
                    balance: 180000,
                    status: 'pending',
                  },
                  {
                    name: 'Construcciones Del Valle S.A.S',
                    trade: 'Empresa Contratista Local',
                    club: 'Tarifa Constructor (15% Dcto)',
                    phone: '300 555 4321',
                    balance: 0,
                    status: 'paid',
                  },
                  {
                    name: 'Gladys Rodríguez',
                    trade: 'Vecina Propietaria',
                    club: 'Vecina Frecuente (5% Dcto)',
                    phone: '315 222 3344',
                    balance: 0,
                    status: 'paid',
                  },
                  {
                    name: 'Jaime Rincón',
                    trade: 'Electricista Certificado',
                    club: 'Club Electricista (10% Dcto)',
                    phone: '310 999 1122',
                    balance: 45000,
                    status: 'pending',
                  },
                ].map((cust, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {cust.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate">{cust.name}</h4>
                          <p className="text-[11px] text-slate-500 truncate">{cust.trade}</p>
                        </div>
                      </div>

                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#EA580C] border border-orange-200 mb-3">
                        {cust.club}
                      </span>

                      <div className="text-xs space-y-1 text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{cust.phone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Saldo Pendiente</span>
                        <span className={`font-mono font-bold ${cust.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ${cust.balance.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                      <a
                        href={`https://wa.me/57${cust.phone.replace(/\s+/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded bg-emerald-50 text-[#25D366] hover:bg-emerald-100 transition"
                        title="Enviar WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MÓDULO 6: CONFIGURACIÓN DE CAJA (ARQUEO Y CIERRE)        */}
          {/* ======================================================== */}
          {activeTab === 'cash' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-xs border-t-2 border-[#F97316]">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Configuración de Caja y Arqueo de Efectivo
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Conteo físico de billetes y monedas en gaveta para cuadre con el sistema.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    Turno Mañana Abierto
                  </span>
                </div>
              </div>

              {/* Calculadora Interactiva de Arqueo */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Conteo de Billetes en Gaveta Metálica
                    </h3>
                    <p className="text-slate-500 text-xs">Ingresa cuántos billetes hay de cada denominación.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Efectivo Contado:</span>
                    <span className="text-xl font-black text-[#F97316] font-mono">
                      ${totalCashCounted.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(cashDenominations).map(([denom, count]) => {
                    const val = parseInt(denom);
                    return (
                      <div key={denom} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-900 font-mono">${val.toLocaleString('es-CO')}</span>
                          <span className="text-slate-400 text-[10px]">Billete</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setCashDenominations((prev) => ({
                                ...prev,
                                [denom]: Math.max(0, (prev[denom] || 0) - 1),
                              }))
                            }
                            className="w-7 h-7 rounded bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 transition"
                          >
                            -
                          </button>
                          <span className="flex-1 text-center font-mono font-bold text-slate-900 text-xs">
                            {count}
                          </span>
                          <button
                            onClick={() =>
                              setCashDenominations((prev) => ({
                                ...prev,
                                [denom]: (prev[denom] || 0) + 1,
                              }))
                            }
                            className="w-7 h-7 rounded bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 transition"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono text-right border-t border-slate-200/60 pt-1">
                          Subtotal: ${(val * count).toLocaleString('es-CO')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Cuadre con Ventas Registradas:</span>
                    <span className="text-slate-600">
                      Ventas en efectivo registradas hoy: $1,395,000 COP | Base de caja inicial: $200,000 COP
                    </span>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-bold transition shrink-0">
                    Guardar y Cerrar Turno
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
