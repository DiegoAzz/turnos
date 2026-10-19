"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  Users,
  Scissors,
  BarChart3,
  Tv,
  ShoppingBag,
  Wallet,
  Smartphone,
  CreditCard,
  Crown,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export type ViewMode = "BARBERIA" | "MANICURA_SPA" | "CITAS_GENERALES" | "ALL";

interface DashboardSidebarNavProps {
  category: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPro: boolean;
  plan: string;
}

export default function DashboardSidebarNav({
  category,
  isAdmin,
  isSuperAdmin,
  isPro,
  plan,
}: DashboardSidebarNavProps) {
  const pathname = usePathname();

  // Determinar modo inicial: para admin se puede leer de localStorage, para usuario normal es su categoría fija
  const getInitialMode = (): ViewMode => {
    if (isAdmin || isSuperAdmin) {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("turnoya_view_mode") as ViewMode;
        if (saved && ["BARBERIA", "MANICURA_SPA", "CITAS_GENERALES", "ALL"].includes(saved)) {
          return saved;
        }
      }
      // Si el negocio seleccionado es MANICURA_SPA, abrir en MANICURA_SPA; si es BARBERIA, en BARBERIA
      if (category === "MANICURA_SPA") return "MANICURA_SPA";
      if (category === "BARBERIA") return "BARBERIA";
      return "ALL";
    }

    // Usuario regular del negocio
    if (category === "MANICURA_SPA") return "MANICURA_SPA";
    if (category === "BARBERIA") return "BARBERIA";
    return "CITAS_GENERALES";
  };

  const [viewMode, setViewMode] = useState<ViewMode>(getInitialMode);

  const handleModeChange = (newMode: ViewMode) => {
    setViewMode(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("turnoya_view_mode", newMode);
      window.dispatchEvent(new CustomEvent("turnoya_view_mode_change", { detail: newMode }));
    }
  };

  useEffect(() => {
    // Si cambia la categoría del negocio seleccionado desde el switcher
    if (!isAdmin && !isSuperAdmin) {
      if (category === "MANICURA_SPA") setViewMode("MANICURA_SPA");
      else if (category === "BARBERIA") setViewMode("BARBERIA");
      else setViewMode("CITAS_GENERALES");
    }
  }, [category, isAdmin, isSuperAdmin]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto">
      <div>
        {/* SELECTOR DE VISTA ESPECIALIZADA PARA SUPER ADMIN / DEMO */}
        {(isAdmin || isSuperAdmin) && (
          <div className="p-3 bg-gradient-to-b from-amber-50 to-white border-b border-amber-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
                <Crown className="h-3.5 w-3.5 text-amber-600" />
                Ventas & Demostración:
              </span>
              <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-black">
                VIP
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => handleModeChange("BARBERIA")}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold text-left transition flex items-center gap-1.5 ${
                  viewMode === "BARBERIA"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <span>💈</span>
                <span className="truncate">Barbería</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("MANICURA_SPA")}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold text-left transition flex items-center gap-1.5 ${
                  viewMode === "MANICURA_SPA"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <span>💅</span>
                <span className="truncate">Manicura</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("CITAS_GENERALES")}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold text-left transition flex items-center gap-1.5 ${
                  viewMode === "CITAS_GENERALES"
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <span>📅</span>
                <span className="truncate">Citas</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("ALL")}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold text-left transition flex items-center gap-1.5 ${
                  viewMode === "ALL"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <span>⭐</span>
                <span className="truncate">Ver Todo</span>
              </button>
            </div>

            <Link
              href="/dashboard/super-control"
              className={`mt-2.5 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-black transition border shadow-sm ${
                isActive("/dashboard/super-control")
                  ? "bg-amber-600 text-white border-amber-700 shadow"
                  : "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white hover:opacity-95 border-amber-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-200" />
                <span>⚡ Super Control Maestro</span>
              </div>
              <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded font-black uppercase tracking-wider text-amber-100">
                VIP
              </span>
            </Link>
          </div>
        )}

        {/* ENLACES SEGÚN LA VISTA ACTIVA */}
        <nav className="p-3 space-y-4">
          {/* MODO 1: BARBERÍA PURA */}
          {viewMode === "BARBERIA" && (
            <>
              <div>
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  💈 Flujo de Barbería
                </p>
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                    <span>Turnero & Cola en Vivo</span>
                  </Link>

                  <Link
                    href="/dashboard/citas"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/citas")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span>Citas Agendadas</span>
                  </Link>

                  <Link
                    href="/dashboard/equipo"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/equipo")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-emerald-600" />
                      <span>Equipo & Sillas</span>
                    </div>
                    <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-black">
                      Barberos
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/botonera"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/botonera")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Tv className="h-4 w-4 text-teal-600" />
                      <span>Botonera de Tocador</span>
                    </div>
                    <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-bold">
                      1-Toque
                    </span>
                  </Link>
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  📦 Negocio & Ventas
                </p>
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard/servicios"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/servicios")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Scissors className="h-4 w-4 text-gray-500" />
                    <span>Cortes & Precios</span>
                  </Link>

                  <Link
                    href="/dashboard/productos"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/productos")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4 text-gray-500" />
                      <span>Ceras, Geles & POS</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                      Tienda
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/reportes"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/reportes")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-4 w-4 text-gray-500" />
                      <span>Caja & Métricas</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                      En Vivo
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/contabilidad"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/contabilidad")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Wallet className="h-4 w-4 text-gray-500" />
                    <span>Contabilidad</span>
                  </Link>

                  <Link
                    href="/dashboard/app-movil"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/app-movil")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span>App Móvil (APK)</span>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* MODO 2: MANICURA & SPA */}
          {viewMode === "MANICURA_SPA" && (
            <>
              <div>
                <p className="px-3 text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">
                  💅 Agenda & Belleza
                </p>
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard")
                        ? "bg-rose-50 text-rose-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4 text-rose-600" />
                    <span>Resumen de Agenda</span>
                  </Link>

                  <Link
                    href="/dashboard/citas"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/citas")
                        ? "bg-rose-50 text-rose-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Clock className="h-4 w-4 text-rose-600" />
                    <span>Citas de Manicura & Spa</span>
                  </Link>
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">
                  💖 Fidelización & Clientas
                </p>
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard/clientes"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/clientes")
                        ? "bg-rose-50 text-rose-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-rose-600" />
                      <span>Clientas VIP & CRM</span>
                    </div>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                      🎂 Cumples
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/servicios"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/servicios")
                        ? "bg-rose-50 text-rose-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Scissors className="h-4 w-4 text-rose-600" />
                    <span>Servicios & Domicilios</span>
                  </Link>

                  <Link
                    href="/dashboard/productos"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/productos")
                        ? "bg-rose-50 text-rose-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4 text-rose-600" />
                      <span>Esmaltes & Cuidados</span>
                    </div>
                  </Link>
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  📊 Reportes & Finanzas
                </p>
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard/reportes"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/reportes")
                        ? "bg-rose-50 text-rose-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-4 w-4 text-gray-500" />
                      <span>Informes & Métricas</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                      En Vivo
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/contabilidad"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/contabilidad")
                        ? "bg-rose-50 text-rose-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Wallet className="h-4 w-4 text-gray-500" />
                    <span>Control de Insumos & Gastos</span>
                  </Link>

                  <Link
                    href="/dashboard/app-movil"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/app-movil")
                        ? "bg-rose-50 text-rose-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span>App Móvil de tu Marca</span>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* MODO 3: CITAS GENERALES */}
          {viewMode === "CITAS_GENERALES" && (
            <>
              <div>
                <p className="px-3 text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-1">
                  📅 Citas & Agenda
                </p>
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard")
                        ? "bg-teal-50 text-teal-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4 text-teal-600" />
                    <span>Resumen</span>
                  </Link>

                  <Link
                    href="/dashboard/citas"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/citas")
                        ? "bg-teal-50 text-teal-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Clock className="h-4 w-4 text-teal-600" />
                    <span>Agenda de Citas</span>
                  </Link>

                  <Link
                    href="/dashboard/clientes"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/clientes")
                        ? "bg-teal-50 text-teal-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-teal-600" />
                      <span>Directorio de Clientes</span>
                    </div>
                  </Link>
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  💼 Operación
                </p>
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard/servicios"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/servicios")
                        ? "bg-teal-50 text-teal-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Scissors className="h-4 w-4 text-gray-500" />
                    <span>Servicios</span>
                  </Link>

                  <Link
                    href="/dashboard/reportes"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/reportes")
                        ? "bg-teal-50 text-teal-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-4 w-4 text-gray-500" />
                      <span>Informes & Métricas</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                      En Vivo
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/contabilidad"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/contabilidad")
                        ? "bg-teal-50 text-teal-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Wallet className="h-4 w-4 text-gray-500" />
                    <span>Contabilidad</span>
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* MODO 4: SUPER ADMIN - TODO ORGANIZADO SIN CONFUSIONES */}
          {viewMode === "ALL" && (
            <>
              <div>
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  📌 Principal
                </p>
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                    <span>Resumen General</span>
                  </Link>

                  <Link
                    href="/dashboard/citas"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/citas")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span>Citas y Turnos</span>
                  </Link>
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>💈 Módulo Barbería</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded">Especializado</span>
                </p>
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard/equipo"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/equipo")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-slate-700" />
                      <span>Equipo & Sillas de Barberos</span>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/botonera"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/botonera")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Tv className="h-4 w-4 text-teal-600" />
                      <span>Botonera Física de Tocador</span>
                    </div>
                    <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-bold">
                      1-Toque
                    </span>
                  </Link>
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>💅 Módulo Manicura & Spa</span>
                  <span className="text-[9px] bg-rose-100 text-rose-800 px-1 rounded">Especializado</span>
                </p>
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard/clientes"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/clientes")
                        ? "bg-rose-50 text-rose-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-rose-600" />
                      <span>Clientas VIP & CRM</span>
                    </div>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                      🎂 Cumples
                    </span>
                  </Link>
                </div>
              </div>

              <div>
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  📊 Ecosistema & Finanzas
                </p>
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard/servicios"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/servicios")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Scissors className="h-4 w-4 text-gray-500" />
                    <span>Servicios del Negocio</span>
                  </Link>

                  <Link
                    href="/dashboard/reportes"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/reportes")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-4 w-4 text-gray-500" />
                      <span>Informes & Métricas</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                      En Vivo
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/productos"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/productos")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4 text-gray-500" />
                      <span>Productos & Tienda (POS)</span>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/contabilidad"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/contabilidad")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Wallet className="h-4 w-4 text-gray-500" />
                    <span>Contabilidad</span>
                  </Link>

                  <Link
                    href="/dashboard/app-movil"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive("/dashboard/app-movil")
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span>App Móvil (APK)</span>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* SUSCRIPCIÓN COMÚN A TODOS */}
          <div className="pt-2 border-t border-gray-100">
            <Link
              href="/dashboard/suscripcion"
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                isActive("/dashboard/suscripcion")
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <span>Suscripción & Plan</span>
              </div>
              {plan === "SUPERADMIN" ? (
                <span className="text-[10px] bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black px-1.5 py-0.2 rounded shadow-sm">
                  👑 VIP
                </span>
              ) : isPro ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                  PRO
                </span>
              ) : null}
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
