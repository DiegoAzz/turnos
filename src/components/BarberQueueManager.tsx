"use client";

import { useState, useEffect } from "react";
import {
  Scissors,
  Users,
  Clock,
  Check,
  CheckCircle2,
  AlertCircle,
  Tv,
  Plus,
  Bell,
  RefreshCw,
  Phone,
  MessageCircle,
  Play,
  RotateCcw,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Ban,
} from "lucide-react";
import { playTurnCall } from "@/lib/sound";

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

interface StaffMember {
  id: string;
  name: string;
  chairNumber: number;
  chairLabel: string;
}

interface QueueTurn {
  id: string;
  turnNumber: number;
  turnLabel: string;
  clientName: string;
  clientPhone?: string;
  appointmentType: string;
  startTime: string;
  status: string;
  service: Service;
  staffMemberId?: string | null;
  staffMember?: StaffMember | null;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  category?: string;
  services?: Service[];
}

interface BarberQueueManagerProps {
  business: Business;
  onRefreshData?: () => void;
}

export default function BarberQueueManager({
  business,
  onRefreshData,
}: BarberQueueManagerProps) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentServing, setCurrentServing] = useState<QueueTurn | null>(null);
  const [waiting, setWaiting] = useState<QueueTurn[]>([]);
  const [postponed, setPostponed] = useState<QueueTurn[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalTurnsCount, setTotalTurnsCount] = useState(0);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [multiBarberEnabled, setMultiBarberEnabled] = useState(false);
  const [staffChairs, setStaffChairs] = useState<any[]>([]);

  // Modal para añadir turno presencial / mostrador
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInServiceId, setWalkInServiceId] = useState(
    business.services?.[0]?.id || ""
  );
  const [walkInImmediate, setWalkInImmediate] = useState(false);

  // Modal / aviso de posponer con WhatsApp
  const [postponedAlert, setPostponedAlert] = useState<{
    clientName: string;
    whatsappNoticeUrl?: string | null;
  } | null>(null);

  // Pestaña activa en la tabla del turnero
  const [activeTab, setActiveTab] = useState<"WAITING" | "POSTPONED" | "ALL">("WAITING");

  // Cargar estado de la fila
  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/queue/${business.slug}?t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setCurrentServing(data.currentServing || null);
        setWaiting(data.waiting || []);
        setPostponed(data.postponed || []);
        setCompletedCount(data.completedCount || 0);
        setTotalTurnsCount(data.totalTurnsCount || 0);
        setStaffMembers(data.staffMembers || []);
        setMultiBarberEnabled(!!data.multiBarberEnabled);
        setStaffChairs(data.staffChairs || []);
      }
    } catch (err) {
      console.error("Error al cargar fila del turnero:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reiniciar el contador de turnos a #01 a partir de este momento
  const handleResetCounter = async () => {
    const ok = confirm(
      "¿Deseas reiniciar el conteo de turnos a #01 a partir de este momento?\n\nLos turnos anteriores seguirán registrados en el historial y tus reportes, pero los nuevos turnos que entren comenzarán a numerarse desde el #01."
    );
    if (!ok) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/queue/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_QUEUE_COUNTER",
          businessId: business.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("¡Conteo de turnos reiniciado a #01 con éxito!");
        await fetchQueue();
        if (onRefreshData) onRefreshData();
      } else {
        alert(data.error || "No se pudo reiniciar el conteo");
      }
    } catch (err) {
      alert("Error al reiniciar conteo");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 4000);
    return () => clearInterval(interval);
  }, [business.slug]);

  // Ejecutar acción en la fila
  const handleQueueAction = async (payload: any) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/queue/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          ...payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Ocurrió un error al procesar la acción.");
        return;
      }

      // Si se llamó un nuevo turno, sonar timbre en el dispositivo del barbero
      if (data.calledAppointment) {
        const turnNum = data.calledAppointment.startTime || "1";
        playTurnCall(turnNum, data.calledAppointment.clientName);
      }

      // Si se pospuso, mostrar modal para enviar WhatsApp si tiene teléfono
      if (payload.action === "POSTPONE" && data.whatsappNoticeUrl) {
        setPostponedAlert({
          clientName: data.postponedAppointment?.clientName || "Cliente",
          whatsappNoticeUrl: data.whatsappNoticeUrl,
        });
      }

      await fetchQueue();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error("Error en acción de fila:", err);
      alert("Error de conexión al procesar el turno.");
    } finally {
      setActionLoading(false);
    }
  };

  // Crear turno presencial
  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim()) {
      alert("Por favor ingresa un nombre o descripción (ej: Cliente Mostrador).");
      return;
    }

    const cleanPhone = walkInPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
      alert("El número de WhatsApp debe tener exactamente 10 dígitos (o déjalo vacío si no tiene).");
      return;
    }

    const finalWalkInPhone = cleanPhone
      ? (cleanPhone.startsWith("57") ? cleanPhone : `57${cleanPhone}`)
      : undefined;

    setActionLoading(true);
    try {
      const res = await fetch("/api/queue/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_WALK_IN",
          businessId: business.id,
          clientName: walkInName.trim(),
          clientPhone: finalWalkInPhone,
          serviceId: walkInServiceId || business.services?.[0]?.id,
          startImmediately: walkInImmediate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al añadir turno presencial.");
        return;
      }

      setShowWalkInModal(false);
      setWalkInName("");
      setWalkInPhone("");
      setWalkInImmediate(false);
      await fetchQueue();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error("Error al registrar cliente presencial:", err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* BARRA PRINCIPAL DE ACCIONES RÁPIDAS DEL BARBERO */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 shadow-xl border border-slate-700/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Scissors className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-white tracking-wide">
                Turnero en Vivo & Fila Virtual
              </h3>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Controla la silla de atención, atiende clientes en sala y proyecta la fila en tu Smart TV.
            </p>
          </div>

          {/* Botones de Cabecera: Reiniciar conteo, + Presencial y Pantalla TV */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetCounter}
              disabled={actionLoading}
              title="Reiniciar numeración de turnos a #01 a partir de este momento"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-amber-500/40 text-xs font-semibold text-amber-300 hover:bg-slate-700 hover:border-amber-400 transition shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
              <span>Reiniciar a #01</span>
            </button>

            <button
              onClick={() => setShowWalkInModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-600 text-xs font-semibold text-white hover:bg-slate-700 hover:border-slate-500 transition shadow-sm"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>+ Turno Presencial</span>
            </button>

            <a
              href={`/p/${business.slug}/turnero`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
            >
              <Tv className="h-4 w-4" />
              <span>Abrir Smart TV</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </div>
        </div>

        {/* MÉTRICAS RÁPIDAS DEL DÍA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <span className="text-[11px] font-medium text-slate-400 block">En Espera</span>
            <span className="text-xl font-black text-sky-400">{waiting.length}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <span className="text-[11px] font-medium text-slate-400 block">Pospuestos</span>
            <span className="text-xl font-black text-amber-400">{postponed.length}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <span className="text-[11px] font-medium text-slate-400 block">Atendidos Hoy</span>
            <span className="text-xl font-black text-emerald-400">{completedCount}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <span className="text-[11px] font-medium text-slate-400 block">Total del Día</span>
            <span className="text-xl font-black text-white">{totalTurnsCount}</span>
          </div>
        </div>
      </div>

      {/* TARJETA HERO: ESTADO ACTUAL DE LA SILLA (EN ATENCIÓN) */}
      <div
        className={`rounded-2xl border-2 p-6 transition-all duration-300 shadow-sm ${
          currentServing
            ? "border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10"
            : "border-gray-200 bg-gray-50/50"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span
                className={`inline-flex h-full w-full rounded-full ${
                  currentServing ? "bg-emerald-400 animate-ping opacity-75" : "bg-gray-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  currentServing ? "bg-emerald-600" : "bg-gray-500"
                }`}
              />
            </span>
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {currentServing ? "ATENDIENDO EN SILLA AHORA" : "SILLA VACÍA / DISPONIBLE"}
            </h4>
          </div>

          {currentServing && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {currentServing.appointmentType === "WALK_IN"
                ? "🪑 Cliente Presencial"
                : "📱 Turno Digital"}
            </span>
          )}
        </div>

        {currentServing ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black font-mono text-2xl shadow-md">
                {currentServing.turnLabel}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 capitalize">
                  {currentServing.clientName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-1">
                  <span className="font-semibold text-emerald-700">
                    ✂️ {currentServing.service?.name}
                  </span>
                  {currentServing.service?.durationMinutes && (
                    <span>• ~{currentServing.service.durationMinutes} min</span>
                  )}
                  {currentServing.clientPhone && currentServing.clientPhone !== "Presencial" && (
                    <span className="text-gray-500 flex items-center gap-1">
                      • <Phone className="h-3 w-3" /> {currentServing.clientPhone}
                    </span>
                  )}
                  {currentServing.staffMember?.name && (
                    <span className="text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                      ✂️ Atiende: {currentServing.staffMember.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones principales de la silla */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Botón Posponer si el cliente no llegó */}
              <button
                disabled={actionLoading}
                onClick={() =>
                  handleQueueAction({
                    action: "POSTPONE",
                    appointmentId: currentServing.id,
                    autoCallNext: true,
                  })
                }
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold text-xs shadow-sm transition disabled:opacity-50"
                title="Si llamaste este turno digital y el cliente aún no llega a la sala, posponlo para no perder tiempo y atender al siguiente."
              >
                <RotateCcw className="h-4 w-4 text-amber-600" />
                <span>Posponer (No ha llegado)</span>
              </button>

              {/* Botón Finalizar Servicio */}
              <button
                disabled={actionLoading}
                onClick={() =>
                  handleQueueAction({
                    action: "COMPLETE_CURRENT",
                    appointmentId: currentServing.id,
                  })
                }
                style={{ backgroundColor: "#059669", color: "#ffffff" }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white hover:opacity-90 font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Terminar Servicio</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                La silla está disponible en este momento.
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {waiting.length > 0
                  ? `Hay ${waiting.length} turno(s) esperando en fila.`
                  : "No hay turnos en espera por el momento."}
              </p>
            </div>

            <button
              disabled={actionLoading || waiting.length === 0}
              onClick={() => handleQueueAction({ action: "CALL_NEXT" })}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition ${
                waiting.length > 0
                  ? "bg-sky-600 text-white hover:bg-sky-500"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>🔔 LLAMAR SIGUIENTE TURNO</span>
            </button>
          </div>
        )}
      </div>

      {/* PESTAÑAS Y TABLA DE TURNOS DE HOY */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Cabecera de pestañas */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("WAITING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "WAITING"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <span>En Espera</span>
              <span className="px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 text-[10px]">
                {waiting.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("POSTPONED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "POSTPONED"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <span>Pospuestos</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                {postponed.length}
              </span>
            </button>
          </div>

          <button
            onClick={fetchQueue}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
            title="Refrescar fila"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* LISTADO DE TURNOS SEGÚN PESTAÑA */}
        <div className="p-4 sm:p-6">
          {activeTab === "WAITING" && (
            <div>
              {currentServing && waiting.length > 0 && (
                <div className="mb-4 px-3.5 py-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2.5 shadow-sm">
                  <span className="text-lg">🪑</span>
                  <div>
                    <span className="font-bold">Silla en atención: </span>
                    <span>
                      Estás atendiendo a <strong>{currentServing.clientName}</strong>. Cuando termines su servicio, pulsa <strong>"Terminar Servicio"</strong> arriba para poder llamar al siguiente turno.
                    </span>
                  </div>
                </div>
              )}

              {waiting.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No hay turnos en espera. Cuando los clientes saquen turno o registres uno presencial, aparecerán aquí.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {waiting.map((turn, index) => (
                    <div
                      key={turn.id}
                      className="rounded-xl border border-gray-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-300 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 rounded-lg bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center font-black font-mono text-sm">
                          {turn.turnLabel}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm capitalize">
                              {turn.clientName}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              {turn.appointmentType === "WALK_IN" ? "En Sala" : "Digital"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {turn.service?.name} • ~{turn.service?.durationMinutes || 30} min
                          </span>
                        </div>
                      </div>

                      {/* ASIGNACIÓN DE BARBERO DIRECTA (1 CLIC / RÁPIDO) */}
                      {staffMembers.length > 0 && (
                        <div className="flex items-center gap-1.5 self-start sm:self-center flex-wrap">
                          <span className="text-[10px] font-bold text-gray-400">
                            Barbero:
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => {
                                handleQueueAction({
                                  action: "ASSIGN_BARBER",
                                  appointmentId: turn.id,
                                  staffMemberId: null,
                                });
                              }}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                                !turn.staffMemberId
                                  ? "bg-slate-900 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                              title="Asignación automática al primer barbero libre"
                            >
                              Auto
                            </button>
                            {staffMembers.map((staff) => {
                              const isSelected = turn.staffMemberId === staff.id;
                              return (
                                <button
                                  key={staff.id}
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => {
                                    handleQueueAction({
                                      action: "ASSIGN_BARBER",
                                      appointmentId: turn.id,
                                      staffMemberId: staff.id,
                                    });
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border ${
                                    isSelected
                                      ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                                      : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                                  }`}
                                  title={`Asignar este turno con 1 clic a ${staff.name}`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                  <span>{staff.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Acciones por cada turno en espera */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          disabled={actionLoading || (!multiBarberEnabled && !!currentServing)}
                          onClick={() => {
                            if (!multiBarberEnabled && currentServing) {
                              alert(
                                `La silla ya está ocupada atendiendo a ${currentServing.clientName}. Debes hacer clic en "Terminar Servicio" antes de atender a otro cliente.`
                              );
                              return;
                            }
                            handleQueueAction({
                              action: "CALL_SPECIFIC",
                              appointmentId: turn.id,
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                            !multiBarberEnabled && currentServing
                              ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                              : "bg-emerald-600 text-white hover:bg-emerald-500"
                          }`}
                          title={
                            !multiBarberEnabled && currentServing
                              ? `Silla ocupada atendiendo a ${currentServing.clientName}. Finaliza el servicio actual primero.`
                              : "Atender a este cliente ahora"
                          }
                        >
                          {!multiBarberEnabled && currentServing ? "Silla Ocupada" : "Atender Ya"}
                        </button>

                        <button
                          disabled={actionLoading}
                          onClick={() =>
                            handleQueueAction({
                              action: "POSTPONE",
                              appointmentId: turn.id,
                              autoCallNext: false,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition"
                          title="Posponer temporalmente"
                        >
                          Posponer
                        </button>

                        <button
                          disabled={actionLoading}
                          onClick={() => {
                            if (confirm(`¿Cancelar el turno de ${turn.clientName}?`)) {
                              handleQueueAction({
                                action: "CANCEL_TURN",
                                appointmentId: turn.id,
                              });
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 transition"
                          title="Cancelar turno"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <button
                          disabled={actionLoading}
                          onClick={() => {
                            const isSpam = confirm(
                              `¿El turno de "${turn.clientName}" (${turn.clientPhone || "sin celular"}) es SPAM o una broma?\n\nAl presionar ACEPTAR:\n1. Se cancelará el turno de inmediato.\n2. Se BLOQUEARÁ este número para que nunca más pueda pedir turnos en tu negocio.`
                            );
                            if (isSpam) {
                              handleQueueAction({
                                action: "BLOCK_CLIENT",
                                appointmentId: turn.id,
                              });
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Bloquear cliente / Reportar como Spam (Lista Negra)"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "POSTPONED" && (
            <div>
              {postponed.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No hay clientes pospuestos en este momento.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Estos clientes fueron llamados pero no se encontraban en el local. Cuando lleguen, puedes hacer clic en <strong>"Atender Ya"</strong> o <strong>"Reincorporar a Fila"</strong> para reasignarles su espacio.
                    </span>
                  </div>

                  {postponed.map((turn) => (
                    <div
                      key={turn.id}
                      className="rounded-xl border border-amber-200 bg-amber-50/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-black font-mono text-sm">
                          {turn.turnLabel}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm capitalize">
                              {turn.clientName}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                              Por llegar
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {turn.service?.name} • {turn.clientPhone || "Sin teléfono"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          disabled={actionLoading || !!currentServing}
                          onClick={() => {
                            if (currentServing) {
                              alert(
                                `La silla ya está ocupada atendiendo a ${currentServing.clientName}. Debes hacer clic en "Terminar Servicio" antes de atender a otro cliente en la silla, o puedes presionar "Reincorporar a Fila" para ponerlo en espera.`
                              );
                              return;
                            }
                            handleQueueAction({
                              action: "RECALL_POSTPONED",
                              appointmentId: turn.id,
                              startImmediately: true,
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                            currentServing
                              ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                              : "bg-emerald-600 text-white hover:bg-emerald-500"
                          }`}
                          title={
                            currentServing
                              ? `Silla ocupada atendiendo a ${currentServing.clientName}. Usa "Reincorporar a Fila" para dejarlo en espera.`
                              : "Llamar directamente a la silla"
                          }
                        >
                          {currentServing ? "Silla Ocupada" : "Atender en Silla"}
                        </button>

                        <button
                          disabled={actionLoading}
                          onClick={() =>
                            handleQueueAction({
                              action: "RECALL_POSTPONED",
                              appointmentId: turn.id,
                              startImmediately: false,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-white transition"
                        >
                          Reincorporar a Fila
                        </button>

                        <button
                          disabled={actionLoading}
                          onClick={() => {
                            if (confirm(`¿Eliminar turno pospuesto de ${turn.clientName}?`)) {
                              handleQueueAction({
                                action: "CANCEL_TURN",
                                appointmentId: turn.id,
                              });
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 transition"
                          title="Eliminar turno"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <button
                          disabled={actionLoading}
                          onClick={() => {
                            const isSpam = confirm(
                              `¿El turno de "${turn.clientName}" (${turn.clientPhone || "sin celular"}) era una broma y nunca vino?\n\nAl presionar ACEPTAR:\n1. Se eliminará de la fila.\n2. Se BLOQUEARÁ este número para que no vuelva a molestar en tu negocio.`
                            );
                            if (isSpam) {
                              handleQueueAction({
                                action: "BLOCK_CLIENT",
                                appointmentId: turn.id,
                              });
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Bloquear cliente / Reportar como Spam (Lista Negra)"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: AÑADIR TURNO PRESENCIAL (WALK-IN) EN 1 CLIC */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Plus className="h-5 w-5" />
                </span>
                <h3 className="font-bold text-gray-900 text-base">
                  Registrar Turno Presencial (En Sala)
                </h3>
              </div>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Nombre del Cliente o Referencia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Carlos o Cliente Mostrador 1"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Servicio Requerido
                </label>
                <select
                  value={walkInServiceId}
                  onChange={(e) => setWalkInServiceId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {business.services?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (~{s.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  WhatsApp / Celular (Opcional)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="ej. 310 123 4567 (10 dígitos)"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  10 dígitos para enviar confirmación automática por WhatsApp.
                </p>
              </div>

              {currentServing ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <span className="text-base shrink-0">🪑</span>
                  <div>
                    <span className="font-bold">Silla en atención: </span>
                    <span>
                      Actualmente estás atendiendo a <strong>{currentServing.clientName}</strong>. Este turno presencial entrará directamente a la <strong>lista de espera</strong>.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="startImmediate"
                    checked={walkInImmediate}
                    onChange={(e) => setWalkInImmediate(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="startImmediate"
                    className="text-xs font-semibold text-gray-700 cursor-pointer"
                  >
                    ⚡ Atender de inmediato en la silla ahora
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ backgroundColor: "#059669", color: "#ffffff" }}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition shadow-sm disabled:opacity-50"
                >
                  Asignar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / AVISO CUANDO SE POSPONE UN CLIENTE CON WHATSAPP */}
      {postponedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-amber-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <RotateCcw className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Turno Pospuesto con Éxito
                </h3>
                <p className="text-xs text-gray-500">
                  {postponedAlert.clientName} ha sido marcado como pospuesto en la fila.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-5">
              Puedes enviarle un mensaje por WhatsApp para notificarle que su turno fue pospuesto temporalmente porque no estaba en la barbería, y que avise apenas llegue.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPostponedAlert(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Cerrar
              </button>

              {postponedAlert.whatsappNoticeUrl && (
                <a
                  href={postponedAlert.whatsappNoticeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setPostponedAlert(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Avisar por WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
