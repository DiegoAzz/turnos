"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, KeyRound, Building2, ArrowRight, AlertCircle } from "lucide-react";

export default function BusinessLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/business-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Datos de acceso incorrectos.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Error de conexión al servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white border border-gray-200 p-8 rounded-3xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 mb-4">
            <Calendar className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Acceso a tu Negocio
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Ingresa para gestionar tus citas, clientes y catálogo de servicios
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nombre de tu Negocio, Slug o Correo
            </label>
            <div className="relative">
              <Building2 className="h-4 w-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                autoFocus
                placeholder="ej: barberia-elite o tu@correo.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              PIN de Acceso (4 dígitos)
            </label>
            <div className="relative">
              <KeyRound className="h-4 w-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                maxLength={8}
                placeholder="****"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 font-mono tracking-widest placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              * PIN por defecto para nuevos negocios: <code>1234</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
          >
            {loading ? "Entrando..." : "Entrar a mi Panel"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 flex flex-col gap-2 text-center">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-800 transition"
          >
            ← Volver al inicio
          </Link>
          <Link
            href="/admin/login"
            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold transition"
          >
            👑 ¿Eres el Super Administrador? Acceso Maestro
          </Link>
        </div>
      </div>
    </div>
  );
}
