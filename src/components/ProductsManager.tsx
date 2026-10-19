"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  Package,
  TrendingUp,
  AlertTriangle,
  Search,
  Trash2,
  Edit2,
  DollarSign,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  CreditCard,
  Lock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  costPrice: number | null;
  stock: number;
  category: string;
  imageUrl: string | null;
  active: boolean;
  _count?: { sales: number };
}

interface Sale {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paymentMethod: string;
  clientName: string | null;
  date: string;
  product?: { name: string; category: string };
}

export default function ProductsManager({ business }: { business: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);

  // Formulario de Producto
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    costPrice: "",
    stock: "10",
    category: "CUIDADO",
    imageUrl: "",
  });
  const [productSubmitting, setProductSubmitting] = useState(false);

  // Formulario de Venta Rápida
  const [sellForm, setSellForm] = useState({
    quantity: "1",
    paymentMethod: "EFECTIVO",
    clientName: "",
  });
  const [sellSubmitting, setSellSubmitting] = useState(false);

  // Cargar productos y ventas
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products?businessId=${business.id}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setSales(data.recentSales || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [business.id]);

  // Abrir modal de nuevo producto o edición
  const handleOpenProductModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name,
        description: prod.description || "",
        price: prod.price.toString(),
        costPrice: (prod.costPrice || 0).toString(),
        stock: prod.stock.toString(),
        category: prod.category || "GENERAL",
        imageUrl: prod.imageUrl || "",
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        costPrice: "",
        stock: "10",
        category: business.category === "MANICURA_SPA" ? "BELLEZA" : "CUIDADO",
        imageUrl: "",
      });
    }
    setIsProductModalOpen(true);
  };

  // Guardar producto (Crear o Editar)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      alert("Por favor completa el nombre y el precio.");
      return;
    }

    try {
      setProductSubmitting(true);
      if (editingProduct) {
        // Editar
        const res = await fetch("/api/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            ...productForm,
          }),
        });
        if (!res.ok) throw new Error("Error al actualizar");
      } else {
        // Crear
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business.id,
            ...productForm,
          }),
        });
        if (!res.ok) throw new Error("Error al crear producto");
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Error al guardar el producto");
    } finally {
      setProductSubmitting(false);
    }
  };

  // Eliminar producto
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`¿Seguro que deseas eliminar "${name}" del catálogo?`)) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("No se pudo eliminar el producto.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Abrir modal de venta rápida
  const handleOpenSellModal = (prod: Product) => {
    setSellingProduct(prod);
    setSellForm({
      quantity: "1",
      paymentMethod: "EFECTIVO",
      clientName: "",
    });
    setIsSellModalOpen(true);
  };

  // Ejecutar venta rápida
  const handleExecuteSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingProduct) return;

    try {
      setSellSubmitting(true);
      const res = await fetch("/api/products/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: sellingProduct.id,
          quantity: sellForm.quantity,
          paymentMethod: sellForm.paymentMethod,
          clientName: sellForm.clientName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar la venta");

      setIsSellModalOpen(false);
      alert(`¡Venta de "${sellingProduct.name}" registrada con éxito! Ingreso sumado a caja.`);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Error al registrar la venta");
    } finally {
      setSellSubmitting(false);
    }
  };

  // Si no tiene Plan PRO, mostrar banner de bloqueo para motivar la suscripción
  const isPro = business?.plan === "PRO" || business?.plan === "SUPERADMIN";
  if (!isPro) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50/60 to-white p-8 text-center max-w-2xl mx-auto shadow-sm my-6">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-7 w-7" />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 mb-2">
          <Sparkles className="h-3 w-3" />
          Función Exclusiva del Plan PRO
        </span>
        <h3 className="text-xl font-bold text-gray-900 mt-1">
          Control de Inventario & Punto de Venta (POS)
        </h3>
        <p className="text-xs text-gray-600 mt-2 max-w-lg mx-auto leading-relaxed">
          Vende productos en mostrador (ceras, esmaltes, aceites, shampoos, tratamientos), controla tu stock en tiempo real con alertas de inventario bajo, cobra con Nequi o Efectivo y muestra tus artículos en tu enlace público de reservas.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="/dashboard/suscripcion"
            style={{ backgroundColor: "#059669", color: "#ffffff" }}
            className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-90 transition inline-flex items-center justify-center"
          >
            Actualizar al Plan PRO ($19/mes)
          </a>
        </div>
      </div>
    );
  }

  // Métricas
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const inventoryValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);
  const lowStockCount = products.filter((p) => p.stock <= 3).length;
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.total, 0);

  // Filtrado de productos
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === "ALL" || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Productos */}
        <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Total Catálogo</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
              {products.length}
            </span>
            <span className="text-[11px] text-gray-400">{totalStockUnits} unidades en stock</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Package className="h-6 w-6" />
          </div>
        </div>

        {/* Valor de Inventario */}
        <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Valor Inventario</span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
              {formatCurrency(inventoryValue, business.currency)}
            </span>
            <span className="text-[11px] text-gray-400">En mercancía lista</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Ventas Registradas */}
        <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Ventas de Productos</span>
            <span className="text-2xl font-extrabold text-blue-700 mt-1 block">
              {formatCurrency(totalSalesRevenue, business.currency)}
            </span>
            <span className="text-[11px] text-gray-400">{sales.length} ventas registradas</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Alerta de Stock Bajo */}
        <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 block">Alerta de Stock</span>
            <span
              className={`text-2xl font-extrabold mt-1 block ${
                lowStockCount > 0 ? "text-amber-600" : "text-gray-900"
              }`}
            >
              {lowStockCount}
            </span>
            <span className="text-[11px] text-gray-400">
              {lowStockCount > 0 ? "Productos por agotarse" : "Stock en nivel óptimo"}
            </span>
          </div>
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
              lowStockCount > 0 ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"
            }`}
          >
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS: BÚSQUEDA Y BOTONES DE ACCIÓN */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="CUIDADO">Capilar / Barba</option>
            <option value="BELLEZA">Manicura & Belleza</option>
            <option value="ACCESORIOS">Accesorios & Otros</option>
            <option value="GENERAL">General</option>
          </select>
        </div>

        <button
          onClick={() => handleOpenProductModal()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 text-xs shadow-md shadow-emerald-600/20 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* CATÁLOGO DE PRODUCTOS */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="mt-2 text-xs font-medium">Cargando inventario de productos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-400">
          <ShoppingBag className="h-10 w-10 mx-auto text-gray-300 mb-2" />
          <p className="font-bold text-gray-700 text-sm">No hay productos en esta vista</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Agrega productos que vendas en tu local o a domicilio (ceras, aceites, esmaltes, cremas) para ganar más dinero con cada cliente.
          </p>
          <button
            onClick={() => handleOpenProductModal()}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-500 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Crear Primer Producto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const margin = p.costPrice ? p.price - p.costPrice : p.price;
            const isLowStock = p.stock <= 3;
            const isOutOfStock = p.stock === 0;

            return (
              <div
                key={p.id}
                className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0">
                        🛍️
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          {p.category}
                        </span>
                        <h4 className="font-extrabold text-sm text-gray-900 leading-snug">
                          {p.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenProductModal(p)}
                        className="p-1.5 text-gray-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition"
                        title="Editar producto"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Eliminar producto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {p.description && (
                    <p className="mt-2.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  {/* Precios y Stock */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] font-semibold">
                        Precio Venta
                      </span>
                      <span className="font-extrabold text-gray-900 text-base">
                        {formatCurrency(p.price, business.currency)}
                      </span>
                      {p.costPrice ? (
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          Ganancia: +{formatCurrency(margin, business.currency)}
                        </span>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <span className="text-gray-400 block text-[10px] font-semibold">
                        Inventario
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                          isOutOfStock
                            ? "bg-rose-100 text-rose-800"
                            : isLowStock
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isOutOfStock ? "Agotado" : `${p.stock} disponibles`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón de Venta Rápida */}
                <div className="mt-4 pt-3 border-t border-gray-50">
                  <button
                    disabled={isOutOfStock}
                    onClick={() => handleOpenSellModal(p)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition disabled:opacity-40"
                  >
                    <span>⚡ Vender en Mostrador</span>
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HISTORIAL DE VENTAS RECIENTES */}
      {sales.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">
                Historial de Ventas de Productos
              </h3>
              <p className="text-xs text-gray-500">Últimas salidas de mostrador registradas</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
              Suma a Contabilidad Automáticamente
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Cantidad</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Método de Pago</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-mono text-gray-500">
                      {new Date(s.date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">
                      {s.product?.name || "Producto"}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{s.quantity} unidad(es)</td>
                    <td className="py-2.5 px-3 text-gray-600">{s.clientName || "Mostrador"}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-gray-100 text-gray-700">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                      {formatCurrency(s.total, business.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PRODUCTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900">
                {editingProduct ? "Editar Producto" : "Nuevo Producto en Catálogo"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cera Modeladora Mate / Aceite de Cutícula"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Precio de Venta al Cliente *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Ej. 25000"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Costo de Compra (Opcional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej. 12000"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Stock Inicial *</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Categoría</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CUIDADO">Capilar / Barba</option>
                    <option value="BELLEZA">Manicura & Belleza</option>
                    <option value="ACCESORIOS">Accesorios & Cosmética</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Descripción o Beneficios (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Fijación extra fuerte con aroma a madera y acabado sin brillo."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={productSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/25 transition disabled:opacity-50"
                >
                  {productSubmitting ? "Guardando..." : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VENTA RÁPIDA EN MOSTRADOR */}
      {isSellModalOpen && sellingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900">Venta Rápida de Producto</h3>
              <button
                onClick={() => setIsSellModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteSell} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/70">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">
                  Producto a entregar
                </span>
                <h4 className="font-extrabold text-sm text-gray-900 mt-0.5">
                  {sellingProduct.name}
                </h4>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Precio: {formatCurrency(sellingProduct.price, business.currency)}
                  </span>
                  <span className="font-bold text-emerald-700">
                    Stock: {sellingProduct.stock} unidades
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Cantidad a Vender *
                </label>
                <input
                  type="number"
                  min="1"
                  max={sellingProduct.stock}
                  required
                  value={sellForm.quantity}
                  onChange={(e) => setSellForm({ ...sellForm, quantity: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-base font-extrabold text-gray-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Método de Pago Recibido *
                </label>
                <select
                  value={sellForm.paymentMethod}
                  onChange={(e) => setSellForm({ ...sellForm, paymentMethod: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="NEQUI">📱 Nequi</option>
                  <option value="BANCOLOMBIA">🏦 Bancolombia / Transferencia</option>
                  <option value="TARJETA">💳 Tarjeta Débito / Crédito</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Nombre del Cliente (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez / Mostrador"
                  value={sellForm.clientName}
                  onChange={(e) => setSellForm({ ...sellForm, clientName: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Total a cobrar */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <span className="font-bold text-emerald-900">Total a Cobrar:</span>
                <span className="text-lg font-black text-emerald-950">
                  {formatCurrency(
                    sellingProduct.price * (parseInt(sellForm.quantity, 10) || 1),
                    business.currency
                  )}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSellModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sellSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {sellSubmitting ? "Registrando..." : "Cobrar & Descontar Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
