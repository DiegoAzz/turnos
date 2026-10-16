"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Scissors,
  CheckCircle2,
  Stethoscope,
  Car,
  HeartHandshake,
  Wrench,
  Building2,
  MapPin,
  HelpCircle,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

interface OnboardingModalProps {
  business: any;
  onComplete: (updatedBusiness: any) => void;
  onClose?: () => void;
}

const CATEGORIES = [
  {
    id: "BARBERIA",
    title: "Barbería & Peluquería",
    desc: "Cortes modernos, barbas al vapor, tintes y peinados",
    icon: Scissors,
    badge: "💈 Barberos",
    color: "from-blue-500/10 to-indigo-500/10 border-blue-200 text-blue-900",
  },
  {
    id: "MANICURA_SPA",
    title: "Manicura, Uñas & Spa",
    desc: "Acrílicas, semipermanente, pedicura spa, cejas y pestañas",
    icon: Sparkles,
    badge: "💅 Manicuristas & Spa",
    color: "from-pink-500/10 to-rose-500/10 border-pink-200 text-pink-900",
  },
  {
    id: "SALUD_CONSULTORIO",
    title: "Salud & Consultorio",
    desc: "Médicos, odontólogos, psicólogos, fisioterapia y terapeutas",
    icon: Stethoscope,
    badge: "🩺 Profesionales de la Salud",
    color: "from-teal-500/10 to-emerald-500/10 border-teal-200 text-teal-900",
  },
  {
    id: "LAVADERO",
    title: "Lavadero & Detailing",
    desc: "Lavado exterior e interior, encerado, pulido y detallado de autos",
    icon: Car,
    badge: "🚗 Lavaderos & Autos",
    color: "from-amber-500/10 to-orange-500/10 border-amber-200 text-amber-900",
  },
  {
    id: "VETERINARIA",
    title: "Veterinaria & Mascotas",
    desc: "Consultas veterinarias, baño, vacunación y peluquería canina",
    icon: HeartHandshake,
    badge: "🐾 Mascotas",
    color: "from-emerald-500/10 to-green-500/10 border-emerald-200 text-emerald-900",
  },
  {
    id: "OTRO",
    title: "Otro Negocio o Servicios",
    desc: "Tatuadores, talleres, clases personalizadas, asesorías y citas",
    icon: Wrench,
    badge: "⚡ Servicios Generales",
    color: "from-purple-500/10 to-indigo-500/10 border-purple-200 text-purple-900",
  },
];

export default function OnboardingModal({
  business,
  onComplete,
  onClose,
}: OnboardingModalProps) {
  // Limpiar nombre inicial eliminando sufijos como "(Turnos)"
  const cleanInitialName = (business.name || "")
    .replace(/\s*\(Turnos\)\s*$/i, "")
    .trim();

  const [name, setName] = useState(cleanInitialName || "");
  const [category, setCategory] = useState(
    business.category && business.category !== "PENDIENTE"
      ? business.category
      : "BARBERIA"
  );
  const [serviceModality, setServiceModality] = useState(
    business.serviceModality || "LOCAL"
  );
  const [currency, setCurrency] = useState(business.currency || "COP");
  const [generateInitialServices, setGenerateInitialServices] = useState(true);
  const [phone, setPhone] = useState(business.phone || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Por favor ingresa el nombre de tu negocio o marca.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/business/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          name: name.trim(),
          category,
          serviceModality,
          currency,
          phone: phone.trim() || null,
          generateInitialServices,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el perfil.");
      }

      onComplete(data.business);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8 cursor-default"
      >
        {/* ENCABEZADO DE BIENVENIDA */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-6 text-white text-center sm:text-left sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Configuración Inicial en 30 Segundos</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              ¡Personaliza tu Negocio en TurnoYa!
            </h2>
            <p className="text-xs text-emerald-100 mt-1 max-w-md">
              Dinos qué tipo de negocio tienes para adaptar automáticamente tu agenda, servicios y modalidad de reservas.
            </p>
          </div>

          {onClose && (
            <div className="flex items-center gap-3 mt-3 sm:mt-0 justify-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="text-white/80 hover:text-white text-xs underline font-semibold cursor-pointer"
              >
                Omitir por ahora
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
                title="Cerrar modal (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* PASO 1: NOMBRE DEL NEGOCIO */}
          <div>
            <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
              1. Nombre de tu Negocio o Marca *
            </label>
            <div className="relative">
              <Building2 className="h-4 w-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                autoFocus
                placeholder="Ej. Barbería El Rey, Dra. Sofía Odontología, Nails Spa Camila"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              Este es el nombre visible que tus clientes verán al agendar sus turnos.
            </p>
          </div>

          {/* PASO 2: SELECCIÓN DE RUBRO */}
          <div>
            <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-2">
              2. ¿A qué rubro o especialidad te dedicas? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`text-left p-3.5 rounded-2xl border-2 transition relative flex items-start gap-3 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/70"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-gray-900">
                          {cat.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                        {cat.desc}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="absolute right-3 top-3 h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PASO 3: MODALIDAD Y MONEDA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                3. Modalidad de Atención *
              </label>
              <select
                value={serviceModality}
                onChange={(e) => setServiceModality(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="LOCAL">🏢 Solo en Local Físico / Establecimiento</option>
                <option value="DOMICILIO">🚗 Solo a Domicilio (Vas donde el cliente)</option>
                <option value="HIBRIDO">🔄 Híbrido (En Local y a Domicilio)</option>
              </select>
              <p className="mt-1 text-[11px] text-gray-400">
                Si eliges domicilio o híbrido, la página le pedirá la dirección al cliente.
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
                4. Moneda de tus Precios *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="COP">🇨🇴 Colombia (Pesos COP $)</option>
                <option value="USD">🇺🇸 Internacional / Dólares (USD $)</option>
                <option value="MXN">🇲🇽 México (Pesos MXN $)</option>
                <option value="PEN">🇵🇪 Perú (Soles PEN S/)</option>
                <option value="ARS">🇦🇷 Argentina (Pesos ARS $)</option>
                <option value="CLP">🇨🇱 Chile (Pesos CLP $)</option>
                <option value="BOB">🇧🇴 Bolivia (Bolivianos BOB Bs)</option>
                <option value="DOP">🇩🇴 Rep. Dominicana (Pesos DOP RD$)</option>
                <option value="GTQ">🇬🇹 Guatemala (Quetzales GTQ Q)</option>
                <option value="CRC">🇨🇷 Costa Rica (Colones CRC ₡)</option>
                <option value="EUR">🇪🇺 Europa (Euros €)</option>
              </select>
            </div>
          </div>

          {/* WHATSAPP (OPCIONAL) */}
          <div>
            <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
              5. WhatsApp de Contacto (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. +57 310 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* CHECKBOX AUTOMÁTICO DE SERVICIOS SUGERIDOS */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-start gap-3">
            <input
              type="checkbox"
              id="generateServicesCheckbox"
              checked={generateInitialServices}
              onChange={(e) => setGenerateInitialServices(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label
              htmlFor="generateServicesCheckbox"
              className="text-xs text-emerald-950 font-medium cursor-pointer"
            >
              <strong className="block text-emerald-900 font-bold mb-0.5">
                🪄 Cargar automáticamente 2 servicios sugeridos para mi rubro
              </strong>
              Crearemos 2 servicios reales y listos con duraciones estándar para que no tengas que empezar desde cero. Podrás cambiarlos o editarlos cuando desees.
            </label>
          </div>

          {/* BOTÓN SUBMIT */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#059669", color: "#ffffff" }}
              className="w-full rounded-2xl py-3.5 px-4 text-xs font-extrabold shadow-lg shadow-emerald-600/30 hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Guardando y configurando tu negocio...</span>
              ) : (
                <>
                  <span>Guardar y Comenzar a Gestionar Turnos</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
