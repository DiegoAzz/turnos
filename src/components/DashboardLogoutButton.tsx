"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function DashboardLogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
    } finally {
      // Limpiar cookies residuales en el navegador
      document.cookie = "selected_business_slug=; path=/; max-age=0";
      document.cookie = "turnos_admin_session=; path=/; max-age=0";
      window.location.href = "/login";
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{ color: "#4b5563", backgroundColor: "#ffffff" }}
      className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2 text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
    >
      <LogOut className="h-3.5 w-3.5 text-gray-500" />
      <span>{loading ? "Cerrando..." : "Cerrar Sesión"}</span>
    </button>
  );
}
