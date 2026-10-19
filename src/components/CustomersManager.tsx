"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Cake,
  Gift,
  Plus,
  MessageCircle,
  Edit2,
  Trash2,
  Sparkles,
  Phone,
  Mail,
  Heart,
  Calendar,
  AlertCircle,
  Share2,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  birthday?: string | null;
  notes?: string | null;
  referredBy?: string | null;
  referralCount: number;
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string | null;
  createdAt: string;
}

export default function CustomersManager({ business }: { business: any }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "BIRTHDAYS_WEEK" | "BIRTHDAYS_MONTH" | "FREQUENT" | "NEW">("ALL");
  const [stats, setStats] = useState({
    totalCustomers: 0,
    birthdaysThisMonthCount: 0,
    totalReferralsMade: 0,
  });

  // Modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formBirthday, setFormBirthday] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formReferredBy, setFormReferredBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal de Promoción Masiva
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoText, setPromoText] = useState(
    `¡Hola {nombre}! 💖 En ${business.name} tenemos una sorpresa especial para ti esta semana. ¡Aprovecha un 15% de descuento en tu próximo servicio! Agenda tu turno aquí: https://turnos.appzplay.online/p/${business.slug}`
  );

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/customers?businessId=${business.id}&q=${encodeURIComponent(searchQuery)}&filter=${activeFilter}`
      );
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, activeFilter]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormBirthday("");
    setFormNotes("");
    setFormReferredBy("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone);
    setFormEmail(customer.email || "");
    setFormBirthday(customer.birthday || "");
    setFormNotes(customer.notes || "");
    setFormReferredBy(customer.referredBy || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      setFormError("Nombre y teléfono/WhatsApp son obligatorios.");
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          customerId: editingCustomer?.id,
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || null,
          birthday: formBirthday.trim() || null,
          notes: formNotes.trim() || null,
          referredBy: formReferredBy.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");

      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name} de tu base de clientes?`)) return;
    try {
      await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
      fetchCustomers();
    } catch (err) {
      console.error("Error eliminando:", err);
    }
  };

  // Helper para enviar felicitación de cumpleaños por WhatsApp
  const handleSendBirthdayGreeting = (customer: Customer) => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    const finalPhone = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;
    const msg = `¡Feliz cumpleaños ${customer.name}! 🎂✨🎉
De parte de todo el equipo de *${business.name}* te deseamos un día maravilloso lleno de bendiciones.

Para celebrarlo contigo, ¡tienes un regalo especial y descuento en tu próximo servicio durante todo tu mes de cumpleaños! 🎁💖

Reserva tu espacio fácilmente aquí:
👉 https://turnos.appzplay.online/p/${business.slug}

¡Te esperamos para consentirte como te mereces!`;

    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Formato de Cumpleaños amigable
  const formatBirthday = (birthdayStr?: string | null) => {
    if (!birthdayStr) return null;
    const parts = birthdayStr.split("-");
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    if (parts.length === 3) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${parseInt(parts[2], 10)} de ${months[monthIdx] || parts[1]}`;
    }
    if (parts.length === 2) {
      const monthIdx = parseInt(parts[0], 10) - 1;
      return `${parseInt(parts[1], 10)} de ${months[monthIdx] || parts[0]}`;
    }
    return birthdayStr;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">
                Base de Datos & CRM de Clientes
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Fidelización, alertas de cumpleaños, notas de preferencias y referidos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPromoModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>Mensaje / Promo</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>+ Registrar Cliente</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold">Total Clientas</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.totalCustomers}</div>
          <p className="text-[10px] text-gray-400 mt-0.5">En tu base de datos</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-4 rounded-2xl border border-rose-200/80 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-bold">🎂 Cumpleaños este Mes</span>
            <Cake className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900">{stats.birthdaysThisMonthCount}</div>
          <button
            onClick={() => setActiveFilter("BIRTHDAYS_MONTH")}
            className="text-[10px] text-rose-700 font-bold hover:underline mt-0.5"
          >
            Ver cumpleañeras →
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold">Amigas Referidas</span>
            <Gift className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">{stats.totalReferralsMade}</div>
          <p className="text-[10px] text-purple-600 font-medium mt-0.5">Por recomendación</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold">Fidelización</span>
            <Heart className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700">100%</div>
          <p className="text-[10px] text-gray-400 mt-0.5">Clientes propios</p>
        </div>
      </div>

      {/* BANNER FESTIVO SI HAY CUMPLEAÑERAS */}
      {stats.birthdaysThisMonthCount > 0 && activeFilter !== "BIRTHDAYS_MONTH" && (
        <div className="p-4 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white rounded-2xl shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl text-xl shrink-0">🎂</div>
            <div>
              <h3 className="font-extrabold text-sm">
                ¡Tienes {stats.birthdaysThisMonthCount} clienta{stats.birthdaysThisMonthCount > 1 ? "s" : ""} que cumple{stats.birthdaysThisMonthCount > 1 ? "n" : ""} años este mes!
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                Aprovecha para felicitarla por WhatsApp y regalarle un descuento para consentirse.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveFilter("BIRTHDAYS_MONTH")}
            className="px-3.5 py-2 bg-white text-rose-700 font-black text-xs rounded-xl hover:bg-rose-50 transition shadow shrink-0"
          >
            Ver y Felicitar
          </button>
        </div>
      )}

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, WhatsApp, o notas (ej: esmalte)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition shrink-0 ${
              activeFilter === "ALL"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Todas ({stats.totalCustomers})
          </button>
          <button
            onClick={() => setActiveFilter("BIRTHDAYS_WEEK")}
            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition flex items-center gap-1 shrink-0 ${
              activeFilter === "BIRTHDAYS_WEEK"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-rose-700 hover:bg-rose-50"
            }`}
          >
            <Cake className="h-3.5 w-3.5" />
            <span>Cumplen Esta Semana</span>
          </button>
          <button
            onClick={() => setActiveFilter("BIRTHDAYS_MONTH")}
            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition flex items-center gap-1 shrink-0 ${
              activeFilter === "BIRTHDAYS_MONTH"
                ? "bg-pink-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-pink-700 hover:bg-pink-50"
            }`}
          >
            <span>🎂 Este Mes ({stats.birthdaysThisMonthCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter("FREQUENT")}
            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition shrink-0 ${
              activeFilter === "FREQUENT"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-purple-700 hover:bg-purple-50"
            }`}
          >
            ⭐ Frecuentes
          </button>
        </div>
      </div>

      {/* LISTADO DE CLIENTES */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
            <span>Cargando directorio de clientas...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            <Users className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p className="font-bold text-gray-600 text-sm">No se encontraron clientes</p>
            <p className="mt-1">
              {searchQuery
                ? "Prueba con otro término de búsqueda."
                : "Tus clientas se registrarán automáticamente cuando agenden o puedes agregar una con el botón + Registrar Cliente."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {customers.map((c) => {
              const bFormatted = formatBirthday(c.birthday);
              return (
                <div
                  key={c.id}
                  className="p-4 hover:bg-gray-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-100 to-purple-100 text-rose-700 flex items-center justify-center font-black text-sm shrink-0 border border-rose-200">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-gray-900">{c.name}</span>
                        {c.totalVisits >= 3 && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">
                            ⭐ Cliente Frecuente
                          </span>
                        )}
                        {c.totalVisits <= 1 && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                            ✨ Nueva
                          </span>
                        )}
                        {bFormatted && (
                          <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold border border-rose-200 flex items-center gap-1">
                            <Cake className="h-3 w-3" />
                            <span>{bFormatted}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          <span>{c.phone}</span>
                        </span>
                        <span>
                          Visitas: <strong className="text-gray-900">{c.totalVisits}</strong>
                        </span>
                        {c.totalSpent > 0 && (
                          <span>
                            Total: <strong className="text-gray-900">{formatCurrency(c.totalSpent, business.currency)}</strong>
                          </span>
                        )}
                        {c.referralCount > 0 && (
                          <span className="text-purple-700 font-bold flex items-center gap-1 bg-purple-50 px-1.5 py-0.5 rounded">
                            <Gift className="h-3 w-3" />
                            <span>{c.referralCount} amigas referidas</span>
                          </span>
                        )}
                        {c.referredBy && (
                          <span className="text-gray-400 text-[11px]">
                            Recomendada por: <strong className="text-gray-600">{c.referredBy}</strong>
                          </span>
                        )}
                      </div>

                      {/* NOTAS Y PREFERENCIAS */}
                      {c.notes && (
                        <div className="mt-2 text-xs bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-1.5 text-amber-900 flex items-start gap-1.5 max-w-xl">
                          <span className="font-bold shrink-0">💅 Notas:</span>
                          <span className="text-amber-800">{c.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACCIONES */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {c.birthday && (
                      <button
                        onClick={() => handleSendBirthdayGreeting(c)}
                        title="Enviar felicitación de cumpleaños por WhatsApp"
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1 border border-rose-200 shadow-sm"
                      >
                        <Cake className="h-3.5 w-3.5 text-rose-600" />
                        <span>Felicitar</span>
                      </button>
                    )}

                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Escribir por WhatsApp"
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition border border-emerald-200 shadow-sm"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>

                    <button
                      onClick={() => handleOpenEdit(c)}
                      title="Editar datos y notas"
                      className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition border border-gray-200"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      title="Eliminar de la lista"
                      className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR CLIENTA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-base text-gray-900">
                  {editingCustomer ? "Editar Ficha de Cliente" : "Registrar Nueva Clienta"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carolina Montoya"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    WhatsApp / Celular *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 3106017261"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    🎂 Fecha de Cumpleaños
                  </label>
                  <input
                    type="text"
                    placeholder="MM-DD (ej: 10-24)"
                    value={formBirthday}
                    onChange={(e) => setFormBirthday(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Mes-Día (ej: 05-18)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ¿Quién la recomendó? (Referido por)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Laura Restrepo (Amiga)"
                  value={formReferredBy}
                  onChange={(e) => setFormReferredBy(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  💅 Notas & Preferencias de la clienta
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej. Esmaltes semipermanentes tonos nude, diseño minimalista, cutícula sensible, le gusta café con poca azúcar..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 shadow-md"
                >
                  {saving ? "Guardando..." : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENVIAR MENSAJE / PROMO */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Enviar Promoción o Novedad por WhatsApp
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Escribe tu mensaje y lánzalo con 1 clic a cualquiera de tus clientas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPromoModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Texto del Mensaje (Usa {"{nombre}"} para personalizar)
                </label>
                <textarea
                  rows={4}
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  <span>¿Cómo funciona?</span>
                </p>
                <p className="text-[11px] text-purple-800">
                  En el listado principal, cada clienta tiene un botón directo de WhatsApp. Al hacer clic en una clienta, se abrirá el chat con este mensaje ya escrito y personalizado con su nombre.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition shadow"
                >
                  Entendido, listo para enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
