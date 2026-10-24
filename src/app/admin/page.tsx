'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  ChevronDown,
  ShieldCheck,
  Plus,
  Minus,
  Receipt,
  CreditCard,
  Printer,
  RefreshCw,
  Bell,
  Save,
  MapPin,
  Filter,
  QrCode,
  Trash2,
  Smartphone,
  Zap,
  Calendar,
  FileText,
  ChevronRight,
  Check,
} from '@/presentation/components/common/Icons';
import { useAuth } from '@/presentation/context/AuthContext';
import {
  SupabaseAdminRepository,
  AdminProduct,
  AdminCustomer,
  AdminOrder,
  CashShift,
} from '@/infrastructure/repositories/SupabaseAdminRepository';

type AdminTab = 'dashboard' | 'inventory' | 'pos' | 'orders' | 'customers' | 'cash';

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, role, isLoading: isAuthLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Supabase Clean Architecture Repository
  const adminRepo = useMemo(() => SupabaseAdminRepository.getInstance(), []);

  // Real Database States
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [cashShift, setCashShift] = useState<CashShift | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      if (shift?.denominations) {
        setCashDenominations(shift.denominations);
      }
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
  // INVENTORY TAB LOGIC & ACTIONS
  // -----------------------------------------------------------------
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('all');
  const [inventoryFilterTab, setInventoryFilterTab] = useState<'all' | 'low' | 'out'>('all');

  const adjustStock = async (id: string, delta: number) => {
    const item = products.find((p) => p.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock_quantity + delta);
    const newStatus: 'ok' | 'low' | 'out' =
      newStock === 0 ? 'out' : newStock <= item.min_stock ? 'low' : 'ok';

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock_quantity: newStock, status: newStatus } : p))
    );

    await adminRepo.updateProduct(id, { stock_quantity: newStock, status: newStatus });
    showToast(`Stock actualizado: ${item.name} (${newStock} unidades)`);
  };

  const updatePrice = async (id: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price_cop: newPrice } : p))
    );
    await adminRepo.updateProduct(id, { price_cop: newPrice });
    showToast('Precio de venta actualizado en base de datos');
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.aisle.toLowerCase().includes(inventorySearch.toLowerCase());

      const matchesCat =
        inventoryCategory === 'all' ||
        p.category.toLowerCase().includes(inventoryCategory.toLowerCase());

      const matchesTab =
        inventoryFilterTab === 'all'
          ? true
          : inventoryFilterTab === 'low'
          ? p.status === 'low'
          : p.status === 'out';

      return matchesSearch && matchesCat && matchesTab;
    });
  }, [products, inventorySearch, inventoryCategory, inventoryFilterTab]);

  const criticalStockCount = useMemo(
    () => products.filter((p) => p.status === 'low').length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.status === 'out').length,
    [products]
  );
  const totalInventoryValue = useMemo(
    () => products.reduce((acc, p) => acc + p.price_cop * p.stock_quantity, 0),
    [products]
  );

  // -----------------------------------------------------------------
  // POS (VENTAS MOSTRADOR & WEB) LOGIC
  // -----------------------------------------------------------------
  const [posCart, setPosCart] = useState<
    Array<{ id: string; name: string; sku: string; aisle: string; price: number; qty: number }>
  >([
    {
      id: '1',
      name: 'Taladro Percutor Casero 650W DeWalt',
      sku: 'HERR-001',
      aisle: 'Pasillo 1 - Estante A',
      price: 385000,
      qty: 1,
    },
    {
      id: '6',
      name: 'Caja Tornillos Drywall 6x1 (500 und)',
      sku: 'FIJ-001',
      aisle: 'Pasillo 4 - Gaveta 12',
      price: 28000,
      qty: 2,
    },
  ]);
  const [posSearch, setPosSearch] = useState('');
  const [posSelectedCustomer, setPosSelectedCustomer] = useState<'regular' | 'occasional'>('regular');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'qr' | 'fiado'>('efectivo');
  const [cashGiven, setCashGiven] = useState(450000);
  const [posSaleSuccess, setPosSaleSuccess] = useState(false);

  const addPosItem = (product: AdminProduct) => {
    setPosCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          aisle: product.aisle,
          price: product.price_cop,
          qty: 1,
        },
      ];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeCartItem = (id: string) => {
    setPosCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setPosCart([]);

  const posSubtotalGross = useMemo(
    () => posCart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [posCart]
  );
  const posDiscount = useMemo(
    () => (posSelectedCustomer === 'regular' ? Math.round(posSubtotalGross * 0.05) : 0),
    [posSubtotalGross, posSelectedCustomer]
  );
  const posTotalFinal = Math.max(0, posSubtotalGross - posDiscount);
  const posSubtotalNeto = Math.round(posTotalFinal / 1.19);
  const posIVA = posTotalFinal - posSubtotalNeto;
  const cashChange = Math.max(0, cashGiven - posTotalFinal);

  const handleCompletePosSale = async () => {
    if (posCart.length === 0) return;

    const newOrder: AdminOrder = {
      id: 'BOL-' + Math.floor(10000 + Math.random() * 90000),
      order_number: 'BOL-' + Math.floor(10000 + Math.random() * 90000),
      customer_name:
        posSelectedCustomer === 'regular'
          ? 'Juan Pérez (Vecino Pasaje 3)'
          : 'Cliente Ocasional',
      customer_phone: '310 987 6543',
      customer_email: '',
      channel: 'pos',
      delivery_type: 'pickup',
      status: 'delivered',
      pickup_pin: String(Math.floor(1000 + Math.random() * 9000)),
      payment_method: posPaymentMethod,
      items_summary: posCart.map((i) => `${i.qty}x ${i.name}`).join(', '),
      total_cop: posTotalFinal,
      created_at: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setPosSaleSuccess(true);
    setTimeout(() => {
      setPosSaleSuccess(false);
      clearCart();
    }, 2800);
    showToast(`Venta POS #${newOrder.order_number} registrada correctamente`);
  };

  // -----------------------------------------------------------------
  // ORDERS (CLICK & COLLECT) LOGIC
  // -----------------------------------------------------------------
  const [orderFilterStatus, setOrderFilterStatus] = useState<'all' | 'preparing' | 'ready_for_pickup' | 'delivered'>('all');
  const [pinLookup, setPinLookup] = useState('');
  const [pinAlert, setPinAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderFilterStatus === 'all') return true;
      return o.status === orderFilterStatus;
    });
  }, [orders, orderFilterStatus]);

  const handleDeliverOrderByPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinLookup.trim();
    if (!cleanPin) return;

    const matched = orders.find(
      (o) =>
        o.pickup_pin === cleanPin ||
        o.order_number.toLowerCase() === cleanPin.toLowerCase() ||
        o.id.toLowerCase() === cleanPin.toLowerCase()
    );

    if (matched) {
      setOrders((prev) =>
        prev.map((o) => (o.id === matched.id ? { ...o, status: 'delivered' } : o))
      );
      await adminRepo.updateOrderStatus(matched.id, 'delivered');
      setPinAlert({
        type: 'success',
        msg: `¡PIN Verificado! Pedido ${matched.order_number} de ${matched.customer_name} entregado en mesón.`,
      });
      setPinLookup('');
      setTimeout(() => setPinAlert(null), 4000);
    } else {
      setPinAlert({
        type: 'error',
        msg: 'No se encontró ningún pedido con ese código PIN de retiro.',
      });
      setTimeout(() => setPinAlert(null), 3000);
    }
  };

  const markOrderStatus = async (orderId: string, status: 'preparing' | 'ready_for_pickup' | 'delivered') => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    await adminRepo.updateOrderStatus(orderId, status);
    showToast('Estado del pedido actualizado en base de datos');
  };

  // -----------------------------------------------------------------
  // CUSTOMERS & ABONOS LOGIC
  // -----------------------------------------------------------------
  const [abonoCustomerId, setAbonoCustomerId] = useState<string>('');
  const [abonoAmount, setAbonoAmount] = useState<number>(50000);
  const [abonoPaymentMethod, setAbonoPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');

  const selectedAbonoCustomer = useMemo(
    () => customers.find((c) => c.id === abonoCustomerId) || customers[0],
    [customers, abonoCustomerId]
  );

  const handleRecordAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbonoCustomer || abonoAmount <= 0) return;

    const result = await adminRepo.recordCustomerAbono(
      selectedAbonoCustomer.id,
      abonoAmount,
      abonoPaymentMethod
    );

    if (result.success) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedAbonoCustomer.id
            ? {
                ...c,
                credit_balance_cop: Math.max(0, c.credit_balance_cop - abonoAmount),
              }
            : c
        )
      );
      showToast(`¡Abono de $${abonoAmount.toLocaleString('es-CO')} COP registrado para ${selectedAbonoCustomer.full_name}!`);
      setAbonoAmount(50000);
    }
  };

  const totalOutstandingCredit = useMemo(
    () => customers.reduce((sum, c) => sum + c.credit_balance_cop, 0),
    [customers]
  );

  // -----------------------------------------------------------------
  // CASH CONFIGURATION & ARQUEO LOGIC
  // -----------------------------------------------------------------
  const [cashDenominations, setCashDenominations] = useState<{ [key: string]: number }>({
    '50000': 14,
    '20000': 22,
    '10000': 18,
    '5000': 15,
    '2000': 20,
    '1000': 25,
    '500': 50,
  });

  const alterDenominationQty = (denom: string, delta: number) => {
    setCashDenominations((prev) => ({
      ...prev,
      [denom]: Math.max(0, (prev[denom] || 0) + delta),
    }));
  };

  const totalCashCounted = useMemo(() => {
    return Object.entries(cashDenominations).reduce(
      (sum, [denom, count]) => sum + parseInt(denom) * count,
      0
    );
  }, [cashDenominations]);

  const expectedCashInDrawer = 1395000;
  const cashDifference = totalCashCounted - expectedCashInDrawer;

  const handleSaveArqueo = async () => {
    if (cashShift) {
      await adminRepo.saveCashCount(cashShift.id, cashDenominations, totalCashCounted);
    }
    showToast('¡Arqueo de caja conciliado y guardado en Supabase!');
  };

  // -----------------------------------------------------------------
  // GUARDS & LOADERS
  // -----------------------------------------------------------------
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-3 border-[#F97316] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Cargando panel de administración FerroMax...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-800 antialiased font-sans">
      {/* Toast Alert */}
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
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-100 border-none text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#F97316] transition-all"
                placeholder="Buscar SKU, tornillo, pintura, herramienta o cliente..."
                type="search"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Atención al público en mostrador</span>
            </div>

            <button
              onClick={() => loadRealData()}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Recargar datos de Supabase"
            >
              <RefreshCw className={`h-4 w-4 ${isDataLoading ? 'animate-spin text-[#F97316]' : ''}`} />
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Store className="h-3.5 w-3.5 text-[#F97316]" />
              <span className="hidden md:inline">Ver Tienda</span>
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

        <main className="p-8 space-y-6 flex-1">
          {/* ======================================================== */}
          {/* MÓDULO 1: PANEL PRINCIPAL (DASHBOARD)                     */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
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

              {/* 3 Tarjetas KPI Superiores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                      <span className="text-3xl font-black text-[#B45309] tracking-tight">
                        {criticalStockCount + outOfStockCount}
                      </span>
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

              {/* Tabla 1: Actualización Rápida de Inventario */}
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
                    className="text-xs font-semibold text-[#EA580C] hover:text-[#C2410C] flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>Ver inventario completo ({products.length} productos)</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200">
                        <th className="py-2.5 px-4 rounded-l-lg">Producto</th>
                        <th className="py-2.5 px-4">Categoría</th>
                        <th className="py-2.5 px-4">Ubicación</th>
                        <th className="py-2.5 px-4">Precio Venta (COP)</th>
                        <th className="py-2.5 px-4 text-center">Stock Actual</th>
                        <th className="py-2.5 px-4">Estado</th>
                        <th className="py-2.5 px-4 text-right rounded-r-lg">Acción Rápida</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.slice(0, 6).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{item.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-[#EA580C]" />
                              {item.aisle}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            ${item.price_cop.toLocaleString('es-CO')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono font-black text-sm text-slate-900">
                              {item.stock_quantity}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">{item.unit}</span>
                          </td>
                          <td className="py-3 px-4">
                            {item.status === 'ok' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Normal
                              </span>
                            )}
                            {item.status === 'low' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Bajo Stock
                              </span>
                            )}
                            {item.status === 'out' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Agotado
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden shadow-xs bg-white">
                              <button
                                onClick={() => adjustStock(item.id, -1)}
                                className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold transition"
                                title="Restar 1 unidad"
                              >
                                -
                              </button>
                              <span className="px-2.5 py-1 bg-slate-50 font-mono font-bold text-xs border-x border-slate-200 text-slate-800">
                                {item.stock_quantity}
                              </span>
                              <button
                                onClick={() => adjustStock(item.id, 1)}
                                className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold transition"
                                title="Sumar 1 unidad"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabla 2: Últimas Compras y Boletas de Vecinos */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-[#F97316]" />
                      <h2 className="text-base font-bold text-slate-900">
                        Últimas Compras y Boletas de Vecinos
                      </h2>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Boletas electrónicas emitidas en mostrador y pedidos para retiro en el local.
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Mostrador 1 y Caja Central
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200">
                        <th className="py-2.5 px-4 rounded-l-lg">Cliente Particular</th>
                        <th className="py-2.5 px-4">N° de Boleta</th>
                        <th className="py-2.5 px-4">Medio de Pago</th>
                        <th className="py-2.5 px-4">Total Pagado</th>
                        <th className="py-2.5 px-4">Hora</th>
                        <th className="py-2.5 px-4 text-right rounded-r-lg">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                                {getInitials(order.customer_name)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 text-xs block">
                                  {order.customer_name}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {order.items_summary}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                            #{order.order_number}
                          </td>
                          <td className="py-3 px-4">
                            <div className="inline-flex items-center gap-1.5 text-slate-700 capitalize">
                              <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                              <span>{order.payment_method}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            ${order.total_cop.toLocaleString('es-CO')} COP
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(order.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-emerald-800 text-[11px] font-bold border border-emerald-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              {order.status === 'delivered' ? 'Pagado / Entregado' : 'Listo para Retiro'}
                            </span>
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
          {/* MÓDULO 2: INVENTARIO Y PRECIOS                            */}
          {/* ======================================================== */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <span className="hover:text-slate-600 cursor-pointer">Inicio</span>
                    <span>›</span>
                    <span className="hover:text-slate-600 cursor-pointer">Administración</span>
                    <span>›</span>
                    <span className="text-[#EA580C] font-semibold">Inventario y Precios</span>
                  </nav>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Inventario y Precios de Venta
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Control de stock físico, pasillos, márgenes de ganancia y sincronización en tiempo real.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => showToast('Descargando planilla de inventario...')}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
                  >
                    Importar / Exportar
                  </button>
                  <button
                    onClick={() => showToast('Abriendo modal para registrar producto nuevo')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold shadow-sm transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Nuevo Producto</span>
                  </button>
                </div>
              </div>

              {/* 4 KPIs con bordes superiores distintivos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-white shadow-xs border-t-2 border-[#F97316] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      Total Productos Activos
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] border border-orange-200/60 flex items-center justify-center">
                      <Package className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-slate-900">{products.length}</span>
                    <span className="text-xs text-slate-400 ml-1">ítems en catálogo</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">100% al día</span>
                    <span className="text-[#EA580C] font-semibold bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">Mostrador + Web</span>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white shadow-xs border-t-2 border-amber-500 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      Stock Crítico en Estante
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-amber-600">{criticalStockCount}</span>
                    <span className="text-xs text-amber-700 font-semibold ml-1.5">artículos en alerta</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-800">
                    <span>Reposición prioritaria</span>
                    <button
                      onClick={() => setInventoryFilterTab('low')}
                      className="font-bold underline hover:text-amber-900"
                    >
                      Filtrar
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white shadow-xs border-t-2 border-rose-500 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      Agotados en Estantería
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                      <Minus className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-rose-600">{outOfStockCount}</span>
                    <span className="text-xs text-rose-700 font-semibold ml-1.5">artículos en cero</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-rose-600 font-semibold">
                    <span>Llegada prevista: Mañana 10:00</span>
                    <button
                      onClick={() => setInventoryFilterTab('out')}
                      className="font-bold underline"
                    >
                      Ver
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white shadow-xs border-t-2 border-[#F97316] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      Valor Inventario Tienda
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] border border-orange-200/60 flex items-center justify-center">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900">
                      ${totalInventoryValue.toLocaleString('es-CO')}
                    </span>
                    <span className="text-xs font-mono text-slate-400 block">COP valorizado</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      +44.1% margen promedio
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de Filtros y Búsqueda */}
              <div className="p-5 rounded-xl bg-white shadow-xs border border-slate-200/80 flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F97316] h-4 w-4" />
                    <input
                      className="w-full pl-10 pr-24 py-2.5 rounded-lg bg-orange-50/40 border border-orange-200/80 text-slate-800 placeholder-slate-400 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#F97316] transition-all"
                      placeholder="Buscar por nombre, código SKU o pasillo..."
                      type="text"
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Filtro rápido
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      className="px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer outline-none hover:bg-slate-100 focus:ring-2 focus:ring-[#F97316]"
                      value={inventoryCategory}
                      onChange={(e) => setInventoryCategory(e.target.value)}
                    >
                      <option value="all">Todas las categorías</option>
                      <option value="Herramientas">Herramientas</option>
                      <option value="Pinturas">Pinturas</option>
                      <option value="Plomería">Plomería</option>
                      <option value="Tornillería">Tornillería / Fijaciones</option>
                      <option value="Electricidad">Electricidad</option>
                    </select>

                    <button
                      onClick={() => showToast('¡Todos los cambios de inventario sincronizados!')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition shadow-sm ml-auto"
                    >
                      <Save className="h-4 w-4" />
                      <span>Guardar Cambios</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5 text-[#F97316]" />
                    Filtros rápidos:
                  </span>
                  <button
                    onClick={() => setInventoryFilterTab('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      inventoryFilterTab === 'all'
                        ? 'bg-[#F97316] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-[#EA580C]'
                    }`}
                  >
                    Todos ({products.length})
                  </button>
                  <button
                    onClick={() => setInventoryFilterTab('low')}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      inventoryFilterTab === 'low'
                        ? 'bg-[#F97316] text-white shadow-xs'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    Bajo Stock ({criticalStockCount})
                  </button>
                  <button
                    onClick={() => setInventoryFilterTab('out')}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      inventoryFilterTab === 'out'
                        ? 'bg-[#F97316] text-white shadow-xs'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    Agotados ({outOfStockCount})
                  </button>
                </div>
              </div>

              {/* Tabla de Inventario y Precios */}
              <div className="rounded-xl bg-white shadow-xs border border-slate-200/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-orange-50/70 border-b border-orange-100 text-slate-700 uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">Producto y Ubicación</th>
                        <th className="py-3 px-4">Categoría</th>
                        <th className="py-3 px-4">Costo Tienda</th>
                        <th className="py-3 px-4">Precio Venta (IVA Inc.)</th>
                        <th className="py-3 px-4">Stock en Mostrador</th>
                        <th className="py-3 px-4">Canal Venta</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((p) => {
                        const marginPercent = Math.round(
                          ((p.price_cop - p.cost_cop) / p.cost_cop) * 100
                        );
                        return (
                          <tr key={p.id} className="hover:bg-orange-50/25 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden">
                                  {p.image_url ? (
                                    <img
                                      src={p.image_url}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="h-5 w-5 text-slate-400" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-slate-900 font-bold truncate max-w-xs">
                                    {p.name}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="inline-flex items-center gap-1 text-[#EA580C] text-[11px] font-medium">
                                      <MapPin className="h-3 w-3" />
                                      {p.aisle}
                                    </span>
                                    <span className="text-slate-400 text-[11px] font-mono">
                                      • SKU: {p.sku}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
                                {p.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">
                              ${p.cost_cop.toLocaleString('es-CO')} COP
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-0.5">
                                <div className="relative w-32">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#F97316] font-mono text-xs font-bold">
                                    $
                                  </span>
                                  <input
                                    className="w-full pl-6 pr-2 py-1 rounded bg-orange-50/60 border border-orange-200 text-slate-900 font-mono text-xs font-bold outline-none focus:bg-white focus:ring-1 focus:ring-[#F97316]"
                                    type="number"
                                    defaultValue={p.price_cop}
                                    onBlur={(e) =>
                                      updatePrice(p.id, parseInt(e.target.value) || p.price_cop)
                                    }
                                  />
                                </div>
                                <span className="font-mono text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded w-fit">
                                  +{marginPercent}% margen
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="inline-flex items-center rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shadow-xs">
                                <button
                                  onClick={() => adjustStock(p.id, -1)}
                                  className="px-2.5 py-1 hover:bg-slate-200 text-slate-700 font-bold transition"
                                >
                                  -
                                </button>
                                <span className="w-10 text-center bg-white font-mono font-bold text-xs py-1 text-slate-900 border-x border-slate-200">
                                  {p.stock_quantity}
                                </span>
                                <button
                                  onClick={() => adjustStock(p.id, 1)}
                                  className="px-2.5 py-1 hover:bg-slate-200 text-slate-700 font-bold transition"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                <Store className="h-3.5 w-3.5 text-[#F97316]" />
                                Mostrador + Web Local
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => showToast(`Producto ${p.name} sincronizado en BD`)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                                title="Guardar producto"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MÓDULO 3: VENTAS MOSTRADOR & WEB (POS OPERATIVO)           */}
          {/* ======================================================== */}
          {activeTab === 'pos' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-xs border-t-2 border-[#F97316] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Turno y Cajero
                    </span>
                    <span className="text-sm font-bold text-slate-900 mt-1">
                      {profile?.fullName || user.email.split('@')[0]}
                    </span>
                    <span className="text-[11px] text-[#EA580C] font-mono mt-0.5">
                      08:30 - 13:30 (Mañana)
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
                    <Store className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-xs border-t-2 border-[#F97316] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Boletas Emitidas
                    </span>
                    <span className="text-xl font-bold text-slate-900 mt-1">34 boletas</span>
                    <span className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      100% DIAN transmitidas
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
                    <Receipt className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-xs border-t-2 border-[#F97316] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Total Caja Turno
                    </span>
                    <span className="text-xl font-bold text-slate-900 mt-1">$428,500 COP</span>
                    <span className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      ✓ Conciliado
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-xs border-t-2 border-[#F97316] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Ticket Promedio
                    </span>
                    <span className="text-xl font-bold text-slate-900 mt-1">$14,280 COP</span>
                    <span className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      ↑ +8% vs semana pasada
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Área Operativa POS (65% / 35%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Buscador y Lector de Código de Barras */}
                  <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-3">
                    <div className="relative flex items-center">
                      <Search className="absolute left-4 text-[#F97316] h-5 w-5" />
                      <input
                        className="w-full pl-12 pr-28 py-3 bg-slate-50 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F97316] transition-all"
                        placeholder="Escanear código de barra o buscar producto (ej: tornillo, esmalte, taladro)... [F3]"
                        type="text"
                        value={posSearch}
                        onChange={(e) => setPosSearch(e.target.value)}
                      />
                      <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                          F3
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#F97316] text-white font-mono text-[10px] font-bold animate-pulse">
                          LÁSER ACTIVO
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Favoritos de Alta Rotación en Mesón */}
                  <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-[#F97316]" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Favoritos de Alta Rotación en Mesón
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-[#EA580C] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                        Clic rápido para añadir
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {products.slice(0, 6).map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-lg bg-slate-50 hover:bg-orange-50/50 transition-all flex flex-col justify-between gap-3 border border-slate-200/70 hover:border-[#F97316]"
                        >
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-[#EA580C] font-bold">
                              {item.sku}
                            </span>
                            <span className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-slate-400">{item.aisle}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                            <span className="text-sm font-bold text-[#F97316]">
                              ${item.price_cop.toLocaleString('es-CO')}
                            </span>
                            <button
                              onClick={() => addPosItem(item)}
                              className="px-2.5 py-1 rounded bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition active:scale-95"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Sumar</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ticket de Venta Actual */}
                  <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-[#F97316]" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Ticket de Venta en Mesón #0142
                        </h3>
                      </div>
                      <button
                        onClick={clearCart}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-medium transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Limpiar Ticket</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-y border-slate-200">
                            <th className="py-2.5 px-4 rounded-l-lg">Producto / Ubicación</th>
                            <th className="py-2.5 px-4 text-center">Cantidad</th>
                            <th className="py-2.5 px-4 text-right">Precio Unit.</th>
                            <th className="py-2.5 px-4 text-right">Total Línea</th>
                            <th className="py-2.5 px-3 text-center rounded-r-lg w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {posCart.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800">{item.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {item.sku} • {item.aisle}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => updateCartQty(item.id, -1)}
                                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="w-6 text-center font-mono font-bold text-xs">
                                    {item.qty}
                                  </span>
                                  <button
                                    onClick={() => updateCartQty(item.id, 1)}
                                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-600">
                                ${item.price.toLocaleString('es-CO')}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                ${(item.price * item.qty).toLocaleString('es-CO')}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => removeCartItem(item.id)}
                                  className="text-slate-400 hover:text-rose-600 transition"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                          {posCart.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400">
                                Ticket vacío. Haz clic en "Sumar" en los favoritos o busca un producto.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-2 pt-4 bg-slate-50 rounded-xl p-5 flex flex-col gap-2 border border-slate-200/60 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Subtotal Neto</span>
                        <span className="font-mono font-semibold text-slate-800">
                          ${posSubtotalNeto.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[#EA580C]">
                        <span className="flex items-center gap-1.5 font-medium">
                          Descuento Vecino Frecuente (Maestro Club 5%)
                        </span>
                        <span className="font-mono font-bold bg-orange-100/80 text-[#EA580C] px-2 py-0.5 rounded">
                          -${posDiscount.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>IVA (19% Incluido)</span>
                        <span className="font-mono font-semibold text-slate-800">
                          ${posIVA.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                      <div className="mt-3 pt-3 flex items-center justify-between bg-orange-500/10 p-4 rounded-xl border border-orange-300">
                        <div className="flex flex-col">
                          <span className="text-[11px] uppercase tracking-wider text-[#EA580C] font-extrabold">
                            Total a Cobrar
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {posCart.reduce((sum, i) => sum + i.qty, 0)} artículos en ticket
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[#EA580C]">
                            ${posTotalFinal.toLocaleString('es-CO')}
                          </span>
                          <span className="text-xs font-bold text-[#EA580C]">COP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Cliente y Cobro */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Cliente en Mesón
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                        Club Activo
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-3 border border-slate-200/60">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#EA580C] text-white font-bold flex items-center justify-center shrink-0 text-sm">
                          JP
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {posSelectedCustomer === 'regular'
                              ? 'Juan Pérez'
                              : 'Cliente Ocasional'}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate">
                            {posSelectedCustomer === 'regular'
                              ? 'Pasaje 3 #410 • Maestro Club'
                              : 'Venta rápida mostrador'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setPosSelectedCustomer(
                            posSelectedCustomer === 'regular' ? 'occasional' : 'regular'
                          )
                        }
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold text-center transition"
                      >
                        {posSelectedCustomer === 'regular'
                          ? 'Cambiar a Ocasional'
                          : 'Asignar a Juan Pérez'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Forma de Pago
                      </span>
                      <span className="text-[11px] font-semibold text-[#EA580C] bg-orange-50 px-2 py-0.5 rounded-full">
                        Caja Rápida
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => setPosPaymentMethod('efectivo')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition font-bold gap-1.5 ${
                          posPaymentMethod === 'efectivo'
                            ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                            : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <DollarSign className="h-5 w-5" />
                        <span>Efectivo</span>
                      </button>

                      <button
                        onClick={() => setPosPaymentMethod('tarjeta')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition font-bold gap-1.5 ${
                          posPaymentMethod === 'tarjeta'
                            ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                            : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <CreditCard className="h-5 w-5" />
                        <span>Tarjeta POS</span>
                      </button>

                      <button
                        onClick={() => setPosPaymentMethod('qr')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition font-bold gap-1.5 ${
                          posPaymentMethod === 'qr'
                            ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                            : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <QrCode className="h-5 w-5" />
                        <span>Transf. QR</span>
                      </button>

                      <button
                        onClick={() => setPosPaymentMethod('fiado')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition font-bold gap-1.5 ${
                          posPaymentMethod === 'fiado'
                            ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                            : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <FileText className="h-5 w-5" />
                        <span>Cuenta Fiado</span>
                      </button>
                    </div>

                    {posPaymentMethod === 'efectivo' && (
                      <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Billetes Rápidos:</span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <button
                              onClick={() => setCashGiven(posTotalFinal)}
                              className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold hover:bg-orange-50 text-slate-700"
                            >
                              Justo
                            </button>
                            <button
                              onClick={() => setCashGiven(posTotalFinal + 20000)}
                              className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold hover:bg-orange-50 text-slate-700"
                            >
                              +20k
                            </button>
                            <button
                              onClick={() => setCashGiven(500000)}
                              className="px-2 py-0.5 rounded bg-[#F97316] text-white font-bold"
                            >
                              $500k
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <label className="font-semibold text-slate-700">Recibido:</label>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[#F97316] font-bold">
                              $
                            </span>
                            <input
                              className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-right font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                              type="number"
                              value={cashGiven}
                              onChange={(e) => setCashGiven(parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 flex items-center justify-between border border-emerald-200">
                          <span className="font-bold">Vuelto a entregar:</span>
                          <span className="font-mono font-black text-sm text-emerald-800">
                            ${cashChange.toLocaleString('es-CO')} COP
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleCompletePosSale}
                      disabled={posCart.length === 0}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm ${
                        posSaleSuccess
                          ? 'bg-emerald-600 text-white'
                          : posCart.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-[#F97316] hover:bg-[#EA580C] text-white'
                      }`}
                    >
                      {posSaleSuccess ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>¡Venta Exitosa y Boleta Emitida!</span>
                        </>
                      ) : (
                        <>
                          <Printer className="h-4 w-4" />
                          <span>Finalizar Venta y Emitir Boleta [F12]</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MÓDULO 4: PEDIDOS Y RETIRO EN TIENDA (CLICK & COLLECT)    */}
          {/* ======================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Pedidos Online y Retiro en Mesón
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Click & Collect: valida con PIN de 4 dígitos o QR para entregas inmediatas en mostrador.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-[#EA580C] text-xs font-bold border border-orange-200">
                    <Clock className="h-3.5 w-3.5" />
                    Promedio entrega: 14 min
                  </span>
                </div>
              </div>

              {/* Caja de Validación PIN Rápido */}
              <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-[#EA580C] p-6 text-white shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight leading-snug">
                        Entrega Exprés en Mesón
                      </h3>
                      <p className="text-orange-100 text-xs">
                        Ingresa el PIN de 4 dígitos que el cliente recibió por WhatsApp o correo.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleDeliverOrderByPin} className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="Ej: 7492 o FM-001"
                      value={pinLookup}
                      onChange={(e) => setPinLookup(e.target.value)}
                      className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-slate-400 placeholder:font-sans"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow transition active:scale-95"
                    >
                      Validar PIN
                    </button>
                  </form>
                </div>

                {pinAlert && (
                  <div
                    className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      pinAlert.type === 'success'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{pinAlert.msg}</span>
                  </div>
                )}
              </div>

              {/* Tabs de Filtro de Pedidos */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
                <button
                  onClick={() => setOrderFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    orderFilterStatus === 'all'
                      ? 'bg-[#F97316] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Todos ({orders.length})
                </button>
                <button
                  onClick={() => setOrderFilterStatus('preparing')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    orderFilterStatus === 'preparing'
                      ? 'bg-[#F97316] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Por Empacar
                </button>
                <button
                  onClick={() => setOrderFilterStatus('ready_for_pickup')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    orderFilterStatus === 'ready_for_pickup'
                      ? 'bg-[#F97316] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Listos para Retiro
                </button>
                <button
                  onClick={() => setOrderFilterStatus('delivered')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    orderFilterStatus === 'delivered'
                      ? 'bg-[#F97316] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Entregados
                </button>
              </div>

              {/* Lista de Pedidos Click & Collect */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          #{ord.order_number}
                        </span>
                        {ord.status === 'ready_for_pickup' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            Listo para Retiro
                          </span>
                        )}
                        {ord.status === 'preparing' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                            Por Empacar
                          </span>
                        )}
                        {ord.status === 'delivered' && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            Entregado
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(ord.customer_name)}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">
                            {ord.customer_name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {ord.customer_phone}
                          </span>
                        </div>
                      </div>

                      <div className="my-3 p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-xs">
                        <p className="text-slate-700 font-medium leading-relaxed">
                          {ord.items_summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                        <span>PIN Retiro:</span>
                        <span className="font-mono font-bold text-slate-900 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                          {ord.pickup_pin}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">Total Pedido</span>
                        <span className="font-mono font-black text-sm text-[#F97316]">
                          ${ord.total_cop.toLocaleString('es-CO')} COP
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {ord.customer_phone && (
                          <a
                            href={`https://wa.me/57${ord.customer_phone.replace(/\s+/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            title="Notificar por WhatsApp"
                          >
                            <Smartphone className="h-4 w-4" />
                          </a>
                        )}

                        {ord.status === 'preparing' && (
                          <button
                            onClick={() => markOrderStatus(ord.id, 'ready_for_pickup')}
                            className="px-3 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold shadow-xs transition"
                          >
                            Marcar Listo
                          </button>
                        )}

                        {ord.status === 'ready_for_pickup' && (
                          <button
                            onClick={() => markOrderStatus(ord.id, 'delivered')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                          >
                            Entregar en Mesón
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MÓDULO 5: CLIENTES FRECUENTES & ABONOS                    */}
          {/* ======================================================== */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Clientes Frecuentes, Maestros y Cuentas Vecinales
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Libreta de créditos (fiado), abonos en mesón y descuentos del Club Ferretero.
                  </p>
                </div>
              </div>

              {/* 4 KPIs Clientes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border-t-2 border-[#F97316] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold">
                      Clientes Registrados
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">
                      {customers.length}
                    </h3>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Maestros y vecinos activos
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border-t-2 border-[#F97316] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold">
                      Saldo en Cuentas Vecinales
                    </span>
                    <h3 className="text-2xl font-black text-amber-700 mt-1">
                      ${totalOutstandingCredit.toLocaleString('es-CO')}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      COP por cobrar (fiado)
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border-t-2 border-[#F97316] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold">
                      Abonos Recibidos Hoy
                    </span>
                    <h3 className="text-2xl font-black text-emerald-700 mt-1">$890,000</h3>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      ↑ +14% vs semana previa
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border-t-2 border-[#F97316] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold">
                      Cumplimiento de Pago
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">94%</h3>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Alta lealtad de barrio
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Grid 65% / 35% */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 flex flex-col gap-4">
                  {customers.map((c) => {
                    const creditPct =
                      c.credit_limit_cop > 0
                        ? Math.min(100, Math.round((c.credit_balance_cop / c.credit_limit_cop) * 100))
                        : 0;

                    return (
                      <div
                        key={c.id}
                        className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4 hover:shadow-md transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#EA580C] font-black text-sm flex items-center justify-center shrink-0">
                              {getInitials(c.full_name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900">{c.full_name}</h3>
                                <span className="px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-[#EA580C] text-[10px] font-bold">
                                  {c.club_tier}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 font-medium">{c.trade}</span>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <span>{c.phone}</span>
                                <span>•</span>
                                <span>{c.address}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setAbonoCustomerId(c.id);
                                showToast(`Seleccionado para abono: ${c.full_name}`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold shadow-xs transition"
                            >
                              Registrar Abono
                            </button>
                            {c.phone && (
                              <a
                                href={`https://wa.me/57${c.phone.replace(/\s+/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                                title="Enviar recordatorio WhatsApp"
                              >
                                <Smartphone className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 font-medium">Línea de Crédito Utilizada:</span>
                            <span className="font-mono font-bold text-slate-900">
                              ${c.credit_balance_cop.toLocaleString('es-CO')} / $
                              {c.credit_limit_cop.toLocaleString('es-CO')} COP
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                creditPct > 80
                                  ? 'bg-rose-500'
                                  : creditPct > 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${creditPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Compras acumuladas: ${c.total_purchases_cop.toLocaleString('es-CO')} COP</span>
                            <span>{creditPct}% del cupo asignado</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="p-5 rounded-xl bg-white shadow-xs border border-slate-200/80 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-[#F97316]" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Ficha Rápida de Abono
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] text-[10px] font-bold">
                        Caja 01
                      </span>
                    </div>

                    <form onSubmit={handleRecordAbono} className="flex flex-col gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Cliente o Maestro:
                        </label>
                        <select
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-[#F97316]"
                          value={selectedAbonoCustomer?.id}
                          onChange={(e) => setAbonoCustomerId(e.target.value)}
                        >
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.full_name} (${c.credit_balance_cop.toLocaleString('es-CO')} deudor)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900 flex justify-between items-center font-mono">
                        <span>Deuda Pendiente:</span>
                        <span className="font-bold text-sm">
                          ${selectedAbonoCustomer?.credit_balance_cop.toLocaleString('es-CO')} COP
                        </span>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Monto del Abono (COP):
                        </label>
                        <input
                          type="number"
                          step={5000}
                          value={abonoAmount}
                          onChange={(e) => setAbonoAmount(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-[#F97316]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Medio de Pago:
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAbonoPaymentMethod('efectivo')}
                            className={`py-1.5 text-center rounded-lg border font-bold ${
                              abonoPaymentMethod === 'efectivo'
                                ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            Efectivo
                          </button>
                          <button
                            type="button"
                            onClick={() => setAbonoPaymentMethod('transferencia')}
                            className={`py-1.5 text-center rounded-lg border font-bold ${
                              abonoPaymentMethod === 'transferencia'
                                ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            Transf.
                          </button>
                          <button
                            type="button"
                            onClick={() => setAbonoPaymentMethod('tarjeta')}
                            className={`py-1.5 text-center rounded-lg border font-bold ${
                              abonoPaymentMethod === 'tarjeta'
                                ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            Tarjeta
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold transition shadow-sm mt-2"
                      >
                        Registrar Abono en Mesón
                      </button>
                    </form>
                  </div>

                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-slate-700 text-xs flex flex-col gap-2">
                    <span className="font-bold text-[#EA580C] flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      Reglas de Crédito Vecinal FerroMax:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>Pago máximo a 30 días calendario.</li>
                      <li>Descuento adicional de 2% por pago antes del día 15.</li>
                      <li>Límite de fiado bloqueado automáticamente al superar el cupo.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MÓDULO 6: CONFIGURACIÓN DE CAJA & ARQUEO DE EFECTIVO      */}
          {/* ======================================================== */}
          {activeTab === 'cash' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Cierre de Caja y Arqueo Físico de Efectivo
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Conciliación de gaveta, desglose de billetes en pesos colombianos y estado de periféricos.
                  </p>
                </div>
                <button
                  onClick={handleSaveArqueo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold shadow-sm transition"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar Arqueo y Generar Acta</span>
                </button>
              </div>

              {/* Grid 65% / 35% */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Estado de Periféricos */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Estado de Periféricos de Caja
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col gap-1">
                        <span className="font-bold">Gaveta de Dinero</span>
                        <span className="text-[10px] text-emerald-600">● Conectada (RJ11)</span>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col gap-1">
                        <span className="font-bold">Impresora 80mm</span>
                        <span className="text-[10px] text-emerald-600">● En línea (Térmica)</span>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col gap-1">
                        <span className="font-bold">Lector de Códigos</span>
                        <span className="text-[10px] text-emerald-600">● Láser Activo</span>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col gap-1">
                        <span className="font-bold">Datáfono POS</span>
                        <span className="text-[10px] text-emerald-600">● Conectado (Redelcom)</span>
                      </div>
                    </div>
                  </div>

                  {/* Desglose de Billetes y Monedas (COP) */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-[#F97316]" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Conteo Físico por Denominación (Pesos Colombianos)
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        Cálculo en vivo
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {[
                        { denom: '50000', label: '$50.000', sub: 'Billete Morado' },
                        { denom: '20000', label: '$20.000', sub: 'Billete Naranja' },
                        { denom: '10000', label: '$10.000', sub: 'Billete Azul Marino' },
                        { denom: '5000', label: '$5.000', sub: 'Billete Café' },
                        { denom: '2000', label: '$2.000', sub: 'Billete Celeste' },
                        { denom: '1000', label: '$1.000', sub: 'Billete Verde' },
                        { denom: '500', label: 'Monedas', sub: 'Monedas Mixtas' },
                      ].map((d) => {
                        const count = cashDenominations[d.denom] || 0;
                        const subtotal = parseInt(d.denom) * count;
                        return (
                          <div
                            key={d.denom}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between gap-2"
                          >
                            <div>
                              <span className="font-bold text-sm text-slate-900 block font-mono">
                                {d.label}
                              </span>
                              <span className="text-[10px] text-slate-400">{d.sub}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => alterDenominationQty(d.denom, -1)}
                                className="w-7 h-7 rounded bg-white border border-slate-200 text-slate-800 font-bold hover:bg-slate-100"
                              >
                                -
                              </button>
                              <span className="flex-1 text-center font-mono font-bold text-xs">
                                {count}
                              </span>
                              <button
                                onClick={() => alterDenominationQty(d.denom, 1)}
                                className="w-7 h-7 rounded bg-white border border-slate-200 text-slate-800 font-bold hover:bg-slate-100"
                              >
                                +
                              </button>
                            </div>

                            <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] font-mono">
                              <span className="text-slate-400">Subtotal:</span>
                              <span className="font-bold text-slate-800">
                                ${subtotal.toLocaleString('es-CO')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Conciliación */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-3 text-xs">
                    <span className="font-bold uppercase tracking-wider text-slate-500">
                      Resumen del Turno Actual
                    </span>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Fondo Inicial de Caja:</span>
                      <span className="font-mono font-bold text-slate-800">$200,000 COP</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Ventas en Efectivo:</span>
                      <span className="font-mono font-bold text-slate-800">$1,195,000 COP</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Ventas con Datáfono / POS:</span>
                      <span className="font-mono font-bold text-slate-800">$428,500 COP</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Transferencias QR (Nequi):</span>
                      <span className="font-mono font-bold text-slate-800">$90,000 COP</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-900 text-white shadow-md flex flex-col gap-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                        Total Contado en Gaveta
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-black text-[#F97316] font-mono">
                          ${totalCashCounted.toLocaleString('es-CO')}
                        </span>
                        <span className="text-xs text-orange-200 font-bold">COP</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Esperado en Sistema:</span>
                      <span className="font-mono font-bold text-slate-200">
                        ${expectedCashInDrawer.toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs font-bold ${
                        cashDifference === 0
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : cashDifference > 0
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      <span>
                        {cashDifference === 0
                          ? 'Caja Cuadrada Exacta'
                          : cashDifference > 0
                          ? 'Sobrante en Caja'
                          : 'Faltante en Caja'}
                      </span>
                      <span className="font-mono text-sm">
                        {cashDifference >= 0 ? '+' : ''}${cashDifference.toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    <button
                      onClick={handleSaveArqueo}
                      className="w-full py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs transition shadow-sm"
                    >
                      Confirmar Cierre de Turno
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
