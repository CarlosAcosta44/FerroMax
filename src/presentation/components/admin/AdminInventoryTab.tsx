'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertCircle,
  Minus,
  DollarSign,
  Search,
  Filter,
  MapPin,
  Store,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from '@/presentation/components/common/Icons';
import { AdminProduct } from '@/infrastructure/repositories/SupabaseAdminRepository';
import { editProductAction, deleteProductAction } from '@/app/actions/inventoryActions';

export interface AdminInventoryTabProps {
  products: AdminProduct[];
  criticalStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  onAdjustStock: (id: string, delta: number) => Promise<void>;
  onUpdatePrice: (id: string, price: number) => Promise<void>;
  onProductUpdated?: (updated: AdminProduct) => void;
  onProductDeleted?: (id: string) => void;
  showToast: (msg: string) => void;
}

export function AdminInventoryTab({
  products,
  criticalStockCount,
  outOfStockCount,
  totalInventoryValue,
  onAdjustStock,
  onUpdatePrice,
  onProductUpdated,
  onProductDeleted,
  showToast,
}: AdminInventoryTabProps) {
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('all');
  const [inventoryFilterTab, setInventoryFilterTab] = useState<'all' | 'low' | 'out'>('all');

  // Pagination state (10 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [viewingProduct, setViewingProduct] = useState<AdminProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: '',
    price_cop: 0,
    cost_cop: 0,
    stock_quantity: 0,
    min_stock: 0,
    aisle: '',
  });

  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.aisle.toLowerCase().includes(inventorySearch.toLowerCase());

      const matchesCategory =
        inventoryCategory === 'all' || p.category.toLowerCase().includes(inventoryCategory.toLowerCase());

      let matchesTab = true;
      if (inventoryFilterTab === 'low') matchesTab = p.status === 'low';
      if (inventoryFilterTab === 'out') matchesTab = p.status === 'out';

      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [products, inventorySearch, inventoryCategory, inventoryFilterTab]);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setInventorySearch(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setInventoryCategory(val);
    setCurrentPage(1);
  };

  const handleFilterTabChange = (tab: 'all' | 'low' | 'out') => {
    setInventoryFilterTab(tab);
    setCurrentPage(1);
  };

  // Paginated slice
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Modal Handlers
  const openEditModal = (p: AdminProduct) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name,
      price_cop: p.price_cop,
      cost_cop: p.cost_cop,
      stock_quantity: p.stock_quantity,
      min_stock: p.min_stock,
      aisle: p.aisle,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || isSubmittingEdit) return;

    setIsSubmittingEdit(true);
    try {
      const res = await editProductAction({
        id: editingProduct.id,
        name: editForm.name,
        price_cop: editForm.price_cop,
        cost_price_cop: editForm.cost_cop,
        stock_quantity: editForm.stock_quantity,
        min_stock_alert: editForm.min_stock,
      });

      if (res.success) {
        showToast(`Producto "${editForm.name}" actualizado en base de datos`);
        if (onProductUpdated) {
          onProductUpdated({
            ...editingProduct,
            name: editForm.name,
            price_cop: editForm.price_cop,
            cost_cop: editForm.cost_cop,
            stock_quantity: editForm.stock_quantity,
            min_stock: editForm.min_stock,
            aisle: editForm.aisle,
          });
        }
        setEditingProduct(null);
      } else {
        showToast(res.error || 'Error al actualizar producto');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de red al actualizar producto');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct || isSubmittingDelete) return;

    setIsSubmittingDelete(true);
    try {
      const res = await deleteProductAction(deletingProduct.id);
      if (res.success) {
        showToast(`Producto "${deletingProduct.name}" eliminado correctamente`);
        if (onProductDeleted) {
          onProductDeleted(deletingProduct.id);
        }
        setDeletingProduct(null);
      } else {
        showToast(res.error || 'Error al eliminar producto');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de red al eliminar producto');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
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
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Filtro rápido
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              className="px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer outline-none hover:bg-slate-100 focus:ring-2 focus:ring-[#F97316]"
              value={inventoryCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              <option value="Herramientas">Herramientas</option>
              <option value="Pinturas">Pinturas</option>
              <option value="Plomería">Plomería</option>
              <option value="Tornillería">Tornillería / Fijaciones</option>
              <option value="Electricidad">Electricidad</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-[#F97316]" />
            Filtros rápidos:
          </span>
          <button
            onClick={() => handleFilterTabChange('all')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              inventoryFilterTab === 'all'
                ? 'bg-[#F97316] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-[#EA580C]'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => handleFilterTabChange('low')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              inventoryFilterTab === 'low'
                ? 'bg-[#F97316] text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Bajo Stock ({criticalStockCount})
          </button>
          <button
            onClick={() => handleFilterTabChange('out')}
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
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No se encontraron productos</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Prueba cambiando los términos de búsqueda o filtros.</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const marginPercent = Math.round(
                    ((p.price_cop - p.cost_cop) / (p.cost_cop || 1)) * 100
                  );
                  return (
                    <tr key={p.id} className="hover:bg-orange-50/25 transition-colors group">
                      <td className="py-3 px-4">
                        <div
                          onClick={() => setViewingProduct(p)}
                          className="flex items-center gap-3 cursor-pointer"
                          title="Clic para ver detalles completos del producto"
                        >
                          <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden group-hover:border-[#F97316] transition">
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
                            <span className="text-slate-900 font-bold truncate max-w-xs group-hover:text-[#EA580C] transition">
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
                                onUpdatePrice(p.id, parseInt(e.target.value) || p.price_cop)
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
                            onClick={() => onAdjustStock(p.id, -1)}
                            className="px-2.5 py-1 hover:bg-slate-200 text-slate-700 font-bold transition"
                            title="Disminuir stock en 1"
                          >
                            -
                          </button>
                          <span className="w-10 text-center bg-white font-mono font-bold text-xs py-1 text-slate-900 border-x border-slate-200">
                            {p.stock_quantity}
                          </span>
                          <button
                            onClick={() => onAdjustStock(p.id, 1)}
                            className="px-2.5 py-1 hover:bg-slate-200 text-slate-700 font-bold transition"
                            title="Aumentar stock en 1"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Store className="h-3.5 w-3.5 text-[#F97316]" />
                          Mostrador + Web
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#EA580C] hover:bg-orange-50 transition"
                            title="Ver ficha técnica y detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Editar producto"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Eliminar producto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación de 10 productos */}
        {filteredProducts.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Mostrando <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> a{' '}
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * pageSize, filteredProducts.length)}
              </span>{' '}
              de <span className="font-bold text-slate-800">{filteredProducts.length}</span> productos
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                        currentPage === pageNum
                          ? 'bg-[#F97316] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 font-medium"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. MODAL DETALLE DE PRODUCTO                              */}
      {/* ========================================================= */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#F97316]" />
                <h3 className="font-extrabold text-sm text-slate-900">Ficha Detallada del Producto</h3>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="flex gap-4 items-start">
                <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {viewingProduct.image_url ? (
                    <img src={viewingProduct.image_url} alt={viewingProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-10 w-10 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded bg-orange-100 text-[#EA580C] text-[10px] font-bold uppercase tracking-wider mb-1">
                    {viewingProduct.category}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 leading-snug">{viewingProduct.name}</h4>
                  <div className="flex items-center gap-3 mt-1.5 text-slate-500 font-mono text-[11px]">
                    <span>SKU: {viewingProduct.sku}</span>
                    <span>•</span>
                    <span className="text-[#EA580C] font-semibold flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {viewingProduct.aisle}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid de precios y stock */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Precio Venta (PVP)</span>
                  <span className="text-lg font-black text-[#EA580C] font-mono mt-0.5 block">
                    ${viewingProduct.price_cop.toLocaleString('es-CO')} COP
                  </span>
                  <span className="text-[10px] text-slate-400">IVA 19% Incluido</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Costo Proveedor</span>
                  <span className="text-lg font-black text-slate-700 font-mono mt-0.5 block">
                    ${viewingProduct.cost_cop.toLocaleString('es-CO')} COP
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    +{Math.round(((viewingProduct.price_cop - viewingProduct.cost_cop) / (viewingProduct.cost_cop || 1)) * 100)}% margen
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Stock en Mostrador</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                    {viewingProduct.stock_quantity} unidades
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Alerta mínima: {viewingProduct.min_stock}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Estado Operativo</span>
                  <div className="mt-1">
                    {viewingProduct.status === 'ok' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Stock Normal
                      </span>
                    )}
                    {viewingProduct.status === 'low' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        Bajo Stock
                      </span>
                    )}
                    {viewingProduct.status === 'out' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                        <Minus className="h-3.5 w-3.5 text-rose-600" />
                        Agotado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ID de base de datos */}
              <div className="p-3 rounded-lg bg-slate-100/70 border border-slate-200 text-[11px] font-mono text-slate-500">
                <span className="font-bold text-slate-700 block mb-0.5">ID Único en Supabase (UUID):</span>
                <span className="select-all break-all">{viewingProduct.id}</span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const p = viewingProduct;
                  setViewingProduct(null);
                  openEditModal(p);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Editar Producto</span>
              </button>
              <button
                onClick={() => setViewingProduct(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MODAL EDICIÓN DE PRODUCTO                              */}
      {/* ========================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Editar Datos del Producto</h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Comercial del Producto</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#F97316] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Precio Venta (COP)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.price_cop}
                    onChange={(e) => setEditForm({ ...editForm, price_cop: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-[#F97316] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Costo Proveedor (COP)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.cost_cop}
                    onChange={(e) => setEditForm({ ...editForm, cost_cop: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-[#F97316] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Físico Actual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.stock_quantity}
                    onChange={(e) => setEditForm({ ...editForm, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-[#F97316] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alerta Stock Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.min_stock}
                    onChange={(e) => setEditForm({ ...editForm, min_stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-[#F97316] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pasillo / Ubicación en Tienda</label>
                <input
                  type="text"
                  value={editForm.aisle}
                  onChange={(e) => setEditForm({ ...editForm, aisle: e.target.value })}
                  placeholder="Ej: Pasillo 1 - Estante A"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#F97316] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold transition disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL CONFIRMACIÓN DE ELIMINACIÓN                      */}
      {/* ========================================================= */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 mb-1">¿Eliminar este producto?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Esta acción dará de baja el producto{' '}
              <strong className="text-slate-800">"{deletingProduct.name}"</strong> (SKU: {deletingProduct.sku}) del catálogo.
            </p>

            <div className="flex items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition disabled:opacity-50 flex-1 shadow-xs"
              >
                {isSubmittingDelete ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
