"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Scissors,
  CheckCircle2,
  Clock,
  DollarSign,
  User,
  Phone,
  RefreshCw,
  LogOut,
  Bell,
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { playAlertChime, unlockAudio } from "@/lib/sound";

export default function BarberPortalPage() {
  const [session, setSession] = useState<{
    barber: {
      id: string;
      name: string;
      chairNumber: number;
      chairLabel: string;
      commissionRate: number;
    };
    business: {
      id: string;
      name: string;
      slug: string;
      currency: string;
    };
  } | null>(null);

  // Formulario de login
  const [slugInput, setSlugInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Estado del panel
  const [activeTab, setActiveTab] = useState<"CHAIR" | "FINANCES">("CHAIR");
  const [queueData, setQueueData] = useState<any | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Cargar sesión guardada en localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("turnoya_barber_session");
      if (saved) {
        setSession(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  // Login del barbero
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      unlockAudio();
      const res = await fetch("/api/staff/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slugInput, pin: pinInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      const sess = { barber: data.barber, business: data.business };
      setSession(sess);
      localStorage.setItem("turnoya_barber_session", JSON.stringify(sess));
    } catch (err: any) {
      setLoginError(err.message || "Error al conectar");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("turnoya_barber_session");
    setSession(null);
  };

  // Cargar datos de la silla y finanzas
  const fetchBarberQueue = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(
        `/api/staff/queue?businessId=${session.business.id}&staffId=${session.barber.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setQueueData(data);
      }
    } catch (err) {
      console.error("Error al cargar cola del barbero:", err);
    }
  }, [session]);

  // Carga inicial y polling periódico cada 4s
  useEffect(() => {
    if (!session) return;
    fetchBarberQueue();
    const interval = setInterval(fetchBarberQueue, 4000);
    return () => clearInterval(interval);
  }, [session, fetchBarberQueue]);

  // Ejecutar acciones en la silla (Llamar, Terminar, Posponer)
  const handleChairAction = async (action: string, appointmentId?: string) => {
    if (!session) return;
    setActionLoading(true);
    try {
      unlockAudio();
      const res = await fetch("/api/staff/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          businessId: session.business.id,
          staffId: session.barber.id,
          appointmentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Ocurrió un error.");
        return;
      }

      if (action === "CALL_NEXT" || action === "CALL_SPECIFIC") {
        playAlertChime();
      }

      await fetchBarberQueue();
    } catch (err) {
      alert("Error de conexión al procesar la acción.");
    } finally {
      setActionLoading(false);
    }
  };

  // PANTALLA 1: LOGIN DEL BARBERO
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg">
              <Scissors className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Portal del Barbero</h1>
            <p className="text-xs text-slate-400 mt-1">
              Controla tu silla de corte y consulta tus ganancias en vivo
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                {loginError}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Identificador de la Barbería (Slug)
              </label>
              <input
                type="text"
                required
                placeholder="ej: diego-707 o mi-barberia"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Tu PIN personal de 4 dígitos
              </label>
              <input
                type="password"
                required
                maxLength={6}
                inputMode="numeric"
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
            >
              {loginLoading ? "Entrando..." : "Entrar a mi Silla 🪑"}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-600 mt-6">
            TurnoYa Pro Staff • Plataforma para Barberos Profesionales
          </p>
        </div>
      </div>
    );
  }

  const currency = session.business.currency || "COP";
  const currentServing = queueData?.currentServing;
  const waitingList = queueData?.waitingList || [];
  const stats = queueData?.stats || {
    todayServices: 0,
    todayBilled: 0,
    todayCommission: 0,
    monthServices: 0,
    monthCommission: 0,
  };

  // PANTALLA 2: PANEL DEL BARBERO
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* CABECERA MÓVIL DEL BARBERO */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-sm">
              {session.barber.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-white leading-tight">
                  {session.barber.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {session.barber.chairLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {session.business.name} • {session.barber.commissionRate}% comisión
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* PESTAÑAS PRINCIPALES: MI SILLA / MIS FINANZAS */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-4">
        <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab("CHAIR")}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "CHAIR"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Scissors className="h-4 w-4" />
            <span>Mi Silla ({currentServing ? "Ocupada" : "Libre"})</span>
          </button>

          <button
            onClick={() => setActiveTab("FINANCES")}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "FINANCES"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Mis Finanzas ({formatCurrency(stats.todayCommission, currency)})</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      <main className="max-w-2xl mx-auto w-full px-4 py-4 flex-1">
        {/* PESTAÑA 1: MI SILLA DE CORTE */}
        {activeTab === "CHAIR" && (
          <div className="space-y-4">
            {/* TARJETA PRINCIPAL: SILLA DE ATENCIÓN */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/80 p-5 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      currentServing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                    }`}
                  />
                  {currentServing ? "En Atención Ahora" : "Silla Disponible"}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {session.barber.chairLabel}
                </span>
              </div>

              {currentServing ? (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-black font-mono text-2xl shadow-inner">
                      {currentServing.startTime || "#"}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white capitalize">
                        {currentServing.clientName}
                      </h3>
                      <p className="text-xs text-amber-400 font-semibold mt-0.5">
                        ✂️ {currentServing.service?.name} (
                        {formatCurrency(currentServing.service?.price || 0, currency)})
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Tu ganancia por este corte:{" "}
                        <strong className="text-emerald-400 font-mono">
                          +
                          {formatCurrency(
                            (currentServing.service?.price || 0) *
                              (session.barber.commissionRate / 100),
                            currency
                          )}
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción del turno actual */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleChairAction("POSTPONE", currentServing.id)}
                      className="py-3 px-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition"
                    >
                      ⏳ Posponer
                    </button>

                    <button
                      disabled={actionLoading}
                      onClick={() => handleChairAction("COMPLETE_SERVICE", currentServing.id)}
                      className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Terminar Corte</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-5 pb-3 text-center space-y-4">
                  <div>
                    <p className="text-base font-bold text-white">Tu silla está lista y desocupada</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {waitingList.length > 0
                        ? `Hay ${waitingList.length} cliente(s) esperando en la fila.`
                        : "No hay clientes en espera en este momento."}
                    </p>
                  </div>

                  <button
                    disabled={actionLoading || waitingList.length === 0}
                    onClick={() => handleChairAction("CALL_NEXT")}
                    className={`w-full py-4 rounded-xl font-bold text-sm shadow-xl transition flex items-center justify-center gap-2 ${
                      waitingList.length > 0
                        ? "bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/25 animate-pulse"
                        : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    <span>🔔 LLAMAR SIGUIENTE A MI SILLA</span>
                  </button>
                </div>
              )}
            </div>

            {/* LISTA DE CLIENTES EN FILA DE ESPERA */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Fila de Espera ({waitingList.length})
                </h4>
                <button
                  onClick={fetchBarberQueue}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${actionLoading ? "animate-spin" : ""}`} />
                  <span>Refrescar</span>
                </button>
              </div>

              {waitingList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No hay turnos en espera.
                </p>
              ) : (
                <div className="space-y-2">
                  {waitingList.map((turn: any) => (
                    <div
                      key={turn.id}
                      className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono font-bold text-xs flex items-center justify-center">
                          {turn.startTime}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white capitalize">
                            {turn.clientName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {turn.service?.name} •{" "}
                            {formatCurrency(turn.service?.price || 0, currency)}
                          </p>
                        </div>
                      </div>

                      <button
                        disabled={actionLoading || !!currentServing}
                        onClick={() => handleChairAction("CALL_SPECIFIC", turn.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                          currentServing
                            ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {currentServing ? "Silla Ocupada" : "Atender"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: MIS FINANZAS & COMISIONES PERSONALES */}
        {activeTab === "FINANCES" && (
          <div className="space-y-4">
            {/* RESUMEN DE GANANCIAS DE HOY */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border border-emerald-500/30 p-5 shadow-xl">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Mi Ganancia Neta de Hoy
              </span>
              <div className="text-3xl font-black text-white font-mono">
                {formatCurrency(stats.todayCommission, currency)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Calculado al <strong>{session.barber.commissionRate}%</strong> sobre{" "}
                {formatCurrency(stats.todayBilled, currency)} facturados hoy en{" "}
                <strong>{stats.todayServices} corte(s)</strong>.
              </p>
            </div>

            {/* MÉTRICAS SECUNDARIAS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block">Cortes Hoy</span>
                <span className="text-2xl font-black text-white font-mono">
                  {stats.todayServices}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Completados</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block">
                  Ganancia del Mes
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {formatCurrency(stats.monthCommission, currency)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {stats.monthServices} servicios en total
                </span>
              </div>
            </div>

            {/* HISTORIAL DETALLADO DE CORTES DE HOY */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
                Mis Cortes Realizados Hoy
              </h4>

              {queueData?.completedHistory?.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  Aún no has completado cortes el día de hoy. Cuando termines un servicio, aparecerá aquí con tu comisión calculada.
                </p>
              ) : (
                <div className="space-y-2">
                  {queueData?.completedHistory?.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white capitalize">{c.clientName}</p>
                        <p className="text-[11px] text-slate-400">
                          {c.serviceName} • {formatCurrency(c.price, currency)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400 block">
                          +{formatCurrency(c.myCommission, currency)}
                        </span>
                        <span className="text-[10px] text-slate-500">{c.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
