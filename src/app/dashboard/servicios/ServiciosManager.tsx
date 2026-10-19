"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Clock, Sparkles, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ServiciosManager({
  initialServices,
  business,
}: {
  initialServices: any[];
  business: any;
}) {
  const [services, setServices] = useState(initialServices);
  const [showModal, setShowModal] = useState(false);

  // Formulario nuevo servicio
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [price, setPrice] = useState("20");
  const [loading, setLoading] = useState(false);

  const isPro = business.plan === "PRO" || business.plan === "SUPERADMIN";
  const isIndependiente = business.plan === "INDEPENDIENTE";
  const limitReached = !isPro && !isIndependiente && services.length >= 2;

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      setLoading(true);
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          name,
          description,
          durationMinutes,
          price,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.upgradeRequired) {
          alert("Límite alcanzado: El Plan Gratuito solo permite 2 servicios. Actualiza a Pro para servicios ilimitados.");
        } else {
          alert(data.error || "Error al crear el servicio.");
        }
        return;
      }

      setServices([data.service, ...services]);
      setShowModal(false);
      setName("");
      setDescription("");
      setDurationMinutes("30");
      setPrice("20");
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este servicio?")) return;

    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        setServices(services.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error(err);
      alert("Error al eliminar servicio");
    }
  };

  return (
    <div className="space-y-6">
      {/* BANNER DE LIMITE DEL PLAN FREE */}
      {!isPro && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-amber-50 p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Plan Gratuito: {services.length} de 2 servicios utilizados
              </p>
              <p className="text-xs text-amber-700">
                Actualiza al Plan Pro ($19/mes) para crear servicios y categorías ilimitadas.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/suscripcion"
            style={{ backgroundColor: "#059669", color: "#ffffff" }}
            className="rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition inline-flex items-center justify-center shrink-0"
          >
            Actualizar a Pro →
          </Link>
        </div>
      )}

      {/* HEADER CON BOTON */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500">
          {services.length} {services.length === 1 ? "servicio configurado" : "servicios configurados"}
        </p>

        <button
          onClick={() => {
            if (limitReached) {
              alert("Has alcanzado el límite de 2 servicios del Plan Gratuito. Por favor actualiza al Plan Pro.");
              return;
            }
            setShowModal(true);
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
            limitReached
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
          }`}
        >
          <Plus className="h-4 w-4" />
          Añadir Servicio
        </button>
      </div>

      {/* GRID DE SERVICIOS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-gray-900 text-base">{service.name}</h3>
                <span className="font-extrabold text-gray-900 text-base">
                  {formatCurrency(service.price, business.currency)}
                </span>
              </div>

              {service.description && (
                <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                  {service.description}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                <span>{service.durationMinutes} minutos</span>
              </div>

              <button
                onClick={() => handleDeleteService(service.id)}
                title="Eliminar servicio"
                className="text-gray-400 hover:text-rose-600 transition p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREAR SERVICIO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">Crear Nuevo Servicio</h2>
            <p className="text-xs text-gray-500 mb-4">
              Este servicio se mostrará en tu página pública de reservas.
            </p>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Corte Clásico & Lavado"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalla lo que incluye el servicio..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Duración (minutos) *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Precio ({business.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar Servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
