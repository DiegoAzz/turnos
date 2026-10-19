"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Users,
  Calendar,
  DollarSign,
  Plus,
  ExternalLink,
  Power,
  KeyRound,
  Trash2,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Search,
  Sparkles,
  ArrowRight,
  Copy,
  MessageCircle,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import AdminPartnersManager from "@/components/AdminPartnersManager";
import AdminPaymentSettings from "@/components/AdminPaymentSettings";

interface BusinessAdmin {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  currency: string;
  plan: string;
  category?: string;
  serviceModality?: string;
  active: boolean;
  adminPin: string;
  createdAt: string;
  totalCitas: number;
  totalServicios: number;
  totalIngresos: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"BUSINESSES" | "PARTNERS" | "PAYMENTS">("BUSINESSES");

  // Formulario nueva empresa
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    currency: "COP",
    category: "MANICURA_SPA",
    serviceModality: "HIBRIDO",
    plan: "PRO",
    adminPin: "1234",
  });
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Cargar empresas
  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/businesses");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.businesses) {
        setBusinesses(data.businesses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  // Generar slug automático cuando cambia el nombre
  const handleNameChange = (name: string) => {
    const autoSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, name, slug: autoSlug }));
  };

  // Crear empresa
  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);

    try {
      const res = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Error al crear la empresa.");
      } else {
        setIsModalOpen(false);
        setFormData({
          name: "",
          slug: "",
          email: "",
          phone: "",
          currency: "COP",
          category: "MANICURA_SPA",
          serviceModality: "HIBRIDO",
          plan: "PRO",
          adminPin: "1234",
        });
        loadBusinesses();
      }
    } catch (err) {
      setFormError("Error de conexión al servidor.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Cambiar estado activo/suspendido
  const toggleActiveStatus = async (business: BusinessAdmin) => {
    try {
      setActionLoading(business.id);
      const res = await fetch("/api/admin/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: business.id, active: !business.active }),
      });

      if (res.ok) {
        setBusinesses((prev) =>
          prev.map((b) => (b.id === business.id ? { ...b, active: !b.active } : b))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Cambiar Plan
  const togglePlan = async (business: BusinessAdmin) => {
    const cycle: Record<string, string> = {
      FREE: "INDEPENDIENTE",
      INDEPENDIENTE: "PRO",
      PRO: "SUPERADMIN",
      SUPERADMIN: "FREE",
    };
    const nextPlan = cycle[business.plan] || "PRO";
    try {
      setActionLoading(business.id);
      const res = await fetch("/api/admin/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: business.id, plan: nextPlan }),
      });

      if (res.ok) {
        setBusinesses((prev) =>
          prev.map((b) => (b.id === business.id ? { ...b, plan: nextPlan } : b))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Cambiar PIN
  const handleEditPin = async (business: BusinessAdmin) => {
    const newPin = prompt(`Ingresa nuevo PIN para "${business.name}" (actual: ${business.adminPin}):`, business.adminPin);
    if (!newPin || newPin.trim() === "" || newPin === business.adminPin) return;

    try {
      setActionLoading(business.id);
      const res = await fetch("/api/admin/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: business.id, adminPin: newPin.trim() }),
      });

      if (res.ok) {
        setBusinesses((prev) =>
          prev.map((b) => (b.id === business.id ? { ...b, adminPin: newPin.trim() } : b))
        );
        alert("PIN actualizado con éxito.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Copiar credenciales para enviar al cliente por WhatsApp
  const handleCopyCredentials = (business: BusinessAdmin) => {
    const text = `¡Hola! Aquí tienes los datos para acceder al panel de tu negocio en TurnoYa:
🔗 Enlace de acceso: https://turnos.appzplay.online/login
📧 Usuario: ${business.email} (o slug: ${business.slug})
🔑 Contraseña / PIN: ${business.adminPin}
🌐 Tu página de reservas: https://turnos.appzplay.online/p/${business.slug}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert(`¡Credenciales de "${business.name}" copiadas!\nPuedes pegarlas directamente en WhatsApp al cliente.`);
    } else {
      prompt("Copia los datos de acceso:", text);
    }
  };

  // Eliminar empresa
  const handleDeleteBusiness = async (business: BusinessAdmin) => {
    const confirmDelete = confirm(
      `¿Estás seguro de que deseas eliminar permanentemente a "${business.name}"?\nEsta acción borrará todos sus servicios y citas asociadas.`
    );
    if (!confirmDelete) return;

    try {
      setActionLoading(business.id);
      const res = await fetch(`/api/admin/businesses?id=${business.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setBusinesses((prev) => prev.filter((b) => b.id !== business.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Entrar al dashboard de esa empresa
  const handleAccessDashboard = async (slug: string) => {
    try {
      await fetch("/api/admin/switch-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  // Cerrar sesión
  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  // Métricas
  const totalEmpresas = businesses.length;
  const empresasActivas = businesses.filter((b) => b.active).length;
  const totalCitasGlobales = businesses.reduce((acc, b) => acc + b.totalCitas, 0);
  const totalIngresosGlobales = businesses.reduce((acc, b) => acc + b.totalIngresos, 0);

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* NAVBAR SUPER ADMIN */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">TurnoYa</span>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Control Central Multiempresa</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition flex items-center gap-1.5"
            >
              <span>Ver Web Pública</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* HEADER DE BIENVENIDA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Panel Maestro de Clientes</h1>
            <p className="text-sm text-slate-400 mt-1">
              Gestiona todas las empresas suscritas a TurnoYa, sus accesos, planes y estado operativo.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 text-sm shadow-lg shadow-emerald-500/25 transition"
          >
            <Plus className="h-5 w-5" />
            <span>+ Dar de Alta Empresa</span>
          </button>
        </div>

        {/* TABS SUPER ADMIN: EMPRESAS vs RED DE EMBAJADORES */}
        <div className="flex border-b border-slate-800 space-x-2">
          <button
            onClick={() => setActiveTab("BUSINESSES")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "BUSINESSES"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Empresas & Negocios ({totalEmpresas})
          </button>
          <button
            onClick={() => setActiveTab("PARTNERS")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "PARTNERS"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="h-4 w-4" />
            Red de Embajadores & Comisiones Residuales
          </button>
          <button
            onClick={() => setActiveTab("PAYMENTS")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "PAYMENTS"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Pasarela & Métodos de Pago
          </button>
        </div>

        {activeTab === "BUSINESSES" ? (
          <>
            {/* MÉTRICAS GLOBALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Empresas</span>
              <Building2 className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">{totalEmpresas}</p>
            <span className="text-xs text-slate-400 mt-1 block">Registradas en el sistema</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Empresas Activas</span>
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-400 mt-3">{empresasActivas}</p>
            <span className="text-xs text-slate-400 mt-1 block">Generando reservas en vivo</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Citas Agendadas</span>
              <Calendar className="h-5 w-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">{totalCitasGlobales}</p>
            <span className="text-xs text-slate-400 mt-1 block">Historial acumulado</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Volumen Facturado</span>
              <DollarSign className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold text-amber-400 mt-3">
              {formatCurrency(totalIngresosGlobales, "USD")}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">Valor estimado de citas</span>
          </div>
        </div>

        {/* TABLA DE EMPRESAS */}
        <div className="bg-slate-800/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-400" />
              <h2 className="font-bold text-white text-base">Directorio de Empresas Conectadas</h2>
            </div>

            {/* Búsqueda */}
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por nombre, slug o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-r-transparent"></div>
              <p className="mt-3 text-sm">Cargando directorio de empresas...</p>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Building2 className="h-10 w-10 mx-auto text-slate-600 mb-2" />
              <p className="text-base font-semibold text-slate-300">No hay empresas encontradas</p>
              <p className="text-xs text-slate-500 mt-1">Crea una nueva empresa con el botón superior.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Empresa & Enlace</th>
                    <th className="py-3.5 px-4">Contacto</th>
                    <th className="py-3.5 px-4">Plan</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4">PIN Acceso</th>
                    <th className="py-3.5 px-4 text-center">Citas</th>
                    <th className="py-3.5 px-4 text-right">Acciones de Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredBusinesses.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/30 transition">
                      {/* Empresa */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{b.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                            {b.category === "MANICURA_SPA"
                              ? "💅 Manicura/Spa"
                              : b.category === "BARBERIA"
                              ? "💈 Barbería"
                              : b.category === "LAVADERO"
                              ? "🚗 Lavadero"
                              : b.category === "SALUD_CONSULTORIO"
                              ? "🩺 Salud"
                              : "⚡ General"}
                          </span>
                          {b.serviceModality === "DOMICILIO" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                              🚗 Domicilio
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Link
                            href={`/p/${b.slug}`}
                            target="_blank"
                            className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span>/p/{b.slug}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="py-4 px-4 text-slate-300">
                        <div>{b.email}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{b.phone || "Sin WhatsApp"}</div>
                      </td>

                      {/* Plan */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => togglePlan(b)}
                          title="Clic para rotar de plan (FREE -> INDEPENDIENTE -> PRO -> SUPERADMIN)"
                          disabled={actionLoading === b.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                            b.plan === "SUPERADMIN"
                              ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-300 font-black shadow-sm"
                              : b.plan === "PRO"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                              : b.plan === "INDEPENDIENTE"
                              ? "bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20"
                              : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
                          }`}
                        >
                          <Sparkles className="h-3 w-3" />
                          {b.plan === "SUPERADMIN" ? "👑 SUPER ADMIN" : b.plan}
                        </button>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleActiveStatus(b)}
                          title="Clic para suspender o activar"
                          disabled={actionLoading === b.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                            b.active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              b.active ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          />
                          {b.active ? "Activo" : "Suspendido"}
                        </button>
                      </td>

                      {/* PIN y Credenciales */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditPin(b)}
                            title="Clic para cambiar PIN / Contraseña"
                            className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-300 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg hover:border-slate-500 transition"
                          >
                            <KeyRound className="h-3 w-3 text-amber-400" />
                            <span>{b.adminPin}</span>
                          </button>

                          <button
                            onClick={() => handleCopyCredentials(b)}
                            title="Copiar credenciales de acceso para enviárselas al cliente por WhatsApp"
                            className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700 rounded-lg transition"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Citas */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-white text-sm">{b.totalCitas}</span>
                        <span className="text-[10px] text-slate-500 block">
                          {formatCurrency(b.totalIngresos, b.currency)}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAccessDashboard(b.slug)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm flex items-center gap-1 transition"
                            title="Entrar a administrar este negocio"
                          >
                            <span>Panel</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => handleDeleteBusiness(b)}
                            disabled={actionLoading === b.id}
                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700/50 transition"
                            title="Eliminar empresa permanentemente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        ) : activeTab === "PARTNERS" ? (
          <AdminPartnersManager />
        ) : (
          <AdminPaymentSettings />
        )}
      </main>

      {/* MODAL PARA DAR DE ALTA NUEVA EMPRESA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Alta de Nueva Empresa</h3>
                  <p className="text-xs text-slate-400">Configura el negocio de tu nuevo cliente</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBusiness} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre de la Empresa o Negocio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Spa & Belleza Andrea"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enlace Web / Slug *
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-400">
                  <span>turnos.appzplay.online/p/</span>
                  <input
                    type="text"
                    required
                    placeholder="spa-andrea"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 bg-transparent text-emerald-400 font-semibold focus:outline-none ml-0.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Correo del Dueño *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="andrea@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp del Negocio
                  </label>
                  <input
                    type="text"
                    placeholder="+52155..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rubro / Tipo de Negocio *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MANICURA_SPA">💅 Manicura, Uñas & Spa (45 a 120 min)</option>
                    <option value="BARBERIA">💈 Barbería / Peluquería (20 a 45 min)</option>
                    <option value="LAVADERO">🚗 Lavadero de Autos / Detailing (45 a 90 min)</option>
                    <option value="SALUD_CONSULTORIO">🩺 Salud / Terapia / Consultorio</option>
                    <option value="OTRO">⚡ Otro rubro / Servicios generales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Modalidad de Atención *
                  </label>
                  <select
                    value={formData.serviceModality}
                    onChange={(e) => setFormData({ ...formData, serviceModality: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="HIBRIDO">🔄 Híbrido (En Local y Domicilio)</option>
                    <option value="DOMICILIO">🚗 Solo a Domicilio (Manicuristas / Detailing)</option>
                    <option value="LOCAL">🏢 Solo en Local Físico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Moneda
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="COP">COP ($ Pesos)</option>
                    <option value="USD">USD ($ Dólar)</option>
                    <option value="MXN">MXN ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Plan
                  </label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="SUPERADMIN">👑 SUPER ADMIN (Demo / Ventas Ilimitada - Sin Cobros)</option>
                    <option value="PRO">PRO ($19 USD - Contabilidad & APK)</option>
                    <option value="INDEPENDIENTE">INDEPENDIENTE ($9 USD - Domicilio)</option>
                    <option value="FREE">FREE ($0)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contraseña / PIN de Acceso *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1234"
                    value={formData.adminPin}
                    onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="mt-1 text-[11px] text-emerald-400">
                    🔑 Esta es la clave con la que el cliente ingresa a su panel.
                  </p>
                </div>
              </div>

              {/* GUIA DE ACCESO PARA EL CLIENTE */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>¿Cómo entra tu cliente a su panel de control?</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  El cliente abrirá la URL: <strong className="text-white">turnos.appzplay.online/login</strong>
                </p>
                <p className="text-[11px] text-slate-400">
                  • <strong>Usuario:</strong> Su correo (<span className="text-white">{formData.email || "andrea@ejemplo.com"}</span>) o slug (<span className="text-white">{formData.slug || "spa-andrea"}</span>)
                </p>
                <p className="text-[11px] text-slate-400">
                  • <strong>Contraseña / PIN:</strong> <span className="text-emerald-400 font-mono font-bold">{formData.adminPin || "1234"}</span>
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg transition"
                >
                  {formSubmitting ? "Creando..." : "Dar de Alta Negocio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
