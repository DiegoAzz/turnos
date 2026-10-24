"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Scissors,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Lock,
  ExternalLink,
  Edit2,
  Trash2,
  Phone,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Award,
  Crown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BarberStats {
  today: {
    servicesCount: number;
    totalBilled: number;
    commissionEarned: number;
    businessShare: number;
  };
  month: {
    servicesCount: number;
    totalBilled: number;
    commissionEarned: number;
    businessShare: number;
  };
}

interface StaffMember {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  pin: string;
  commissionRate: number;
  chairNumber: number;
  chairLabel: string;
  active: boolean;
  currentServing: {
    id: string;
    clientName: string;
    serviceName: string;
    startTime: string;
  } | null;
  stats: BarberStats;
  recentPayouts?: any[];
}

export default function StaffManagementPage() {
  const [business, setBusiness] = useState<any | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBarber, setEditingBarber] = useState<StaffMember | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState<StaffMember | null>(null);

  // Formulario barbero
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPin, setFormPin] = useState("1234");
  const [formCommission, setFormCommission] = useState(50);
  const [formChairNumber, setFormChairNumber] = useState(1);
  const [formChairLabel, setFormChairLabel] = useState("Silla 1");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Formulario de pago / liquidación
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  // Cargar datos del negocio y del equipo
  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const sRes = await fetch("/api/staff");
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.business) {
          setBusiness(sData.business);
        }
        setStaff(sData.staff || []);
      }
    } catch (err) {
      console.error("Error al cargar equipo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  // Activar o desactivar el módulo Multi-Barbero en el negocio (Persistente en DB)
  const handleToggleMultiBarber = async (enabled: boolean) => {
    if (!business) return;
    try {
      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          multiBarberEnabled: enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresPro) {
          alert("🔒 El módulo Multi-Barbero requiere el Plan PRO o un período de prueba activo.\n\nPara desbloquear múltiples sillas simultáneas, pantallas Smart TV y comisiones por barbero, actualiza tu plan en Suscripción & Plan.");
          return;
        }
        throw new Error(data.error || "No se pudo actualizar");
      }
      setBusiness((prev: any) => ({ ...prev, multiBarberEnabled: enabled }));
    } catch (err: any) {
      alert(err.message || "Error al actualizar la configuración.");
    }
  };

  // Abrir modal de creación
  const handleOpenAdd = () => {
    if (business && !business.isPro && staff.length >= 1) {
      alert(
        "🔒 El Plan FREE permite registrar únicamente 1 barbero/silla.\n\nTu período de prueba ha finalizado. Para registrar múltiples barberos con su propio panel y liquidación de comisiones, activa el Plan PRO en la sección de Suscripción."
      );
      return;
    }

    setEditingBarber(null);
    setFormName("");
    setFormPhone("");
    setFormPin(String(Math.floor(1000 + Math.random() * 9000))); // Generar PIN aleatorio de 4 dígitos
    const nextChair = staff.length + 1;
    setFormChairNumber(nextChair);
    setFormChairLabel(`Silla ${nextChair}`);
    setFormCommission(50);
    setShowAddModal(true);
  };

  // Abrir modal de edición
  const handleOpenEdit = (barber: StaffMember) => {
    setEditingBarber(barber);
    setFormName(barber.name);
    setFormPhone(barber.phone || "");
    setFormPin(barber.pin);
    setFormChairNumber(barber.chairNumber || 1);
    setFormChairLabel(barber.chairLabel || `Silla ${barber.chairNumber || 1}`);
    setFormCommission(barber.commissionRate || 50);
    setShowAddModal(true);
  };

  // Guardar barbero (Crear o Editar)
  const handleSaveBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !business) return;

    setFormSubmitting(true);
    try {
      if (editingBarber) {
        // Actualizar
        const res = await fetch(`/api/staff/${editingBarber.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            phone: formPhone.trim() || null,
            pin: formPin.trim(),
            chairNumber: formChairNumber,
            chairLabel: formChairLabel.trim(),
            commissionRate: formCommission,
          }),
        });
        if (!res.ok) throw new Error("Error al actualizar barbero");
      } else {
        // Crear
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business.id,
            name: formName.trim(),
            phone: formPhone.trim() || null,
            pin: formPin.trim(),
            chairNumber: formChairNumber,
            chairLabel: formChairLabel.trim(),
            commissionRate: formCommission,
          }),
        });
        if (!res.ok) throw new Error("Error al registrar barbero");
      }

      setShowAddModal(false);
      await fetchStaffData();
    } catch (err: any) {
      alert(err.message || "Error al guardar el barbero");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Eliminar barbero
  const handleDeleteBarber = async (barber: StaffMember) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar a ${barber.name}? Se conservará el historial de citas pasadas.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/staff/${barber.id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchStaffData();
      }
    } catch (err) {
      alert("Error al eliminar barbero.");
    }
  };

  // Registrar Liquidación / Pago
  const handleRegisterPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayoutModal || !payoutAmount || !business) return;

    setPayoutSubmitting(true);
    try {
      const res = await fetch("/api/staff/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          staffMemberId: showPayoutModal.id,
          amount: parseFloat(payoutAmount),
          notes: payoutNotes.trim() || "Liquidación de comisiones",
        }),
      });

      if (!res.ok) throw new Error("Error al registrar liquidación");

      alert(`Pago de ${formatCurrency(parseFloat(payoutAmount), currency)} registrado con éxito para ${showPayoutModal.name}.`);
      setShowPayoutModal(null);
      setPayoutAmount("");
      setPayoutNotes("");
      await fetchStaffData();
    } catch (err: any) {
      alert(err.message || "Error al procesar la liquidación.");
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const currency = business?.currency || "COP";

  // Métricas consolidadas del equipo hoy
  const totalBilledToday = staff.reduce((acc, b) => acc + b.stats.today.totalBilled, 0);
  const totalCommissionsToday = staff.reduce((acc, b) => acc + b.stats.today.commissionEarned, 0);
  const totalBusinessShareToday = totalBilledToday - totalCommissionsToday;
  const totalServicesToday = staff.reduce((acc, b) => acc + b.stats.today.servicesCount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-bold text-gray-900">
              Equipo de Barberos & Liquidación de Comisiones
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              ADD-ON PRO
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Permite que cada barbero controle su silla desde su celular, liquide sus cortes y consulte sus finanzas individuales.
          </p>
        </div>

        {/* BOTONES DE CABECERA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/super-control"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 hover:opacity-95 transition"
            title="Habilitar servicios por persona con checsitos y control total"
          >
            <Crown className="h-4 w-4" />
            <span>⚡ Asignar Servicios (Checsitos)</span>
          </Link>

          <Link
            href="/barbero"
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <span>📱 Abrir Portal Móvil (/barbero)</span>
            <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
          </Link>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-sm shadow-emerald-600/30"
          >
            <Plus className="h-4 w-4" />
            <span>+ Agregar Barbero</span>
          </button>
        </div>
      </div>

      {/* BANNER DE ACTIVACIÓN DEL SERVICIO MULTI-BARBERO */}
      <div className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border shadow-sm ${
        business?.isPro
          ? "bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-emerald-200"
          : "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-200"
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{business?.isPro ? "💈" : "🔒"}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">
                Módulo Multi-Barbero {business?.multiBarberEnabled ? "Activado" : "Desactivado"}
              </h3>
              {!business?.isPro ? (
                <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  EXCLUSIVO PRO
                </span>
              ) : business?.trial?.isTrialActive ? (
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  ⭐ PRUEBA ACTIVA ({business.trial.trialDaysLeft}d)
                </span>
              ) : null}
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              {!business?.isPro
                ? "El Plan FREE incluye 1 solo barbero. Actualiza a PRO para desbloquear múltiples sillas, turnero TV simultáneo y liquidación de comisiones."
                : business?.multiBarberEnabled
                ? "Las citas y la pantalla Smart TV se dividen en múltiples sillas simultáneas."
                : "Activa este servicio para habilitar el turnero multi-silla y los paneles individuales para cada barbero."}
            </p>
          </div>
        </div>

        {business?.isPro ? (
          <button
            onClick={() => handleToggleMultiBarber(!business?.multiBarberEnabled)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              business?.multiBarberEnabled
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
          >
            {business?.multiBarberEnabled ? "✓ Servicio Activo" : "Activar Módulo Multi-Barbero"}
          </button>
        ) : (
          <Link
            href="/dashboard/suscripcion"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-500 transition shadow-sm text-center shrink-0"
          >
            Actualizar a Plan PRO →
          </Link>
        )}
      </div>

      {/* MÉTRICAS CONSOLIDADAS DEL DÍA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-medium text-gray-400 block">Total Facturado Hoy</span>
          <span className="text-2xl font-black text-gray-900 font-mono mt-1 block">
            {formatCurrency(totalBilledToday, currency)}
          </span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">
            {totalServicesToday} corte(s) por el equipo
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-medium text-gray-400 block">
            Comisiones a Pagar (Barberos)
          </span>
          <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
            {formatCurrency(totalCommissionsToday, currency)}
          </span>
          <span className="text-[11px] text-amber-700 mt-0.5 block font-semibold">
            Parte correspondiente a los barberos
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-medium text-gray-400 block">Ganancia Neta Barbería</span>
          <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
            {formatCurrency(totalBusinessShareToday, currency)}
          </span>
          <span className="text-[11px] text-emerald-700 mt-0.5 block font-semibold">
            Ingreso limpio para el establecimiento
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-medium text-gray-400 block">Barberos en Equipo</span>
          <span className="text-2xl font-black text-sky-600 font-mono mt-1 block">
            {staff.length}
          </span>
          <span className="text-[11px] text-gray-500 mt-0.5 block">
            {staff.filter((s) => s.currentServing).length} en silla ahora mismo
          </span>
        </div>
      </div>

      {/* LISTADO DE BARBEROS / SILLAS */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-900">
            Personal Registrado ({staff.length})
          </h2>
          <button
            onClick={fetchStaffData}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refrescar</span>
          </button>
        </div>

        {staff.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <span className="p-3 bg-gray-100 text-gray-400 rounded-2xl inline-block">
              <Users className="h-8 w-8" />
            </span>
            <p className="text-sm font-semibold text-gray-700">No hay barberos registrados aún</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Agrega a los profesionales de tu barbería para que cada uno tenga su PIN de acceso y control de comisiones.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 shadow-sm transition"
            >
              + Agregar Primer Barbero
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {staff.map((barber) => (
              <div
                key={barber.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-gray-50/80 transition"
              >
                {/* Info Barbero y Silla */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center font-black text-base shadow-sm">
                    {barber.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 capitalize">
                        {barber.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800">
                        {barber.chairLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {barber.commissionRate}% comisión
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>PIN: <strong className="font-mono text-gray-700">{barber.pin}</strong></span>
                      {barber.phone && (
                        <span>• Tel: <strong className="font-mono text-gray-700">{barber.phone}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Estado en vivo de su silla */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-white text-xs">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Estado de la Silla
                    </span>
                    {barber.currentServing ? (
                      <span className="font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        Atendiendo a {barber.currentServing.clientName}
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Silla Libre
                      </span>
                    )}
                  </div>

                  {/* Producción de Hoy */}
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-white text-xs text-right min-w-[130px]">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Comisión Hoy ({barber.stats.today.servicesCount} cortes)
                    </span>
                    <span className="font-mono font-black text-emerald-600 text-sm mt-0.5 block">
                      {formatCurrency(barber.stats.today.commissionEarned, currency)}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 self-end lg:self-center">
                  <button
                    onClick={() => {
                      setShowPayoutModal(barber);
                      setPayoutAmount(String(barber.stats.today.commissionEarned || ""));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs shadow-sm transition"
                    title="Liquidar o registrar pago de comisiones"
                  >
                    💵 Liquidar Pago
                  </button>

                  <button
                    onClick={() => handleOpenEdit(barber)}
                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition"
                    title="Editar barbero"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteBarber(barber)}
                    className="p-2 rounded-xl border border-gray-200 hover:bg-rose-50 text-rose-600 transition"
                    title="Eliminar barbero"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: AGREGAR O EDITAR BARBERO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              {editingBarber ? "Editar Barbero" : "Agregar Nuevo Barbero"}
            </h3>

            <form onSubmit={handleSaveBarber} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Cristian Camilo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Número de Silla *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={formChairNumber}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10) || 1;
                      setFormChairNumber(num);
                      setFormChairLabel(`Silla ${num}`);
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Nombre / Etiqueta de Silla
                  </label>
                  <input
                    type="text"
                    required
                    value={formChairLabel}
                    onChange={(e) => setFormChairLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    % Comisión Barbero *
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={formCommission}
                      onChange={(e) => setFormCommission(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <span className="ml-2 font-bold text-gray-500 text-xs">%</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    PIN de Acceso (4 dígitos) *
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="1234"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-center text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold tracking-widest text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  WhatsApp (Opcional para avisos de retiros)
                </label>
                <input
                  type="tel"
                  placeholder="310 123 4567"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {formSubmitting ? "Guardando..." : "Guardar Barbero"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LIQUIDAR / REGISTRAR PAGO AL BARBERO */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Registrar Liquidación de Comisiones
            </h3>
            <p className="text-xs text-gray-500">
              Barbero: <strong>{showPayoutModal.name}</strong> ({showPayoutModal.chairLabel})
            </p>

            <form onSubmit={handleRegisterPayout} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Monto a Pagar ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="ej: 80000"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-base font-mono font-bold text-gray-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Detalles / Comprobante de Pago
                </label>
                <textarea
                  rows={2}
                  placeholder="ej. Transferencia Nequi #12345 o Pago en Efectivo del turno de la tarde"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={payoutSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {payoutSubmitting ? "Registrando..." : "Confirmar Liquidación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
