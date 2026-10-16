import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  MessageCircle,
  Sparkles,
  ExternalLink,
  Plus,
} from "lucide-react";
import DashboardClientActions from "./DashboardClientActions";

import { getCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const business = await getCurrentBusiness({
    services: true,
    appointments: {
      include: { service: true },
      orderBy: { startTime: "asc" },
    },
  });

  if (!business) {
    redirect("/login");
  }

  const appointments: any[] = business.appointments || [];

  // Métricas
  const totalCitas = appointments.length;
  const ingresosEstimados = appointments
    .filter((a: any) => a.status !== "CANCELLED")
    .reduce((sum: number, a: any) => sum + (a.service?.price || 0), 0);

  const confirmadas = appointments.filter((a: any) => a.status === "CONFIRMED").length;
  const recordatoriosEnviados = appointments.filter((a: any) => a.reminderSent).length;

  return (
    <div className="space-y-8">
      {/* BANNER DE BIENVENIDA */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Panel de {business.name}
          </h1>
          <p className="text-sm text-gray-500">
            Administra tus citas de hoy, recordatorios por WhatsApp y servicios activos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/p/${business.slug}`}
            target="_blank"
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
            Página de Reservas
          </Link>

          <Link
            href="/dashboard/servicios"
            style={{ backgroundColor: "#059669", color: "#ffffff" }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo Servicio
          </Link>
        </div>
      </div>

      {/* METRICAS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total de Citas</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totalCitas}</p>
          <span className="text-xs text-gray-400">Registradas en el sistema</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Ingresos Estimados</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(ingresosEstimados, business.currency)}
          </p>
          <span className="text-xs text-gray-400">Por citas no canceladas</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Citas Confirmadas</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{confirmadas}</p>
          <span className="text-xs text-emerald-600 font-medium">Asistencia asegurada</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Recordatorios WhatsApp</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <MessageCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{recordatoriosEnviados}</p>
          <span className="text-xs text-gray-400">Notificaciones enviadas</span>
        </div>
      </div>

      {/* LISTA INTERACTIVA DE CITAS DE HOY */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Agenda de Citas</h2>
            <p className="text-xs text-gray-500">
              Gestiona el estado y envía recordatorios directos por WhatsApp
            </p>
          </div>
          <Link
            href="/dashboard/citas"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Ver todas las citas →
          </Link>
        </div>

        <DashboardClientActions initialAppointments={appointments} business={business} />
      </div>
    </div>
  );
}
