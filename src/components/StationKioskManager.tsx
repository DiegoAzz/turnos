"use client";

import { useState, useEffect } from "react";
import {
  Tv,
  CheckCircle2,
  Clock,
  Coffee,
  XCircle,
  Volume2,
  VolumeX,
  Keyboard,
  Cpu,
  Wifi,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { playAlertChime, unlockAudio } from "@/lib/sound";

interface StationKioskManagerProps {
  business: any;
}

export default function StationKioskManager({ business }: StationKioskManagerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pressing, setPressing] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"BUTTONS" | "HARDWARE">("BUTTONS");
  const [copiedCode, setCopiedCode] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const fetchKioskState = async () => {
    try {
      const res = await fetch(`/api/kiosk/press?slug=${business.slug}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error al consultar Kiosk:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKioskState();
    const interval = setInterval(fetchKioskState, 4000); // Polling cada 4s para sincronizar en vivo
    return () => clearInterval(interval);
  }, [business.slug]);

  // Manejo de Atajos de Teclado (para teclados numéricos USB o pedales bluetooth)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar si está escribiendo en un input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "1" || e.code === "Space") {
        e.preventDefault();
        handlePressButton("green");
      } else if (e.key === "2") {
        e.preventDefault();
        handlePressButton("yellow");
      } else if (e.key === "3") {
        e.preventDefault();
        handlePressButton("red");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [business.slug]);

  const handlePressButton = async (btnColor: "green" | "yellow" | "red") => {
    try {
      unlockAudio();
      setPressing(btnColor);

      if (soundEnabled) {
        playAlertChime();
      }

      const res = await fetch("/api/kiosk/press", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug: business.slug,
          btn: btnColor,
          pin: business.stationHardwarePin,
        }),
      });

      const json = await res.json();
      if (json.message) {
        setLastActionMessage(json.message);
        setTimeout(() => setLastActionMessage(null), 5000);
      }

      fetchKioskState();
    } catch (err) {
      console.error("Error al presionar botón:", err);
    } finally {
      setPressing(null);
    }
  };

  const arduinoCode = `// Firmware TurnoYa para ESP32 / ESP8266 con Módulo de 3 Botones Analógicos o Digitales
// Conecta el módulo de botones a GND, VCC (3.3V o 5V) y el pin de señal a A0 (o pines D1, D2, D3)

#include <WiFi.h>        // Usa <ESP8266WiFi.h> si es ESP8266 NodeMCU
#include <HTTPClient.h>

const char* ssid = "TU_NOMBRE_WIFI";
const char* password = "TU_CLAVE_WIFI";

const char* serverUrl = "https://turnos.appzplay.online/api/kiosk/press?slug=${business.slug}";

// Pines de botones (Digitales o lectura analógica del módulo)
const int PIN_VERDE = 12;     // Botón 1: Terminar y Llamar Siguiente
const int PIN_AMARILLO = 13;  // Botón 2: Pausa / Almuerzo
const int PIN_ROJO = 14;      // Botón 3: Cancelar / No Llegó

void setup() {
  Serial.begin(115200);
  pinMode(PIN_VERDE, INPUT_PULLUP);
  pinMode(PIN_AMARILLO, INPUT_PULLUP);
  pinMode(PIN_ROJO, INPUT_PULLUP);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Conectado a TurnoYa!");
}

void sendButtonPress(String color) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverUrl) + "&btn=" + color;
    http.begin(url);
    int httpCode = http.GET();
    Serial.println("TurnoYa respuesta: " + String(httpCode));
    http.end();
  }
}

void loop() {
  if (digitalRead(PIN_VERDE) == LOW) {
    Serial.println("🟢 Botón Verde presionado!");
    sendButtonPress("green");
    delay(1000); // Anti-rebote
  }
  if (digitalRead(PIN_AMARILLO) == LOW) {
    Serial.println("🟡 Botón Amarillo presionado!");
    sendButtonPress("yellow");
    delay(1000);
  }
  if (digitalRead(PIN_ROJO) == LOW) {
    Serial.println("🔴 Botón Rojo presionado!");
    sendButtonPress("red");
    delay(1000);
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(arduinoCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* TÍTULO Y CONTROLES SUPERIORES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
            <Tv className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <span>Botonera Rápida de Tocador & Estación</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                1 Toque
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Controla tu turno sin tocar el celular. Compatible con pantalla táctil, teclado USB o módulo físico de pared.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              soundEnabled
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-gray-50 border-gray-200 text-gray-400"
            }`}
            title="Activar o desactivar sonido de timbre"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{soundEnabled ? "Sonido ON" : "Silencio"}</span>
          </button>

          <a
            href={`/p/${business.slug}/turnero`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 transition shadow-sm"
          >
            <Tv className="h-4 w-4 text-emerald-400" />
            <span>Abrir Pantalla TV</span>
            <ExternalLink className="h-3 w-3 text-gray-400" />
          </a>
        </div>
      </div>

      {/* PESTAÑAS: BOTONERA VIRTUAL VS HARDWARE FÍSICO */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("BUTTONS")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === "BUTTONS"
              ? "bg-emerald-600 text-white shadow"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          🕹️ Botonera de Estación (Táctil & Teclado)
        </button>
        <button
          onClick={() => setActiveTab("HARDWARE")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
            activeTab === "HARDWARE"
              ? "bg-emerald-600 text-white shadow"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>🔌 Conectar Botonera Física de Pared (ESP32/WiFi)</span>
        </button>
      </div>

      {activeTab === "BUTTONS" ? (
        <div className="space-y-6">
          {/* AVISO DE ACCIÓN RECIENTE */}
          {lastActionMessage && (
            <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <Sparkles className="h-5 w-5 text-emerald-200" />
              <span className="font-extrabold text-sm">{lastActionMessage}</span>
            </div>
          )}

          {/* ESTADO EN VIVO DEL TURNO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TURNO EN ATENCIÓN ACTUAL */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-700 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>En Atención Ahora</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black">
                  EN SILLÓN
                </span>
              </div>

              {data?.inProgress ? (
                <div className="mt-3">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {data.inProgress.clientName}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 text-emerald-400 font-extrabold text-sm">
                    <span>{data.inProgress.service?.name}</span>
                    <span>·</span>
                    <span>Turno {data.inProgress.startTime}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-center py-4 text-slate-400">
                  <p className="font-bold text-sm">Ningún cliente en atención en este momento</p>
                  <p className="text-xs text-slate-500 mt-1">Presiona el botón verde para llamar al primero en fila.</p>
                </div>
              )}
            </div>

            {/* SIGUIENTE EN FILA */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Siguiente en Espera</span>
                </span>
                <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-extrabold text-xs">
                  {data?.waitingCount || 0} en fila
                </span>
              </div>

              {data?.nextWaiting ? (
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                    {data.nextWaiting.clientName}
                  </h3>
                  <p className="text-xs text-gray-500 font-bold mt-1">
                    {data.nextWaiting.service?.name} · Programado {data.nextWaiting.startTime}
                  </p>
                </div>
              ) : (
                <div className="mt-4 text-center py-4 text-gray-400">
                  <p className="font-bold text-xs">No hay más clientes en espera para hoy</p>
                </div>
              )}
            </div>
          </div>

          {/* LA BOTONERA DE 3 BOTONES IDÉNTICA AL MÓDULO FÍSICO */}
          <div className="bg-gradient-to-b from-slate-100 to-slate-200 p-6 sm:p-10 rounded-3xl border-4 border-slate-300 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-1 rounded-full text-xs font-black shadow-inner">
                <Keyboard className="h-3.5 w-3.5 text-emerald-400" />
                <span>PULSA EN PANTALLA O EN TU TECLADO FÍSICO (TECLAS 1, 2, 3)</span>
              </div>
            </div>

            {/* CONTENEDOR DE LOS 3 BOTONES GRANDES (ESTILO SEMÁFORO DE TOCADOR) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* 🟢 BOTÓN VERDE: TERMINAR Y LLAMAR SIGUIENTE */}
              <button
                type="button"
                disabled={pressing === "green"}
                onClick={() => handlePressButton("green")}
                className={`relative group flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-150 transform active:scale-95 shadow-2xl border-4 ${
                  pressing === "green" ? "scale-95 brightness-90 ring-8 ring-emerald-400/50" : ""
                } bg-gradient-to-b from-emerald-500 to-emerald-700 border-emerald-400 text-white hover:brightness-110`}
              >
                {/* Cabeza de botón circular tipo pulsador industrial */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-emerald-300 to-emerald-600 shadow-inner flex items-center justify-center border-4 border-emerald-200 mb-3 group-hover:scale-105 transition">
                  <CheckCircle2 className="h-12 w-12 text-white drop-shadow-md" />
                </div>
                <span className="text-lg font-black tracking-tight text-white drop-shadow">
                  ¡TERMINAR Y SIGUIENTE!
                </span>
                <span className="text-xs font-extrabold text-emerald-100 mt-1 opacity-90">
                  Avanza la fila y timbra
                </span>
                <span className="mt-3 text-[10px] bg-white text-emerald-900 px-3 py-1 rounded-full font-black shadow">
                  TECLA [ 1 ] O ESPACIO
                </span>
              </button>

              {/* 🟡 BOTÓN AMARILLO: PAUSA / ALMUERZO */}
              <button
                type="button"
                disabled={pressing === "yellow"}
                onClick={() => handlePressButton("yellow")}
                className={`relative group flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-150 transform active:scale-95 shadow-2xl border-4 ${
                  pressing === "yellow" ? "scale-95 brightness-90 ring-8 ring-amber-400/50" : ""
                } bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300 text-amber-950 hover:brightness-110`}
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-amber-200 to-amber-500 shadow-inner flex items-center justify-center border-4 border-amber-100 mb-3 group-hover:scale-105 transition">
                  <Coffee className="h-12 w-12 text-amber-950 drop-shadow-md" />
                </div>
                <span className="text-lg font-black tracking-tight text-amber-950 drop-shadow">
                  PAUSA / ALMUERZO
                </span>
                <span className="text-xs font-extrabold text-amber-900 mt-1 opacity-90">
                  {data?.business?.liveStatus === "LUNCH" ? "Reanudar atención" : "Pausar turnos temporalmente"}
                </span>
                <span className="mt-3 text-[10px] bg-amber-950 text-amber-300 px-3 py-1 rounded-full font-black shadow">
                  TECLA [ 2 ]
                </span>
              </button>

              {/* 🔴 BOTÓN ROJO: CANCELAR O NO LLEGÓ */}
              <button
                type="button"
                disabled={pressing === "red"}
                onClick={() => handlePressButton("red")}
                className={`relative group flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-150 transform active:scale-95 shadow-2xl border-4 ${
                  pressing === "red" ? "scale-95 brightness-90 ring-8 ring-rose-400/50" : ""
                } bg-gradient-to-b from-rose-500 to-rose-700 border-rose-400 text-white hover:brightness-110`}
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-rose-300 to-rose-600 shadow-inner flex items-center justify-center border-4 border-rose-200 mb-3 group-hover:scale-105 transition">
                  <XCircle className="h-12 w-12 text-white drop-shadow-md" />
                </div>
                <span className="text-lg font-black tracking-tight text-white drop-shadow">
                  CANCELAR / NO LLEGÓ
                </span>
                <span className="text-xs font-extrabold text-rose-100 mt-1 opacity-90">
                  Libera el turno y pasa al otro
                </span>
                <span className="mt-3 text-[10px] bg-white text-rose-900 px-3 py-1 rounded-full font-black shadow">
                  TECLA [ 3 ]
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* PESTAÑA HARDWARE FÍSICO / ARDUINO ESP32 */
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl shrink-0">
              <Cpu className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">
                Cómo armar tu Botonera Física de Pared para Barberos y Manicuristas
              </h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Puedes comprar el módulo de 3 botones (Verde, Amarillo, Rojo) idéntico a la foto en cualquier tienda de electrónica o MercadoLibre por menos de \$8.000 COP, conectarlo a un microchip WiFi ESP32 / ESP8266 (\$15.000 COP) y pegarlo en la pared al lado del espejo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
              <span className="font-bold text-gray-900 text-sm block mb-1">1. Materiales Baratos</span>
              <ul className="space-y-1 text-gray-600 list-disc list-inside">
                <li>Módulo 3 botones analógicos/digitales (\$6.000 COP)</li>
                <li>ESP32 o NodeMCU ESP8266 con WiFi (\$15.000 COP)</li>
                <li>Cargador viejo de celular USB (5V)</li>
                <li>Cinta doble faz para pegar a la pared</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
              <span className="font-bold text-gray-900 text-sm block mb-1">2. Tu URL Directa de Botón</span>
              <p className="text-gray-600 mb-2">
                Cualquier dispositivo que haga una petición HTTP a esta URL activa el turnero al instante:
              </p>
              <code className="bg-white p-2 rounded-lg border border-gray-300 block text-[10px] font-mono break-all text-emerald-800">
                https://turnos.appzplay.online/api/kiosk/press?slug={business.slug}&btn=green
              </code>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
              <span className="font-bold text-gray-900 text-sm block mb-1">3. Opción Sin Soldar (Teclado USB)</span>
              <p className="text-gray-600 leading-relaxed">
                ¡Si no quieres soldar cables! Puedes conectar un teclado numérico USB o Bluetooth de \$20.000 COP pegado debajo de tu tocador. Al presionar las teclas <strong>1</strong>, <strong>2</strong> o <strong>3</strong>, el sistema hace exactamente lo mismo.
              </p>
            </div>
          </div>

          {/* CÓDIGO FIRMWARE ARDUINO */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                <Wifi className="h-4 w-4 text-emerald-600" />
                <span>Código Firmware C++ / Arduino listo para flashear en tu ESP32:</span>
              </span>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCode ? "¡Copiado!" : "Copiar Código"}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-96 border border-slate-800">
              {arduinoCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
