import Link from "next/link";
import {
  Calendar,
  LayoutDashboard,
  Clock,
  Scissors,
  CreditCard,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Obtenemos el negocio principal o demo
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const isPro = business?.plan === "PRO";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col justify-between hidden md:flex">
        <div>
          {/* LOGO */}
          <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">
                Turno<span className="text-emerald-600">Ya</span>
              </span>
              <span className="ml-1 text-[10px] font-semibold text-gray-400">Panel</span>
            </div>
          </div>

          {/* NEGOCIO Y PLAN STATUS */}
          <div className="p-4 border-b border-gray-100">
            <div className="rounded-xl bg-gray-50 p-3 border border-gray-200/80">
              <p className="text-xs text-gray-400 font-medium">Negocio conectado:</p>
              <h3 className="text-sm font-bold text-gray-900 truncate">
                {business?.name || "Mi Negocio"}
              </h3>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    isPro
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  {isPro ? "Plan Pro" : "Plan Gratuito"}
                </span>

                <Link
                  href={`/p/${business?.slug || "barberia-elite"}`}
                  target="_blank"
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Ver Link
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* MENU LINKS */}
          <nav className="p-4 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              <LayoutDashboard className="h-4 w-4" />
              Resumen
            </Link>
            <Link
              href="/dashboard/citas"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              <Clock className="h-4 w-4" />
              Citas y Turnos
            </Link>
            <Link
              href="/dashboard/servicios"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              <Scissors className="h-4 w-4" />
              Servicios
            </Link>
            <Link
              href="/dashboard/suscripcion"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              <CreditCard className="h-4 w-4" />
              Suscripción & Plan
            </Link>
          </nav>
        </div>

        {/* FOOTER DEL SIDEBAR */}
        <div className="p-4 border-t border-gray-100">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            ← Volver a la Landing
          </Link>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 md:hidden">
          <span className="text-lg font-bold text-gray-900">
            Turno<span className="text-emerald-600">Ya</span>
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/suscripcion"
              className="text-xs rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700"
            >
              {isPro ? "Pro" : "Free"}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
