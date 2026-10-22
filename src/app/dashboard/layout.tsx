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
  Users,
  BarChart3,
  Tv,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import BusinessSwitcher from "@/components/BusinessSwitcher";
import DashboardSidebarNav from "@/components/DashboardSidebarNav";
import DashboardLogoutButton from "@/components/DashboardLogoutButton";
import ClientAwaitingServicesScreen from "@/components/ClientAwaitingServicesScreen";
import { getVerifiedBusinessSlug, verifyAdminSession } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const selectedSlug = await getVerifiedBusinessSlug();
  const isAdmin = await verifyAdminSession();

  // Obtenemos todos los negocios disponibles SOLO si el usuario es Super Admin autenticado
  const allBusinesses = isAdmin
    ? await prisma.business.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, slug: true, plan: true, category: true, active: true, stripeCurrentPeriodEnd: true },
      })
    : [];

  let business = null;
  if (selectedSlug) {
    business = await prisma.business.findUnique({
      where: { slug: selectedSlug },
    });
  }

  // Solo el Super Admin tiene acceso fallback al primer negocio si no ha seleccionado ninguno
  if (!business && isAdmin && allBusinesses.length > 0) {
    business = allBusinesses[0];
  }

  // Si no hay negocio conectado ni es Super Admin, redirigir a inicio de sesión
  if (!business) {
    redirect("/login");
  }

  // Verificación autónoma de suscripción:
  // Si venció el periodo pagado (30 días) y no ha renovado, degradar automáticamente a FREE sin intervención manual
  if (
    business.plan !== "FREE" &&
    business.plan !== "SUPERADMIN" &&
    !isAdmin &&
    business.stripeCurrentPeriodEnd &&
    new Date(business.stripeCurrentPeriodEnd) < new Date()
  ) {
    business = await prisma.business.update({
      where: { id: business.id },
      data: { plan: "FREE" },
    });
    console.log(`[Autonomía TurnoYa] Negocio ${business.name} venció su periodo. Plan degradado automáticamente a FREE.`);
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

  const isSuperAdmin = business.plan === "SUPERADMIN" || isAdmin;
  const isPro = business.plan === "PRO" || isSuperAdmin;

  // REGLA SAAS: Si el cliente NO es Super Admin y tiene CERO (0) servicios asignados,
  // no ve nada de su dashboard habitual hasta que el Super Administrador le asigne sus servicios con checsitos.
  if (!isSuperAdmin) {
    const servicesCount = await prisma.service.count({
      where: { businessId: business.id },
    });

    if (servicesCount === 0) {
      return <ClientAwaitingServicesScreen business={business} />;
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col justify-between hidden md:flex">
        <div className="flex-1 flex flex-col min-h-0">
          {/* LOGO */}
          <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6 shrink-0">
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

          {/* NAVEGACIÓN ESPECIALIZADA POR RUBRO (BARBERÍA / MANICURA / CITAS) */}
          <DashboardSidebarNav
            category={business.category || "BARBERIA"}
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
            isPro={isPro}
            plan={business.plan}
          />
        </div>

        {/* FOOTER DEL SIDEBAR */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          {isAdmin ? (
            <Link
              href="/admin"
              style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold shadow-md hover:bg-slate-800 transition border border-slate-700"
            >
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
              <span style={{ color: "#ffffff" }} className="font-bold">Volver a Super Admin</span>
            </Link>
          ) : (
            <DashboardLogoutButton />
          )}

          <Link
            href="/"
            style={{ color: "#4b5563", backgroundColor: "#f9fafb" }}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2 text-xs font-semibold hover:bg-gray-100 transition"
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
