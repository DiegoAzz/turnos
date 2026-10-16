"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  QrCode,
  Users,
  AlertCircle,
  CheckCircle2,
  Radio,
  Scissors,
  ArrowRight,
} from "lucide-react";
import { playTurnCall, unlockAudio } from "@/lib/sound";

interface QueueService {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
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
  service: QueueService;
}

interface QueueBusiness {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  category?: string;
  address?: string | null;
  phone?: string | null;
  liveStatus?: string;
  statusMessage?: string | null;
  currency?: string;
}

export default function SmartTvTurneroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<QueueBusiness | null>(null);
  const [currentServing, setCurrentServing] = useState<QueueTurn | null>(null);
  const [nextUp, setNextUp] = useState<QueueTurn | null>(null);
  const [waiting, setWaiting] = useState<QueueTurn[]>([]);
  const [postponed, setPostponed] = useState<QueueTurn[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalTurnsCount, setTotalTurnsCount] = useState(0);

  // Estados visuales y de TV
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isNewCallPulse, setIsNewCallPulse] = useState(false);

  // Referencias para evitar alertas duplicadas
  const prevServingIdRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef(true);

  // Reloj en tiempo real
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Función para desbloquear audio en Smart TVs (exige gesto de usuario)
  const handleEnableAudio = () => {
    unlockAudio();
    setAudioUnlocked(true);
    setSoundEnabled(true);
    // Reproducir un ding inicial de confirmación
    playTurnCall(currentServing?.turnNumber || "1", currentServing?.clientName);
  };

  // Toggle de pantalla completa para Smart TVs / monitores
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {});
      }
    }
  };

  // Polling del estado de la fila cada 3 segundos
  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/queue/${slug}?t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.success) {
        setBusiness(data.business);
        setWaiting(data.waiting || []);
        setPostponed(data.postponed || []);
        setNextUp(data.nextUp || null);
        setCompletedCount(data.completedCount || 0);
        setTotalTurnsCount(data.totalTurnsCount || 0);

        const newServing = data.currentServing || null;

        // Si cambió el turno que está siendo atendido
        if (newServing && newServing.id !== prevServingIdRef.current) {
          if (!isFirstLoadRef.current && soundEnabled) {
            // Sonar ding-dong y locución de voz
            playTurnCall(newServing.turnNumber, newServing.clientName);
            // Destello visual de llamada
            setIsNewCallPulse(true);
            setTimeout(() => setIsNewCallPulse(false), 3500);
          }
          prevServingIdRef.current = newServing.id;
        } else if (!newServing) {
          prevServingIdRef.current = null;
        }

        isFirstLoadRef.current = false;
        setCurrentServing(newServing);
      }
    } catch (err) {
      console.error("Error al consultar fila de turnero:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, [slug, soundEnabled]);

  const bookingPortalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/p/${slug}`
    : `https://turnos.appzplay.online/p/${slug}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    bookingPortalUrl
  )}&margin=10`;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between overflow-x-hidden select-none">
      {/* 1. BARRA SUPERIOR PARA SMART TV */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Logo / Nombre del Negocio */}
        <div className="flex items-center gap-4">
          {business?.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={business?.name || "Logo"}
              className="h-12 w-12 rounded-xl object-cover border border-slate-700 shadow-md"
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-xl shadow-lg">
              <Scissors className="h-6 w-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white">
                {business?.name || "Cargando..."}
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                EN VIVO
              </span>
            </div>
            {business?.address && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                📍 {business.address}
              </p>
            )}
          </div>
        </div>

        {/* Reloj Digital & Fecha */}
        <div className="text-center sm:text-right flex flex-col items-center sm:items-end">
          <div className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-emerald-400 drop-shadow">
            {currentTime || "--:--:--"}
          </div>
          <div className="text-xs uppercase tracking-wider text-slate-400 capitalize">
            {currentDate || "Hoy"}
          </div>
        </div>

        {/* Controles de la TV (Sonido / Fullscreen) */}
        <div className="flex items-center gap-2">
          {!audioUnlocked ? (
            <button
              onClick={handleEnableAudio}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition shadow-lg animate-pulse"
              title="Haz clic una vez para activar el sonido Ding-Dong en la TV"
            >
              <Volume2 className="h-4 w-4" />
              <span>Activar Timbre 🔔</span>
            </button>
          ) : (
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                soundEnabled
                  ? "bg-slate-800 border-emerald-500/50 text-emerald-400"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
              title={soundEnabled ? "Silenciar audio" : "Activar audio"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span className="hidden md:inline">Sonido ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span className="hidden md:inline">Sonido OFF</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* 2. CONTENIDO PRINCIPAL DEL TURNERO (SPLIT SCREEN) */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA / CENTRAL: ATENDIENDO AHORA (HERO GRANDE) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <div
            className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-700 p-8 sm:p-12 flex flex-col justify-between shadow-2xl ${
              isNewCallPulse
                ? "border-emerald-400 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 scale-[1.01] ring-8 ring-emerald-500/30"
                : currentServing
                ? "border-emerald-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950"
                : "border-slate-800 bg-slate-900/40"
            }`}
          >
            {/* Badge de Cabecera */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-4 w-4 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
                <span className="text-base sm:text-xl font-black uppercase tracking-widest text-emerald-400">
                  ATENDIENDO EN SILLA AHORA
                </span>
              </div>
              {currentServing && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentServing.appointmentType === "WALK_IN"
                    ? "🪑 Presencial / Sala"
                    : "📱 Turno Digital"}
                </span>
              )}
            </div>

            {/* Número de Turno y Cliente */}
            {currentServing ? (
              <div className="my-8 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 sm:gap-8 justify-center sm:justify-start">
                  <span className="text-8xl sm:text-9xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-white drop-shadow-lg">
                    {currentServing.turnLabel}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Cliente en Silla
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-white capitalize leading-tight">
                      {currentServing.clientName}
                    </h2>
                  </div>
                </div>

                {/* Servicio asignado */}
                <div className="mt-6 flex flex-wrap items-center gap-4 bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700/60">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    ✂️
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                      Servicio en proceso
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-slate-100">
                      {currentServing.service?.name || "Servicio General"}
                    </span>
                  </div>
                  {currentServing.service?.durationMinutes && (
                    <div className="ml-auto text-xs text-slate-400 flex items-center gap-1 font-medium bg-slate-900/60 px-3 py-1.5 rounded-lg">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      ~{currentServing.service.durationMinutes} min
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="my-16 text-center py-8">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
                  <Scissors className="h-8 w-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-300">
                  Silla Disponible
                </h2>
                <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  El barbero llamará al siguiente turno en breve. Puedes sacar tu turno en el código QR.
                </p>
              </div>
            )}

            {/* Pie de tarjeta: Estadísticas Rápidas de Hoy */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span>
                  Total de turnos hoy: <strong className="text-slate-200">{totalTurnsCount}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>
                  Atendidos con éxito: <strong className="text-emerald-300">{completedCount}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* TARJETA DE POSPUESTOS / POR LLEGAR (MUY IMPORTANTE) */}
          {postponed.length > 0 && (
            <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-base sm:text-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span>CLIENTES POSPUESTOS (POR LLEGAR)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {postponed.length} en espera de presentarse
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-4">
                Si tu turno fue llamado y no estabas en la sala, ¡no te preocupes! Acércate al barbero apenas llegues para asignarte el siguiente espacio disponible.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {postponed.map((turn) => (
                  <div
                    key={turn.id}
                    className="rounded-xl border border-amber-500/30 bg-slate-900/80 p-3.5 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <span className="text-xl font-black font-mono text-amber-400">
                        {turn.turnLabel}
                      </span>
                      <p className="text-sm font-bold text-white capitalize truncate max-w-[140px]">
                        {turn.clientName}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80 bg-amber-500/10 px-2 py-1 rounded">
                      Por Llegar
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: SIGUIENTE EN FILA + LISTA DE ESPERA + CÓDIGO QR */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          {/* 1. SIGUIENTE EN FILA */}
          <div className="rounded-3xl border border-sky-500/40 bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-900 p-6 shadow-xl">
            <span className="text-xs font-black uppercase tracking-widest text-sky-400 block mb-2">
              ⏳ SIGUIENTE EN FILA
            </span>

            {nextUp ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-5xl font-black font-mono text-sky-400">
                    {nextUp.turnLabel}
                  </span>
                  <h3 className="text-xl font-bold text-white capitalize mt-1">
                    {nextUp.clientName}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {nextUp.service?.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Prepárate
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-3">
                No hay más turnos en espera por el momento.
              </p>
            )}
          </div>

          {/* 2. PRÓXIMOS EN ESPERA */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Turnos en Espera ({waiting.length})
              </span>
              <span className="text-xs text-slate-500">Orden de llegada</span>
            </div>

            {waiting.length > 0 ? (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {waiting.slice(0, 6).map((turn, idx) => (
                  <div
                    key={turn.id}
                    className={`rounded-xl border p-3 flex items-center justify-between ${
                      idx === 0
                        ? "border-sky-500/30 bg-sky-950/20"
                        : "border-slate-800/80 bg-slate-950/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-base text-slate-200">
                        {turn.turnLabel}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white capitalize truncate max-w-[130px]">
                          {turn.clientName}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {turn.service?.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Posición #{idx + 1}
                    </span>
                  </div>
                ))}
                {waiting.length > 6 && (
                  <p className="text-center text-xs text-slate-500 pt-2">
                    + {waiting.length - 6} más en fila
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                Fila vacía. ¡Excelente momento para atenderte!
              </p>
            )}
          </div>

          {/* 3. CÓDIGO QR GIGANTE PARA SACAR TURNO DESDE EL CELULAR */}
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl flex items-center gap-5">
            <div className="bg-white p-2 rounded-2xl shadow-lg shrink-0">
              <img
                src={qrImageUrl}
                alt="QR para sacar turno"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
              />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1 mb-1">
                <QrCode className="h-3.5 w-3.5" />
                Saca tu turno aquí
              </span>
              <h4 className="text-sm font-bold text-white leading-snug">
                Escanea desde tu celular
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Solicita tu turno virtual y sigue tu turno en tiempo real sin esperar de pie.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 3. TICKER INFERIOR DE NOVEDADES */}
      <footer className="border-t border-slate-800 bg-slate-900/60 px-6 py-2.5 text-center text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>
            {business?.statusMessage ||
              "Bienvenido. Por favor conserva tu turno y acércate al ser llamado."}
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Powered by <strong>TurnoYa</strong> • Sistema de Turnos en Vivo
        </div>
      </footer>
    </div>
  );
}
