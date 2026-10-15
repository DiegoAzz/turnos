"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Sparkles, Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navegación suave si ya estamos en la página de inicio, o redirección directa con ancla si estamos en otra página
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    setMobileMenuOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${hash}`);
      }
    }
  };

  const handleAffiliatesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileMenuOpen(false);
    if (pathname === "/afiliados") {
      e.preventDefault();
      const el = document.getElementById("registro");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* LOGO */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center">
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Turno<span className="text-emerald-600">Ya</span>
              </span>
              <span className="ml-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                SaaS
              </span>
            </div>
            <span className="block text-[10px] text-gray-400 font-medium -mt-0.5 leading-none">
              por Appzplay
            </span>
          </div>
        </Link>

        {/* NAVEGACIÓN DESKTOP */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/#caracteristicas"
            onClick={(e) => handleNavClick(e, "caracteristicas")}
            className="text-sm font-semibold text-gray-600 transition hover:text-emerald-600"
          >
            Características
          </Link>
          <Link
            href="/#como-funciona"
            onClick={(e) => handleNavClick(e, "como-funciona")}
            className="text-sm font-semibold text-gray-600 transition hover:text-emerald-600"
          >
            Cómo Funciona
          </Link>
          <Link
            href="/#precios"
            onClick={(e) => handleNavClick(e, "precios")}
            className="text-sm font-semibold text-gray-600 transition hover:text-emerald-600"
          >
            Precios
          </Link>
          <Link
            href="/afiliados"
            onClick={handleAffiliatesClick}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-200 transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            Sé Embajador (Comisiones Recurrentes)
          </Link>
        </nav>

        {/* BOTONES DERECHA DESKTOP */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-700 hover:text-emerald-600 px-3 py-2 transition"
          >
            Acceso Negocio
          </Link>
          <Link
            href="/dashboard"
            style={{ backgroundColor: "#111827", color: "#ffffff" }}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            Panel →
          </Link>
        </div>

        {/* BOTÓN HAMBURGUESA MÓVIL */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/dashboard"
            style={{ backgroundColor: "#111827", color: "#ffffff" }}
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          >
            Panel →
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* MENÚ DESPLEGABLE MÓVIL */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <Link
            href="/#caracteristicas"
            onClick={(e) => handleNavClick(e, "caracteristicas")}
            className="block py-2 text-sm font-semibold text-gray-700 hover:text-emerald-600"
          >
            Características
          </Link>
          <Link
            href="/#como-funciona"
            onClick={(e) => handleNavClick(e, "como-funciona")}
            className="block py-2 text-sm font-semibold text-gray-700 hover:text-emerald-600"
          >
            Cómo Funciona
          </Link>
          <Link
            href="/#precios"
            onClick={(e) => handleNavClick(e, "precios")}
            className="block py-2 text-sm font-semibold text-gray-700 hover:text-emerald-600"
          >
            Precios
          </Link>
          <Link
            href="/afiliados"
            onClick={handleAffiliatesClick}
            className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Sé Embajador (Comisiones Recurrentes)
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Acceso Negocio (Iniciar Sesión)
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              style={{ backgroundColor: "#059669", color: "#ffffff" }}
              className="text-center py-2.5 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-600/20"
            >
              Entrar al Panel de Control →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
