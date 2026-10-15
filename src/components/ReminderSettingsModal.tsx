"use client";

import { useState } from "react";
import { MessageCircle, Settings, Check, Clock, Sparkles, AlertCircle } from "lucide-react";

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
  const [timing, setTiming] = useState(business.reminderTiming || "2_HOURS_BEFORE");
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          autoRemindersEnabled: enabled,
          reminderTiming: timing,
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
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
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
              <option value="1_HOUR_BEFORE">⏱️ 1 hora antes de la cita</option>
              <option value="2_HOURS_BEFORE">⏱️ 2 horas antes de la cita (Recomendado)</option>
              <option value="4_HOURS_BEFORE">⏱️ 4 horas antes de la cita</option>
              <option value="24_HOURS_BEFORE">📅 24 horas antes (1 día de anticipación)</option>
              <option value="SAME_DAY_MORNING">☀️ El mismo día por la mañana (8:00 AM)</option>
            </select>
          </div>

          {/* PLANTILLA DE MENSAJE PERSONALIZADA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-800">
                Plantilla del Mensaje de WhatsApp
              </label>
              <span className="text-[10px] text-gray-400">
                Variables: &#123;cliente&#125;, &#123;hora&#125;, &#123;servicio&#125;, &#123;negocio&#125;
              </span>
            </div>
            <textarea
              disabled={!enabled}
              rows={5}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs text-gray-900 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* VISTA PREVIA ESTILO BURBUJA WHATSAPP */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 block mb-1">
              Vista Previa de cómo le llegará al cliente:
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
