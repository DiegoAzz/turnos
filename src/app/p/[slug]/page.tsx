"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
}

interface WorkingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  description: string | null;
  address: string | null;
  currency: string;
  plan: string;
}

export default function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Generar los próximos 14 días para reservar
  const availableDates = Array.from({ length: 14 }).map((_, index) => {
    const d = new Date();
    d.setDate(d.getDate() + index);
    return {
      iso: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("es-ES", { weekday: "short" }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString("es-ES", { month: "short" }),
      dayOfWeek: d.getDay(),
    };
  });

  // Cargar datos del negocio
  useEffect(() => {
    async function fetchBusiness() {
      try {
        setLoading(true);
        const res = await fetch(`/api/business/${slug}`);
        if (!res.ok) throw new Error("Negocio no encontrado");
        const data = await res.json();
        setBusiness(data.business);
        setServices(data.services);
        setWorkingHours(data.workingHours);
        if (availableDates.length > 0) {
          setSelectedDate(availableDates[0].iso);
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar la información.");
      } finally {
        setLoading(false);
      }
    }
    fetchBusiness();
  }, [slug]);

  // Actualizar slots ocupados al cambiar fecha
  useEffect(() => {
    if (!selectedDate || !slug) return;
    async function fetchSlots() {
      try {
        const res = await fetch(`/api/business/${slug}?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setBookedSlots(data.bookedSlots || []);
        }
      } catch (err) {
        console.error("Error al obtener slots:", err);
      }
    }
    fetchSlots();
  }, [selectedDate, slug]);

  // Generar franjas horarias del día seleccionado
  const generateSlotsForSelectedDate = () => {
    if (!selectedDate || workingHours.length === 0) return [];
    const dateObj = new Date(`${selectedDate}T12:00:00.000Z`);
    const dayOfWeek = dateObj.getDay();

    const wh = workingHours.find((w) => w.dayOfWeek === dayOfWeek);
    if (!wh || wh.isClosed) return [];

    const slots: string[] = [];
    const [startH, startM] = wh.openTime.split(":").map(Number);
    const [endH, endM] = wh.closeTime.split(":").map(Number);

    let currentMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    // Intervalo estándar de 30 minutos
    while (currentMin + 30 <= endMin) {
      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      currentMin += 30;
    }

    return slots;
  };

  const timeSlots = generateSlotsForSelectedDate();

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      alert("Por favor completa todos los campos requeridos.");
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanDigits = clientPhone.replace(/[^0-9]/g, "");
      let finalPhone = cleanDigits;
      if (cleanDigits.length === 10 && cleanDigits.startsWith("3")) {
        finalPhone = "57" + cleanDigits;
      } else if (!cleanDigits.startsWith("57") && !cleanDigits.startsWith("52") && !cleanDigits.startsWith("1")) {
        finalPhone = countryCode.replace("+", "") + cleanDigits;
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug: slug,
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedTime,
          clientName,
          clientPhone: finalPhone,
          clientEmail,
          clientNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo agendar la cita.");

      setBookingSuccess(data);
      setStep(5);
    } catch (err: any) {
      alert(err.message || "Error al procesar la reserva.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-gray-500">Cargando disponibilidad...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Página no encontrada</h2>
        <p className="mt-2 text-sm text-gray-500">{error || "El negocio solicitado no existe."}</p>
        <Link
          href="/"
          className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-xl">
        {/* ENCABEZADO DEL NEGOCIO */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <Sparkles className="h-3 w-3" />
                Reservas Online
              </span>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">{business.name}</h1>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-lg shadow-md shadow-emerald-500/20">
              {business.name.substring(0, 2).toUpperCase()}
            </div>
          </div>

          {business.description && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              {business.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
            {business.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                <span>{business.address}</span>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                <span>{business.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* CONTENEDOR DEL WIZARD DE RESERVA */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          {/* PASO 1: SELECCIONAR SERVICIO */}
          {step === 1 && (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">1. Selecciona un servicio</h2>
                <p className="text-xs text-gray-500">Elige lo que deseas realizarte hoy</p>
              </div>

              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-emerald-500 hover:shadow-sm ${
                      selectedService?.id === service.id
                        ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{service.name}</h3>
                        {service.description && (
                          <p className="mt-1 text-xs text-gray-500">{service.description}</p>
                        )}
                        <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-emerald-700">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{service.durationMinutes} minutos</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-gray-900">
                          {formatCurrency(service.price, business.currency)}
                        </span>
                        <ChevronRight className="mt-2 ml-auto h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASO 2: SELECCIONAR FECHA */}
          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Cambiar servicio ({selectedService?.name})
              </button>

              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">2. Elige el día</h2>
                <p className="text-xs text-gray-500">Próximos días con disponibilidad</p>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {availableDates.map((item) => {
                  const isSelected = selectedDate === item.iso;
                  return (
                    <button
                      key={item.iso}
                      onClick={() => setSelectedDate(item.iso)}
                      className={`flex flex-col items-center justify-center rounded-xl p-3 text-center border transition ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                          : "border-gray-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50"
                      }`}
                    >
                      <span className={`text-[10px] uppercase font-bold ${isSelected ? "text-emerald-100" : "text-gray-400"}`}>
                        {item.dayName}
                      </span>
                      <span className="my-0.5 text-lg font-extrabold">{item.dayNumber}</span>
                      <span className={`text-[10px] ${isSelected ? "text-emerald-100" : "text-gray-400"}`}>
                        {item.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  disabled={!selectedDate}
                  onClick={() => setStep(3)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  Continuar a Horarios →
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: SELECCIONAR HORA */}
          {step === 3 && (
            <div>
              <button
                onClick={() => setStep(2)}
                className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Cambiar fecha ({selectedDate})
              </button>

              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">3. Selecciona la hora</h2>
                <p className="text-xs text-gray-500">Horarios disponibles para {selectedDate}</p>
              </div>

              {timeSlots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                  El negocio no atiende en el día seleccionado. Por favor elige otra fecha.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {timeSlots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedTime === slot;

                    return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setSelectedTime(slot)}
                        className={`rounded-xl py-3 px-2 text-center text-xs font-semibold transition border ${
                          isBooked
                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                            : isSelected
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                            : "border-gray-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 text-gray-800"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  disabled={!selectedTime}
                  onClick={() => setStep(4)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  Ingresar mis Datos →
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: FORMULARIO DEL CLIENTE */}
          {step === 4 && (
            <form onSubmit={handleBookingSubmit}>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Cambiar hora ({selectedTime})
              </button>

              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">4. Datos de contacto</h2>
                <p className="text-xs text-gray-500">Para enviarte la confirmación y recordatorio</p>
              </div>

              {/* RESUMEN PREVIO */}
              <div className="mb-5 rounded-xl bg-gray-50 p-3.5 border border-gray-200 text-xs space-y-1.5 text-gray-700">
                <p>
                  <strong>Servicio:</strong> {selectedService?.name} (
                  {formatCurrency(selectedService?.price || 0, business.currency)})
                </p>
                <p>
                  <strong>Fecha y Hora:</strong> {selectedDate} a las {selectedTime}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Número de WhatsApp *
                  </label>
                  <div className="flex rounded-xl border border-gray-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 overflow-hidden bg-white">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-gray-50 border-r border-gray-300 px-2.5 py-2.5 text-xs text-gray-700 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="+57">🇨🇴 +57 (Colombia)</option>
                      <option value="+52">🇲🇽 +52 (México)</option>
                      <option value="+1">🇺🇸 +1 (USA)</option>
                      <option value="+34">🇪🇸 +34 (España)</option>
                      <option value="+54">🇦🇷 +54 (Argentina)</option>
                      <option value="+56">🇨🇱 +56 (Chile)</option>
                      <option value="+51">🇵🇪 +51 (Perú)</option>
                      <option value="+593">🇪🇨 +593 (Ecuador)</option>
                    </select>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 310 601 7261"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none font-medium"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Ingresa tu número de 10 dígitos para recibir el recordatorio automático en WhatsApp.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Correo electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Comentario adicional o preferencia
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Prefiero máquina baja en los laterales..."
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Confirmando reserva..." : "Confirmar Mi Turno"}
                </button>
              </div>
            </form>
          )}

          {/* PASO 5: PANTALLA DE CONFIRMACIÓN FINAL */}
          {step === 5 && (
            <div className="text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <h2 className="mt-4 text-2xl font-extrabold text-gray-900">
                ¡Tu turno está confirmado!
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Hemos reservado tu lugar en {business.name}.
              </p>

              {/* CARD DE DETALLE */}
              <div className="my-6 rounded-2xl bg-gray-50 p-4 border border-gray-200 text-left text-sm space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Cliente:</span>
                  <span className="font-semibold text-gray-900">{clientName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Servicio:</span>
                  <span className="font-semibold text-gray-900">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Fecha y Hora:</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedDate} a las {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(selectedService?.price || 0, business.currency)}
                  </span>
                </div>
              </div>

              {/* BOTON DE WHATSAPP DIRECTO */}
              {bookingSuccess?.whatsappUrl && (
                <a
                  href={bookingSuccess.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition mb-3"
                >
                  <MessageCircle className="h-5 w-5" />
                  Enviar comprobante por WhatsApp
                </a>
              )}

              <button
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedTime("");
                  setBookingSuccess(null);
                }}
                className="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-900 underline"
              >
                Agendar otra cita
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
