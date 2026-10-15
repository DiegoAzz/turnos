import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  LayoutDashboard,
  Clock,
  Scissors,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  Wallet,
  Smartphone,
  ShoppingBag,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import BusinessSwitcher from "@/components/BusinessSwitcher";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const selectedSlug = cookieStore.get("selected_business_slug")?.value;
  const adminSession = cookieStore.get("turnos_admin_session")?.value;
  const isAdmin = adminSession === "authenticated";

  // Obtenemos todos los negocios disponibles
  const allBusinesses = await prisma.business.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, plan: true, active: true },
  });

  let business = null;
  if (selectedSlug) {
    business = await prisma.business.findUnique({
      where: { slug: selectedSlug },
    });
  }

  // Solo el Super Admin tiene acceso fallback al primer negocio si no ha seleccionado ninguno
  if (!business && isAdmin && allBusinesses.length > 0) {
    business = await prisma.business.findFirst({
      orderBy: { createdAt: "asc" },
    });
  }

  // Si no hay negocio conectado ni es Super Admin, redirigir a inicio de sesión
  if (!business) {
    redirect("/login");
  }

  // Si la empresa está suspendida y no es el Super Admin
  if (!business.active && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-red-200 text-center max-w-md shadow-lg">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Cuenta Suspendida</h2>
          <p className="text-sm text-gray-600 mt-2">
            El acceso para <strong>{business.name}</strong> ha sido temporalmente suspendido por facturación o mantenimiento.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Por favor, ponte en contacto con el administrador del servicio para reactivar tu cuenta.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="text-xs text-emerald-600 font-semibold hover:underline"
            >
              Iniciar sesión con otra cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPro = business.plan === "PRO";

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

          {/* NEGOCIO Y SELECTOR MULTIEMPRESA */}
          <BusinessSwitcher
            currentBusiness={business}
            allBusinesses={allBusinesses}
            isAdmin={isAdmin}
          />

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
              href="/dashboard/productos"
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-4 w-4 text-emerald-600" />
                <span>Productos & Tienda</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">PRO</span>
            </Link>
            <Link
              href="/dashboard/contabilidad"
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              <div className="flex items-center gap-3">
                <Wallet className="h-4 w-4 text-emerald-600" />
                <span>Contabilidad</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">PRO</span>
            </Link>
            <Link
              href="/dashboard/app-movil"
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                <span>App Móvil (APK)</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">PRO</span>
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
        <div className="p-4 border-t border-gray-100 space-y-2">
          {isAdmin ? (
            <Link
              href="/admin"
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white py-2 text-xs font-bold hover:bg-slate-800 transition"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>👑 Volver a Super Admin</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cambiar de Negocio</span>
            </Link>
          )}

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
            <span className="text-xs rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
              {business.name}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
