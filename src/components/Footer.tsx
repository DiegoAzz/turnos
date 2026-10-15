import Link from "next/link";
import { Calendar } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 py-12 text-gray-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              Turno<span className="text-emerald-600">Ya</span>
            </span>
            <span className="text-xs text-gray-400">© {new Date().getFullYear()}</span>
          </div>

          <p className="text-center text-sm text-gray-500">
            La plataforma líder de reservas y recordatorios por WhatsApp para profesionales y pequeños negocios.
          </p>

          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/login" className="text-gray-600 hover:text-emerald-600">
              Acceso Negocios
            </Link>
            <Link href="/afiliados" className="text-gray-600 hover:text-emerald-600">
              Sé Embajador
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-emerald-600">
              Panel
            </Link>
            <Link href="/admin/login" className="text-xs text-slate-400 hover:text-emerald-600 font-semibold">
              👑 Super Admin
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200/70 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3 text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} <strong>TurnoYa SaaS</strong>. Propiedad intelectual y derechos de autor reservados por <strong className="text-emerald-700 font-bold">Appzplay</strong>.
          </p>
          <p className="text-[11px] font-medium text-gray-400">
            Plataforma tecnológica operada por <a href="https://appzplay.online" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 underline font-semibold">Appzplay</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
