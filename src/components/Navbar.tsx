import Link from "next/link";
import { Calendar, Sparkles } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Turno<span className="text-emerald-600">Ya</span>
            </span>
            <span className="ml-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              SaaS
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#caracteristicas"
            className="text-sm font-medium text-gray-600 transition hover:text-emerald-600"
          >
            Características
          </a>
          <a
            href="#como-funciona"
            className="text-sm font-medium text-gray-600 transition hover:text-emerald-600"
          >
            Cómo Funciona
          </a>
          <a
            href="#precios"
            className="text-sm font-medium text-gray-600 transition hover:text-emerald-600"
          >
            Precios
          </a>
          <Link
            href="/afiliados"
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200 transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            Sé Embajador (Comisiones Recurrentes)
          </Link>
        </nav>

        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
