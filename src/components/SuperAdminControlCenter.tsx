"use client";

import { useState, useEffect } from "react";
import {
  Crown,
  Scissors,
  Users,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Plus,
  Save,
  Check,
  X,
  Clock,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  phone?: string | null;
  chairNumber: number;
  chairLabel: string;
  active: boolean;
  allowedServiceIds: string[] | null; // null = todos los servicios
}

interface QueueTurn {
  id: string;
  turnNumber: number;
  turnLabel: string;
  clientName: string;
  clientPhone?: string;
  startTime: string;
  status: string;
  service: Service;
  staffMemberId?: string | null;
  staffMember?: {
    id: string;
    name: string;
    chairLabel: string;
  } | null;
}

interface SuperAdminControlCenterProps {
  business: any;
}

export default function SuperAdminControlCenter({
  business,
}: SuperAdminControlCenterProps) {
  const [activeTab, setActiveTab] = useState<"BUSINESS_SERVICES" | "SERVICES_MATRIX" | "QUICK_ASSIGN" | "BUSINESS_CONTROLS">("BUSINESS_SERVICES");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Datos de servicios y personal
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  // Matriz de permisos en memoria: { [staffId]: string[] | null }
  const [staffPermissions, setStaffPermissions] = useState<{ [staffId: string]: string[] | null }>({});

  // Asignación de servicios al negocio (Checsitos de arranque)
  const [presetCatalog, setPresetCatalog] = useState<any[]>([]);
  const [selectedPresets, setSelectedPresets] = useState<Record<string, boolean>>({});
  const [editablePrices, setEditablePrices] = useState<Record<string, number>>({});
  const [editableDurations, setEditableDurations] = useState<Record<string, number>>({});
  const [assigningBizServices, setAssigningBizServices] = useState(false);
  const [customBizName, setCustomBizName] = useState("");
  const [customBizDuration, setCustomBizDuration] = useState(30);
  const [customBizPrice, setCustomBizPrice] = useState(business.currency === "USD" ? 10 : 25000);

  // Turnos en vivo para asignación express
  const [turns, setTurns] = useState<QueueTurn[]>([]);
  const [assigningTurnId, setAssigningTurnId] = useState<string | null>(null);

  // Formulario de Turno Express
  const [expressName, setExpressName] = useState("");
  const [expressPhone, setExpressPhone] = useState("");
  const [expressServiceId, setExpressServiceId] = useState("");
  const [expressStaffId, setExpressStaffId] = useState("");
  const [expressImmediate, setExpressImmediate] = useState(false);
  const [expressLoading, setExpressLoading] = useState(false);

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Cargar servicios y permisos de personal
      const resPerms = await fetch(`/api/staff/services?businessId=${business.id}`);
      if (resPerms.ok) {
        const dataPerms = await resPerms.json();
        setServices(dataPerms.services || []);
        setStaff(dataPerms.staff || []);

        const initialMap: { [id: string]: string[] | null } = {};
        for (const s of dataPerms.staff || []) {
          initialMap[s.id] = s.allowedServiceIds;
        }
        setStaffPermissions(initialMap);

        if (dataPerms.services?.length > 0 && !expressServiceId) {
          setExpressServiceId(dataPerms.services[0].id);
        }
      }

      // 2. Cargar turnos en espera para asignación rápida
      const resQueue = await fetch(`/api/queue/${business.slug}?t=${Date.now()}`);
      if (resQueue.ok) {
        const dataQueue = await resQueue.json();
        const allQueueTurns: QueueTurn[] = [
          ...(dataQueue.currentServing ? [dataQueue.currentServing] : []),
          ...(dataQueue.waiting || []),
          ...(dataQueue.postponed || []),
        ];
        setTurns(allQueueTurns);
      }
    } catch (err) {
      console.error("Error al cargar control maestro:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadPresetCatalog();
  }, [business.id, business.slug]);

  const loadPresetCatalog = async () => {
    try {
      const res = await fetch(`/api/admin/services/assign?businessId=${business.id}`);
      if (res.ok) {
        const data = await res.json();
        setPresetCatalog(data.presetCatalog || []);

        const initialSelected: Record<string, boolean> = {};
        const initialPrices: Record<string, number> = {};
        const initialDurations: Record<string, number> = {};

        (data.presetCatalog || []).forEach((p: any) => {
          initialPrices[p.name] = p.price;
          initialDurations[p.name] = p.durationMinutes;
          if (!p.alreadyExists && (services.length === 0 || data.currentServices?.length === 0)) {
            initialSelected[p.name] = true;
          } else {
            initialSelected[p.name] = false;
          }
        });

        setSelectedPresets(initialSelected);
        setEditablePrices(initialPrices);
        setEditableDurations(initialDurations);
      }
    } catch (err) {
      console.error("Error al cargar presets de servicios:", err);
    }
  };

  const handleAssignBusinessServices = async () => {
    const toAssign: any[] = [];
    presetCatalog.forEach((p) => {
      if (selectedPresets[p.name]) {
        toAssign.push({
          name: p.name,
          description: p.description,
          durationMinutes: editableDurations[p.name] || p.durationMinutes,
          price: editablePrices[p.name] !== undefined ? editablePrices[p.name] : p.price,
        });
      }
    });

    if (customBizName.trim()) {
      toAssign.push({
        name: customBizName.trim(),
        description: "Servicio asignado por Super Admin",
        durationMinutes: customBizDuration,
        price: customBizPrice,
      });
    }

    if (toAssign.length === 0) {
      showNotification("Por favor marca al menos un servicio con checsito [✓] para asignarle a este negocio.", true);
      return;
    }

    try {
      setAssigningBizServices(true);
      const res = await fetch("/api/admin/services/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          servicesToAssign: toAssign,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al asignar servicios");

      showNotification(`🎉 ¡${toAssign.length} servicios asignados con éxito! El panel del cliente ha sido desbloqueado.`);
      setCustomBizName("");
      await loadData();
      await loadPresetCatalog();
    } catch (err: any) {
      showNotification(err.message || "Error al guardar servicios", true);
    } finally {
      setAssigningBizServices(false);
    }
  };

  const handleDeleteBusinessService = async (serviceId: string) => {
    if (!confirm("¿Eliminar este servicio del negocio?")) return;
    try {
      const res = await fetch(`/api/admin/services/assign?serviceId=${serviceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showNotification("✓ Servicio eliminado.");
        await loadData();
        await loadPresetCatalog();
      }
    } catch {
      showNotification("Error al eliminar servicio", true);
    }
  };

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // -------------------------------------------------------------
  // GESTIÓN DE CHECKBOXES DE SERVICIOS POR PERSONAL
  // -------------------------------------------------------------

  // Verifica si un servicio está marcado para un barbero/personal
  const isServiceAllowed = (staffId: string, serviceId: string): boolean => {
    const allowed = staffPermissions[staffId];
    if (allowed === null || allowed === undefined) return true; // null = todos habilitados
    return allowed.includes(serviceId);
  };

  // Alterna el checsito de un servicio específico para una persona
  const toggleService = (staffId: string, serviceId: string) => {
    setStaffPermissions((prev) => {
      const current = prev[staffId];
      let updated: string[];

      if (current === null || current === undefined) {
        // Estaban todos habilitados: al desmarcar uno, quedan todos los demás
        const allIds = services.map((s) => s.id);
        updated = allIds.filter((id) => id !== serviceId);
      } else {
        if (current.includes(serviceId)) {
          updated = current.filter((id) => id !== serviceId);
        } else {
          updated = [...current, serviceId];
        }
      }

      return {
        ...prev,
        [staffId]: updated,
      };
    });
  };

  // Habilita TODOS los servicios para una persona
  const enableAllForStaff = (staffId: string) => {
    setStaffPermissions((prev) => ({
      ...prev,
      [staffId]: null, // null representa "Todos los servicios habilitados"
    }));
  };

  // Desmarca TODOS los servicios para una persona
  const disableAllForStaff = (staffId: string) => {
    setStaffPermissions((prev) => ({
      ...prev,
      [staffId]: [],
    }));
  };

  // Guardar configuración para un miembro del personal
  const handleSaveSingleStaff = async (staffMember: StaffMember) => {
    try {
      setSavingId(staffMember.id);
      const allowed = staffPermissions[staffMember.id];

      const res = await fetch("/api/staff/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          staffId: staffMember.id,
          allowedServiceIds: allowed,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      showNotification(`✓ Servicios de ${staffMember.name} actualizados con éxito.`);
    } catch (err: any) {
      showNotification(err.message || "Error al guardar asignación", true);
    } finally {
      setSavingId(null);
    }
  };

  // Guardar configuración masiva para TODO el personal con 1 Clic
  const handleSaveAll = async () => {
    try {
      setSavingAll(true);
      const res = await fetch("/api/staff/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          bulk: staffPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar todo");

      showNotification("✓ Todos los servicios y personal guardados correctamente en la base de datos.");
    } catch (err: any) {
      showNotification(err.message || "Error al guardar cambios", true);
    } finally {
      setSavingAll(false);
    }
  };

  // -------------------------------------------------------------
  // ASIGNACIÓN EXPRESS DE TURNOS CON 1 CLIC (CHEQUES/BOTONES)
  // -------------------------------------------------------------
  const handleAssignTurnToStaff = async (turnId: string, staffId: string | null) => {
    try {
      setAssigningTurnId(turnId);

      const res = await fetch("/api/queue/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_BARBER",
          businessId: business.id,
          appointmentId: turnId,
          staffMemberId: staffId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo asignar");

      // Actualizar estado local inmediatamente
      setTurns((prev) =>
        prev.map((t) => {
          if (t.id === turnId) {
            const assignedStaff = staff.find((s) => s.id === staffId);
            return {
              ...t,
              staffMemberId: staffId,
              staffMember: assignedStaff
                ? {
                    id: assignedStaff.id,
                    name: assignedStaff.name,
                    chairLabel: assignedStaff.chairLabel,
                  }
                : null,
            };
          }
          return t;
        })
      );

      const staffName = staff.find((s) => s.id === staffId)?.name || "Cualquiera (Automático)";
      showNotification(`✓ Turno asignado inmediatamente a: ${staffName}`);
    } catch (err: any) {
      showNotification(err.message || "Error al asignar turno", true);
    } finally {
      setAssigningTurnId(null);
    }
  };

  // Crear turno express y asignar al barbero deseado
  const handleCreateExpressTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expressName.trim()) {
      showNotification("Por favor ingresa el nombre del cliente", true);
      return;
    }

    try {
      setExpressLoading(true);

      const res = await fetch("/api/queue/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_WALK_IN",
          businessId: business.id,
          clientName: expressName.trim(),
          clientPhone: expressPhone.trim() || undefined,
          serviceId: expressServiceId || services[0]?.id,
          startImmediately: expressImmediate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear turno express");

      const createdApp = data.appointment;

      // Si se seleccionó un barbero específico, asignarlo de una vez
      if (createdApp?.id && expressStaffId) {
        await fetch("/api/queue/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ASSIGN_BARBER",
            businessId: business.id,
            appointmentId: createdApp.id,
            staffMemberId: expressStaffId,
          }),
        });
      }

      setExpressName("");
      setExpressPhone("");
      setExpressImmediate(false);
      await loadData();
      showNotification("⚡ ¡Turno creado y asignado exitosamente al barbero!");
    } catch (err: any) {
      showNotification(err.message || "Error al crear turno", true);
    } finally {
      setExpressLoading(false);
    }
  };

  // Toggle multi-barbero rápido
  const handleToggleMultiBarber = async () => {
    try {
      const nextVal = !business.multiBarberEnabled;
      const res = await fetch("/api/business/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          multiBarberEnabled: nextVal,
        }),
      });
      if (res.ok) {
        business.multiBarberEnabled = nextVal;
        showNotification(
          nextVal
            ? "✓ Modo Multi-Barbero activado: clientes pueden elegir su barbero."
            : "✓ Modo Fila Única activado: turnos automáticos al primer barbero libre."
        );
      }
    } catch {
      showNotification("Error al cambiar configuración", true);
    }
  };

  // Registrar barbero rápido directamente desde este panel
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [quickStaffName, setQuickStaffName] = useState("");
  const [quickStaffChair, setQuickStaffChair] = useState("Silla 1");
  const [addingStaff, setAddingStaff] = useState(false);

  const handleCreateQuickStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStaffName.trim()) return;

    try {
      setAddingStaff(true);
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          name: quickStaffName.trim(),
          chairNumber: staff.length + 1,
          chairLabel: quickStaffChair.trim() || `Silla ${staff.length + 1}`,
          commissionRate: 50,
          pin: "1234",
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al crear personal");
      }

      await loadData();
      showNotification(`✓ ${quickStaffName} agregado con éxito.`);
      setShowAddStaffModal(false);
      setQuickStaffName("");
    } catch (err: any) {
      showNotification(err.message || "Error al crear personal", true);
    } finally {
      setAddingStaff(false);
    }
  };

  // Cargar datos de demostración con 1 Clic (2 barberos y 3 servicios si están vacíos)
  const handleLoadDemoData = async () => {
    try {
      setAddingStaff(true);
      showNotification("Creando barberos y servicios de prueba...");

      // Si no hay servicios, crear 3 servicios básicos
      if (services.length === 0) {
        await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business.id,
            name: "Corte Clásico",
            durationMinutes: 30,
            price: 20000,
          }),
        });
        await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business.id,
            name: "Barba & Perfilado",
            durationMinutes: 20,
            price: 15000,
          }),
        });
        await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business.id,
            name: "Combo Corte + Barba VIP",
            durationMinutes: 45,
            price: 32000,
          }),
        });
      }

      // Crear 2 barberos de prueba
      await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          name: "Carlos Mendoza (Barbero 1)",
          chairNumber: 1,
          chairLabel: "Silla 1 - Principal",
          commissionRate: 50,
          pin: "1234",
        }),
      });

      await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          name: "Andrés Restrepo (Barbero 2)",
          chairNumber: 2,
          chairLabel: "Silla 2",
          commissionRate: 50,
          pin: "1234",
        }),
      });

      await loadData();
      showNotification("🎉 ¡Listo! Se crearon 2 barberos y servicios de prueba. ¡Ya puedes usar los checsitos!");
    } catch (err: any) {
      showNotification(err.message || "Error al cargar datos de prueba", true);
    } finally {
      setAddingStaff(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SUPER ADMIN */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-7 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/30 text-slate-950">
                <Crown className="h-6 w-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Super Administrador: Control Total
                  </h1>
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Modo Maestro
                  </span>
                </div>
                <p className="text-xs text-amber-200/80 font-medium">
                  Negocio actual: <strong className="text-white">{business.name}</strong> ({business.category})
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-300 max-w-2xl leading-relaxed pt-1">
              Habilita o deshabilita con <strong>checsitos</strong> qué servicios realiza cada persona (barberos, manicuristas, estilistas) y asigna turnos en cola con 1 clic directo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition backdrop-blur-sm"
              title="Recargar datos"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>Sincronizar</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={savingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{savingAll ? "Guardando..." : "Guardar Todo en BD"}</span>
            </button>
          </div>
        </div>

        {/* NOTIFICACIONES TOAST */}
        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400 text-emerald-100 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-400 text-rose-100 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TABS NAVEGACIÓN */}
        <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("BUSINESS_SERVICES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === "BUSINESS_SERVICES"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>📦 1. Asignar Servicios a la Empresa</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                services.length === 0
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-black/20 text-gray-300"
              }`}
            >
              {services.length} Servicios
            </span>
          </button>

          <button
            onClick={() => setActiveTab("SERVICES_MATRIX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === "SERVICES_MATRIX"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            <span>☑️ 2. Servicios por Barbero (Checsitos)</span>
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
              {staff.length} Personas
            </span>
          </button>

          <button
            onClick={() => setActiveTab("QUICK_ASSIGN")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === "QUICK_ASSIGN"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-900" />
            <span>⚡ 3. Asignar Turno en Vivo (1 Clic)</span>
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
              {turns.length} Turnos
            </span>
          </button>

          <button
            onClick={() => setActiveTab("BUSINESS_CONTROLS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === "BUSINESS_CONTROLS"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>⚙️ Opciones Maestras</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA 0: ASIGNAR SERVICIOS A LA EMPRESA (CHECSITOS) */}
      {activeTab === "BUSINESS_SERVICES" && (
        <div className="space-y-6">
          {/* BANNER DE ESTADO */}
          {services.length === 0 ? (
            <div className="bg-amber-500/10 border-2 border-amber-500/50 p-5 rounded-3xl flex items-start gap-4 text-amber-950 shadow-md">
              <AlertCircle className="h-7 w-7 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-black text-amber-900">
                  ⚠️ Esta empresa tiene CERO (0) servicios asignados
                </h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  El cliente cuando entra a su panel ve la pantalla de <strong>"Cuenta en Configuración"</strong> con el panel bloqueado.
                  Marca los checsitos <span className="font-bold">[✓]</span> abajo con los servicios autorizados y haz clic en <strong>"Habilitar Servicios Seleccionados"</strong> para desbloquearlo de inmediato.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Panel Desbloqueado:</strong> Este negocio tiene <strong>{services.length} servicios activos</strong>.
                </span>
              </div>
              <span className="font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                ✓ Operativo
              </span>
            </div>
          )}

          {/* LISTA DE SERVICIOS ACTUALES */}
          {services.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-black text-sm text-gray-900 uppercase tracking-wider flex items-center justify-between">
                <span>Servicios ya Habilitados en este Negocio ({services.length})</span>
                <span className="text-xs font-normal text-gray-400">Clic en basura para remover</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs hover:border-gray-300 transition"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-gray-900 truncate">{s.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        ⏱️ {s.durationMinutes} min • 💰 {formatCurrency(s.price, business.currency)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteBusinessService(s.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition shrink-0"
                      title="Eliminar este servicio"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATÁLOGO DE CHECSITOS RECOMENDADOS SEGÚN RUBRO */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <span>Catálogo de Servicios para Asignar con Checsitos [✓]</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Marca los servicios que deseas habilitarle a este negocio ({business.category}). Puedes editar el tiempo y precio directamente en las casillas.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const next: Record<string, boolean> = {};
                    presetCatalog.forEach((p) => {
                      next[p.name] = true;
                    });
                    setSelectedPresets(next);
                  }}
                  className="px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg font-bold transition"
                >
                  Marcar Todos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next: Record<string, boolean> = {};
                    presetCatalog.forEach((p) => {
                      next[p.name] = false;
                    });
                    setSelectedPresets(next);
                  }}
                  className="px-2.5 py-1 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {presetCatalog.map((preset: any) => {
                const isChecked = Boolean(selectedPresets[preset.name]);
                const exists = preset.alreadyExists;

                return (
                  <div
                    key={preset.name}
                    onClick={() => {
                      setSelectedPresets((prev) => ({
                        ...prev,
                        [preset.name]: !prev[preset.name],
                      }));
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer select-none flex items-start gap-4 ${
                      isChecked
                        ? "bg-amber-50/60 border-amber-400 shadow-sm"
                        : exists
                        ? "bg-gray-50 border-gray-200 opacity-60"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* CHECSITO VISIBLE Y GRANDE */}
                    <div
                      className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isChecked
                          ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                          : "border-2 border-gray-300 bg-white"
                      }`}
                    >
                      {isChecked && <Check className="h-4 w-4 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-gray-900">{preset.name}</span>
                        {exists && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            ✓ Ya está activo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{preset.description}</p>

                      <div
                        className="mt-2.5 flex items-center gap-3 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1 border border-gray-200">
                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                          <input
                            type="number"
                            min={5}
                            step={5}
                            value={editableDurations[preset.name] ?? preset.durationMinutes}
                            onChange={(e) =>
                              setEditableDurations((prev) => ({
                                ...prev,
                                [preset.name]: parseInt(e.target.value, 10) || 30,
                              }))
                            }
                            className="w-12 bg-transparent text-gray-900 font-mono font-bold focus:outline-none"
                          />
                          <span className="text-gray-500 text-[11px]">min</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1 border border-gray-200">
                          <span className="text-gray-500 font-bold">$</span>
                          <input
                            type="number"
                            min={0}
                            value={editablePrices[preset.name] ?? preset.price}
                            onChange={(e) =>
                              setEditablePrices((prev) => ({
                                ...prev,
                                [preset.name]: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-20 bg-transparent text-gray-900 font-mono font-bold focus:outline-none"
                          />
                          <span className="text-gray-500 text-[11px]">{business.currency}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SERVICIO PERSONALIZADO EXTRA */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-emerald-600" />
                <span>¿Deseas agregar otro servicio personalizado adicional?</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Nombre del servicio (ej. Tratamiento Especial)"
                    value={customBizName}
                    onChange={(e) => setCustomBizName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Precio"
                    value={customBizPrice}
                    onChange={(e) => setCustomBizPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* BOTÓN MAESTRO DE HABILITACIÓN */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleAssignBusinessServices}
                disabled={assigningBizServices}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center gap-2 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {assigningBizServices
                    ? "Habilitando servicios..."
                    : "⚡ Habilitar Servicios Seleccionados a este Negocio"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 1: MATRIZ DE SERVICIOS POR PERSONAL CON CHECSITOS */}
      {activeTab === "SERVICES_MATRIX" && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>Control Total:</strong> Marca o desmarca las casillas de verificación para decidir qué servicios puede atender cada persona. Solo los servicios marcados aparecerán disponibles cuando un cliente elija a ese profesional.
              </span>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={savingAll}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shrink-0 shadow-sm transition"
            >
              Guardar todos los cambios
            </button>
          </div>

          {staff.length === 0 ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-200 text-center space-y-4 shadow-sm max-w-2xl mx-auto my-4">
              <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-base sm:text-lg">
                  ¿Por qué no se ven los checsitos todavía?
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Para poder asignar qué servicios realiza cada persona, primero necesitamos registrar al menos a un barbero o profesional en este negocio.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleLoadDemoData}
                  disabled={addingStaff}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{addingStaff ? "Creando..." : "⚡ Cargar 2 Barberos de Prueba en 1 Clic"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(true)}
                  disabled={addingStaff}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Escribir Nombre de mi Barbero</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <p className="text-xs font-bold text-gray-500">
                  Equipo activo ({staff.length}):
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(true)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Agregar Otro Barbero</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {staff.map((person) => {
                const allowedList = staffPermissions[person.id];
                const isAllAllowed = allowedList === null || allowedList === undefined;
                const enabledCount = isAllAllowed
                  ? services.length
                  : services.filter((s) => allowedList.includes(s.id)).length;

                return (
                  <div
                    key={person.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-amber-300 transition overflow-hidden"
                  >
                    {/* ENCABEZADO DE LA PERSONA */}
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm shrink-0 border border-slate-700 shadow-sm">
                          {person.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-gray-900">
                              {person.name}
                            </h3>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full border border-slate-200">
                              {person.chairLabel || `Silla ${person.chairNumber}`}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500">
                            {enabledCount === services.length ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <span>⭐ Todos los servicios habilitados ({services.length})</span>
                              </span>
                            ) : (
                              <span className="text-amber-800 font-bold">
                                ✂️ {enabledCount} de {services.length} servicios asignados
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* BOTONES RÁPIDOS */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => enableAllForStaff(person.id)}
                          className="px-2 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                          title="Habilitar todos los servicios a esta persona"
                        >
                          ✓ Todos
                        </button>
                        <button
                          type="button"
                          onClick={() => disableAllForStaff(person.id)}
                          className="px-2 py-1 text-[10px] font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
                          title="Desmarcar todos"
                        >
                          ✗ Ninguno
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveSingleStaff(person)}
                          disabled={savingId === person.id}
                          className="px-2.5 py-1 text-[10px] font-bold bg-amber-600 text-white hover:bg-amber-700 rounded-lg shadow-sm transition disabled:opacity-50"
                        >
                          {savingId === person.id ? "Guardando..." : "Guardar"}
                        </button>
                      </div>
                    </div>

                    {/* LISTA DE SERVICIOS CON CHECSITOS */}
                    <div className="p-4 space-y-2">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">
                        Marca los servicios que esta persona realiza:
                      </p>

                      {services.length === 0 ? (
                        <p className="text-xs text-gray-400">No hay servicios creados en el negocio.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {services.map((srv) => {
                            const checked = isServiceAllowed(person.id, srv.id);
                            return (
                              <label
                                key={srv.id}
                                onClick={() => toggleService(person.id, srv.id)}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                                  checked
                                    ? "bg-amber-50/70 border-amber-300 text-gray-900 shadow-sm"
                                    : "bg-gray-50/60 border-gray-200 text-gray-400 hover:bg-gray-100"
                                }`}
                              >
                                <div className="mt-0.5 shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {}} // controlado por onClick del label
                                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                  />
                                </div>
                                <div className="min-w-0 flex-1 text-xs">
                                  <span className={`block font-bold truncate ${checked ? "text-gray-900" : "text-gray-500"}`}>
                                    {srv.name}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                    <span>{formatCurrency(srv.price, business.currency)}</span>
                                    <span>•</span>
                                    <span>{srv.durationMinutes} min</span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: ASIGNADOR RÁPIDO DE TURNOS (1 CLIC / CHECSITOS) */}
      {activeTab === "QUICK_ASSIGN" && (
        <div className="space-y-6">
          {/* FORMULARIO CREAR TURNO EXPRESS Y ASIGNAR DE INMEDIATO */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Plus className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Crear Turno Express & Asignar Inmediatamente
                  </h3>
                  <p className="text-xs text-gray-500">
                    Ingresa un cliente presencial y asígnalo directo al barbero deseado sin pasos extra.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateExpressTurn} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Montoya"
                    value={expressName}
                    onChange={(e) => setExpressName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    WhatsApp (Opcional)
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. 3106017261"
                    value={expressPhone}
                    onChange={(e) => setExpressPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Servicio a realizar
                  </label>
                  <select
                    value={expressServiceId}
                    onChange={(e) => setExpressServiceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                  >
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} — {formatCurrency(srv.price, business.currency)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SELECTOR DE BARBERO DIRECTO CON CHECSITOS/BOTONES */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  ✂️ ¿A qué barbero / profesional se lo asignas? (Toca uno):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpressStaffId("")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                      expressStaffId === ""
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                    }`}
                  >
                    <span>⭐</span>
                    <span className="truncate">Sin asignar / Auto</span>
                  </button>

                  {staff.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setExpressStaffId(person.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                        expressStaffId === person.id
                          ? "bg-amber-600 text-white border-amber-700 shadow-sm"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                      }`}
                    >
                      <span>✂️</span>
                      <span className="truncate">{person.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expressImmediate}
                    onChange={(e) => setExpressImmediate(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600"
                  />
                  <span>Atender de inmediato en silla (Marcar como EN_ATENCIÓN)</span>
                </label>

                <button
                  type="submit"
                  disabled={expressLoading}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  <span>{expressLoading ? "Creando..." : "Crear y Asignar Turno Ya"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* LISTADO DE TURNOS EN ESPERA CON SELECTOR 1-CLIC */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">
                  Turnos en Espera & Cola en Vivo
                </h3>
                <p className="text-xs text-gray-500">
                  Toca el nombre del barbero al lado del turno para asignárselo de inmediato.
                </p>
              </div>
              <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
                {turns.length} Turnos activos
              </span>
            </div>

            {turns.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No hay turnos en cola en este momento.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {turns.map((t) => (
                  <div
                    key={t.id}
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50/80 rounded-xl px-2 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs shrink-0">
                        #{t.turnNumber || t.startTime}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-gray-900">
                            {t.clientName}
                          </span>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              t.status === "IN_PROGRESS"
                                ? "bg-amber-100 text-amber-900 animate-pulse"
                                : t.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {t.status === "IN_PROGRESS" ? "EN ATENCIÓN" : "EN ESPERA"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {t.service?.name} • {t.clientPhone || "Presencial"}
                        </p>
                      </div>
                    </div>

                    {/* CHECSITOS / BOTONES DIRECTOS POR BARBERO */}
                    <div className="flex items-center gap-1.5 flex-wrap self-end md:self-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">
                        Asignar a:
                      </span>

                      {/* Opción Sin Asignar */}
                      <button
                        type="button"
                        disabled={assigningTurnId === t.id}
                        onClick={() => handleAssignTurnToStaff(t.id, null)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                          !t.staffMemberId
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {!t.staffMemberId && <Check className="h-3 w-3" />}
                        <span>Auto</span>
                      </button>

                      {/* Botón por cada barbero */}
                      {staff.map((person) => {
                        const isAssigned = t.staffMemberId === person.id;
                        return (
                          <button
                            key={person.id}
                            type="button"
                            disabled={assigningTurnId === t.id}
                            onClick={() => handleAssignTurnToStaff(t.id, person.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                              isAssigned
                                ? "bg-amber-600 text-white border-amber-700 shadow-sm"
                                : "bg-white text-gray-700 border-gray-200 hover:border-amber-400 hover:bg-amber-50/50"
                            }`}
                          >
                            {isAssigned && <Check className="h-3 w-3" />}
                            <span>{person.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: OPCIONES MAESTRAS & CONTROL */}
      {activeTab === "BUSINESS_CONTROLS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>Modo Multi-Barbero / Selección de Profesional</span>
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Permite que tus clientes elijan con qué barbero o estilista quieren atenderse al pedir cita o turno.
            </p>
            <div className="pt-2">
              <button
                onClick={handleToggleMultiBarber}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  business.multiBarberEnabled
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {business.multiBarberEnabled ? "✓ Multi-Barbero Activado" : "Activar Multi-Barbero"}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Reiniciar Contador de Turnos</span>
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Reinicia la numeración de los turnos a #01 inmediatamente a partir de este momento.
            </p>
            <div className="pt-2">
              <button
                onClick={async () => {
                  if (confirm("¿Reiniciar la numeración de turnos a #01 a partir de ahora?")) {
                    await fetch("/api/queue/actions", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "RESET_QUEUE_COUNTER",
                        businessId: business.id,
                      }),
                    });
                    showNotification("✓ Conteo de turnos reiniciado a #01");
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition"
              >
                Reiniciar a Turno #01
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR BARBERO RÁPIDO */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Users className="h-5 w-5" />
                </span>
                <h3 className="font-extrabold text-base text-gray-900">
                  Registrar Personal / Barbero
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickStaff} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Barbero / Profesional *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza, Laura Martínez..."
                  value={quickStaffName}
                  onChange={(e) => setQuickStaffName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre o Número de Silla / Tocador
                </label>
                <input
                  type="text"
                  placeholder={`Ej. Silla ${staff.length + 1} (Principal)`}
                  value={quickStaffChair}
                  onChange={(e) => setQuickStaffChair(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingStaff}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition disabled:opacity-50"
                >
                  {addingStaff ? "Guardando..." : "Guardar Personal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
