"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ExternalLink, ChevronDown, ShieldCheck, LogOut, Check } from "lucide-react";

interface BusinessBasic {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
}

export default function BusinessSwitcher({
  currentBusiness,
  allBusinesses,
  isAdmin,
}: {
  currentBusiness: BusinessBasic | null;
  allBusinesses: BusinessBasic[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSelectBusiness = async (slug: string) => {
    if (slug === currentBusiness?.slug) {
      setIsOpen(false);
      return;
    }

    try {
      setSwitching(true);
      await fetch("/api/admin/switch-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      setIsOpen(false);
      router.refresh();
      // Pequeño timeout para forzar recarga si Next server component cachea
      setTimeout(() => {
        window.location.reload();
      }, 150);
    } catch (err) {
      console.error(err);
    } finally {
      setSwitching(false);
    }
  };

  const isSuperAdmin = currentBusiness?.plan === "SUPERADMIN";
  const isPro = currentBusiness?.plan === "PRO" || isSuperAdmin;

  return (
    <div className="p-4 border-b border-gray-100">
      {/* BADGE DE SUPER ADMIN SI TIENE SESIÓN ACTIVA */}
      {isAdmin && (
        <div className="mb-2.5 flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1 text-[11px] font-bold text-amber-700">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
            <span>Super Admin Activo</span>
          </div>
          <Link
            href="/admin"
            className="text-amber-800 hover:underline font-extrabold flex items-center gap-0.5"
          >
            Panel Maestro →
          </Link>
        </div>
      )}

      {/* TARJETA DEL NEGOCIO ACTUAL */}
      <div className="rounded-xl bg-gray-50 p-3 border border-gray-200/80">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-gray-400 font-medium">Negocio conectado:</p>
          {isAdmin && allBusinesses.length > 1 && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5"
            >
              <span>Cambiar</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          )}
        </div>

        <h3 className="text-sm font-bold text-gray-900 truncate mt-0.5">
          {currentBusiness?.name || "Sin Negocio"}
        </h3>

        {/* DROPDOWN SELECTOR DE NEGOCIOS (PARA ADMIN) */}
        {isOpen && isAdmin && (
          <div className="mt-2.5 border-t border-gray-200 pt-2 space-y-1 max-h-48 overflow-y-auto">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Seleccionar Empresa:
            </p>
            {allBusinesses.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectBusiness(b.slug)}
                disabled={switching}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                  b.slug === currentBusiness?.slug
                    ? "bg-emerald-100 text-emerald-800 font-bold"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <span className="truncate">{b.name}</span>
                {b.slug === currentBusiness?.slug && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
              </button>
            ))}
          </div>
        )}

        {/* PLAN & ENLACE PÚBLICO */}
        <div className="mt-2.5 flex items-center justify-between pt-1">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              isSuperAdmin
                ? "bg-amber-100 text-amber-900 border border-amber-300 font-black"
                : isPro
                ? "bg-emerald-100 text-emerald-800"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            {isSuperAdmin ? "👑 Super Admin" : isPro ? "Plan Pro" : "Plan Free"}
          </span>

          {currentBusiness && (
            <Link
              href={`/p/${currentBusiness.slug}`}
              target="_blank"
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <span>Ver Link</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
