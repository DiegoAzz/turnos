"use client";

import { useState } from "react";
import { MessageCircle, Clock, Check, Sparkles, Plus, Sliders } from "lucide-react";

interface ReminderSettingsProps {
  business: {
    id: string;
    name: string;
    autoRemindersEnabled?: boolean;
    reminderTiming?: string;
    reminderMessageTemplate?: string | null;
  };
  onClose: () => void;
  onSaved: (updatedBusiness: any) => void;
}

export default function ReminderSettingsModal({
  business,
  onClose,
  onSaved,
}: ReminderSettingsProps) {
  const [enabled, setEnabled] = useState(business.autoRemindersEnabled ?? true);
  
  // Analizar valor actual de timing
  const initialTiming = business.reminderTiming || "15_MINUTES_BEFORE";
  const isCustomInitial = initialTiming.startsWith("CUSTOM_");

  const [timing, setTiming] = useState(isCustomInitial ? "CUSTOM" : initialTiming);
  const [customValue, setCustomValue] = useState(
    isCustomInitial ? initialTiming.split("_")[1] || "30" : "30"
  );
  const [customUnit, setCustomUnit] = useState(
    isCustomInitial ? initialTiming.split("_")[2] || "MINUTES" : "MINUTES"
  );

  const [template, setTemplate] = useState(
    business.reminderMessageTemplate ||
      `Hola {cliente} 👋 Te recordamos tu cita hoy en *{negocio}*:

⏰ *Hora:* {hora}
✂️ *Servicio:* {servicio}

Por favor responde:
👉 *1* para Confirmar asistencia
👉 *2* para Cancelar o Reagendar

¡Muchas gracias!`
  );

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Insertar variable en el cursor o al final del texto
  const insertVariable = (variable: string) => {
    setTemplate((prev) => prev + " " + variable);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    // Calcular el string final de timing
    const finalTiming =
      timing === "CUSTOM"
        ? `CUSTOM_${customValue}_${customUnit}`
        : timing;

    try {
      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          autoRemindersEnabled: enabled,
          reminderTiming: finalTiming,
          reminderMessageTemplate: template,
        }),
      });

      const data = await res.json();
      if (res.ok && data.business) {
        setSavedSuccess(true);
        onSaved(data.business);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  // Vista previa simulada
  const previewMessage = template
    .replace(/{cliente}/g, "Juancito")
    .replace(/{negocio}/g, business.name)
    .replace(/{hora}/g, "18:30")
    .replace(/{fecha}/g, "Hoy")
    .replace(/{servicio}/g, "Corte Clásico");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">
                Configuración de Recordatorios por WhatsApp
              </h3>
              <p className="text-xs text-gray-500">
                Define cuándo y con qué frecuencia enviar los avisos a tus clientes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            ✕
          </button>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-pulse">
            <Check className="h-4 w-4" />
            <span>¡Configuración de recordatorios guardada con éxito!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-5">
          {/* SWITCH ACTIVAR RECORDATORIOS */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <span className="font-bold text-xs text-gray-900 block">
                Recordatorios Automáticos por WhatsApp
              </span>
              <span className="text-[11px] text-gray-500">
                Enviar mensajes de confirmación y aviso de asistencia
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* FRECUENCIA / ANTICIPACIÓN */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              <span>¿Con qué anticipación enviar el recordatorio?</span>
            </label>
            <select
              disabled={!enabled}
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="15_MINUTES_BEFORE">⚡ 15 minutos antes de la cita (Predeterminado)</option>
              <option value="30_MINUTES_BEFORE">⏱️ 30 minutos antes de la cita</option>
              <option value="1_HOUR_BEFORE">⏱️ 1 hora antes de la cita</option>
              <option value="2_HOURS_BEFORE">⏱️ 2 horas antes de la cita</option>
              <option value="24_HOURS_BEFORE">📅 24 horas antes (1 día de anticipación)</option>
              <option value="SAME_DAY_MORNING">☀️ El mismo día por la mañana (8:00 AM)</option>
              <option value="CUSTOM">⚙️ Personalizado (Elegir minutos u horas a medida)</option>
            </select>

            {/* CAMPOS CUANDO ELIGE PERSONALIZADO */}
            {timing === "CUSTOM" && (
              <div className="mt-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <Sliders className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-emerald-950">Enviar</span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="w-20 bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-900 text-center focus:outline-none"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-900 focus:outline-none"
                >
                  <option value="MINUTES">Minutos antes</option>
                  <option value="HOURS">Horas antes</option>
                  <option value="DAYS">Días antes</option>
                </select>
              </div>
            )}
          </div>

          {/* PLANTILLA DE MENSAJE PERSONALIZADA Y EDITABLE */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-800">
                Plantilla del Mensaje de WhatsApp (Editable)
              </label>
              <span className="text-[10px] text-gray-400">
                Variables dinámicas
              </span>
            </div>

            {/* BOTONES RÁPIDOS PARA INSERTAR VARIABLES */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => insertVariable("{cliente}")}
                className="text-[11px] bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 px-2 py-0.5 rounded-lg border border-gray-200 font-mono transition"
              >
                + &#123;cliente&#125;
              </button>
              <button
                type="button"
                onClick={() => insertVariable("{hora}")}
                className="text-[11px] bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 px-2 py-0.5 rounded-lg border border-gray-200 font-mono transition"
              >
                + &#123;hora&#125;
              </button>
              <button
                type="button"
                onClick={() => insertVariable("{servicio}")}
                className="text-[11px] bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 px-2 py-0.5 rounded-lg border border-gray-200 font-mono transition"
              >
                + &#123;servicio&#125;
              </button>
              <button
                type="button"
                onClick={() => insertVariable("{negocio}")}
                className="text-[11px] bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 px-2 py-0.5 rounded-lg border border-gray-200 font-mono transition"
              >
                + &#123;negocio&#125;
              </button>
            </div>

            <textarea
              disabled={!enabled}
              rows={5}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs text-gray-900 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* EXPLICACIÓN DE FUNCIONAMIENTO */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs text-blue-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <span>💡 ¿Cómo se envían los recordatorios automáticos?</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Mientras tengas tu panel de control abierto, el sistema monitorea tus citas en tiempo real. Cuando falten exactamente los minutos configurados (ej. <strong>{timing === "CUSTOM" ? `${customValue} ${customUnit === "MINUTES" ? "minutos" : "horas"}` : "15 minutos"}</strong>), sonará una campana 🔔, recibirás una alerta en pantalla y se abrirá WhatsApp con el mensaje redactado en un solo clic.
            </p>
            <p className="text-[10px] text-blue-600 font-medium">
              🔒 Salen directamente desde tu propio WhatsApp personal, sin pagar APIs de Meta ni costos adicionales.
            </p>
          </div>

          {/* VISTA PREVIA ESTILO BURBUJA WHATSAPP */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 block mb-1">
              Vista Previa en Tiempo Real:
            </label>
            <div className="bg-[#EFEAE2] p-3.5 rounded-2xl border border-gray-200">
              <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm text-xs text-gray-800 whitespace-pre-wrap max-w-sm">
                {previewMessage}
                <div className="text-[10px] text-gray-400 text-right mt-1">10:45 AM ✓✓</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition"
            >
              {saving ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
