import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Calendar,
  CheckCircle,
  MessageCircle,
  Clock,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <div className="text-center lg:col-span-7 lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  SaaS de Suscripción para Profesionales y Negocios
                </div>

                <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  Tus citas organizadas. <br />
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    Cero ausencias
                  </span>{" "}
                  con WhatsApp.
                </h1>

                <p className="mt-6 text-lg leading-relaxed text-gray-600 sm:text-xl">
                  Permite a tus clientes agendar turnos las 24 horas desde su celular y envía recordatorios automáticos por WhatsApp para que nunca más dejen una hora vacía.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                  <Link
                    href="/dashboard"
                    style={{ backgroundColor: "#059669", color: "#ffffff" }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 sm:w-auto"
                  >
                    Entrar al Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/p/barberia-elite"
                    target="_blank"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                  >
                    Ver Página de Reserva Pública
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 lg:justify-start">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Sin comisiones por cita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Confirmación instantánea</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Listo para Coolify y producción</span>
                  </div>
                </div>
              </div>

              {/* MOCKUP INTERACTIVO */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md rounded-2xl border border-gray-200/80 bg-white p-6 shadow-2xl">
                  {/* WhatsApp Reminder Simulation Card */}
                  <div className="mb-4 rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-900">Recordatorio Automático</p>
                        <p className="text-[11px] text-emerald-700">Enviado vía WhatsApp</p>
                      </div>
                    </div>
                    <p className="mt-2.5 text-xs text-emerald-950 font-mono bg-white/70 p-2.5 rounded-lg border border-emerald-100/50">
                      &quot;Hola Carlos 👋 Te recordamos tu cita hoy a las 10:30 para Corte Clásico & Fade. Responde 1 para confirmar.&quot;
                    </p>
                  </div>

                  {/* Calendar booking card mini */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900">Barbería & Spa Elite</h4>
                        <p className="text-xs text-gray-500">Selecciona tu horario</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                        Hoy Disponible
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-emerald-500 bg-emerald-50/50 p-2 text-center text-xs font-semibold text-emerald-700">
                        10:30 AM
                      </div>
                      <div className="rounded-lg border border-gray-200 p-2 text-center text-xs font-medium text-gray-600 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer">
                        11:30 AM
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-100/60 p-2 text-center text-xs font-medium text-gray-400 line-through">
                        12:30 PM
                      </div>
                    </div>

                    <Link
                      href="/p/barberia-elite"
                      className="block w-full text-center rounded-lg bg-gray-900 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 transition"
                    >
                      Probar Experiencia de Reserva Real →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFICIOS / VALOR */}
        <section id="caracteristicas" className="py-20 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Diseñado para Negocios Reales
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Todo lo que necesitas para llenar tu agenda
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
                Olvídate de responder mensajes a medianoche anotando turnos en una libreta de papel.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  Recordatorios por WhatsApp
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Envía confirmaciones y recordatorios con 1 clic directo a la app de WhatsApp del cliente. Reduce ausencias hasta en un 85%.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  Disponibilidad en Tiempo Real
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  El sistema calcula automáticamente los huecos libres según la duración de tus servicios y evita reservas dobles o empalmadas.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  Panel de Control & Métricas
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Visualiza tus ingresos estimados, citas diarias, clientes recurrentes y administra los estados de tus servicios en segundos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION (PLANES DE SUSCRIPCIÓN SAAS) */}
        <section id="precios" className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                Planes Transparentes
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Monetización Lista para tu SaaS
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
                El sistema incluye la pasarela de Stripe configurada para cobrar suscripciones recurrentes a tus clientes.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-2">
              {/* PLAN FREE */}
              <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Plan Emprendedor</h3>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      Gratis
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Para profesionales independientes que están empezando a digitalizarse.
                  </p>
                  <div className="mt-6">
                    <span className="text-4xl font-extrabold text-gray-900">$0</span>
                    <span className="text-sm font-medium text-gray-500"> / siempre</span>
                  </div>

                  <ul className="mt-8 space-y-3 text-sm text-gray-600">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Hasta 30 citas por mes
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Hasta 2 servicios activos
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Página de reserva pública personalizada
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Recordatorios manuales por WhatsApp
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    href="/dashboard"
                    className="block w-full text-center rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Empezar Gratis
                  </Link>
                </div>
              </div>

              {/* PLAN PRO */}
              <div className="relative flex flex-col justify-between rounded-2xl border-2 border-emerald-600 bg-white p-8 shadow-xl">
                <div className="absolute -top-3.5 right-6 rounded-full bg-emerald-600 px-3.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                  Recomendado
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Plan Pro Ilimitado</h3>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Suscripción
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Para negocios establecidos que quieren maximizar su agenda y automatizar todo.
                  </p>
                  <div className="mt-6">
                    <span className="text-4xl font-extrabold text-gray-900">$19</span>
                    <span className="text-sm font-medium text-gray-500"> / mes</span>
                  </div>

                  <ul className="mt-8 space-y-3 text-sm text-gray-700">
                    <li className="flex items-center gap-3 font-medium">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      <strong>Citas y reservas ilimitadas</strong>
                    </li>
                    <li className="flex items-center gap-3 font-medium">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      <strong>Servicios y categorías ilimitadas</strong>
                    </li>
                    <li className="flex items-center gap-3 font-medium">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      Recordatorios automáticos con 1 clic por WhatsApp
                    </li>
                    <li className="flex items-center gap-3 font-medium">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      Personalización de marca y logotipo propio
                    </li>
                    <li className="flex items-center gap-3 font-medium">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      Soporte prioritario 24/7
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    href="/dashboard/suscripcion"
                    className="block w-full text-center rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 transition"
                  >
                    Suscribirse al Plan Pro ($19/mes)
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
