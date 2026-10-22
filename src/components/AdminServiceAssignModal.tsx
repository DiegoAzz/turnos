"use client";

import { useState, useEffect } from "react";
import {
  X,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Sparkles,
  Plus,
  Trash2,
  ShieldCheck,
  ExternalLink,
  Layers,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ServiceItem {
  id?: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  currency?: string;
  alreadyExists?: boolean;
}

interface AdminServiceAssignModalProps {
  business: {
    id: string;
    name: string;
    slug: string;
    category?: string;
    currency: string;
    plan: string;
    totalServicios?: number;
  };
  onClose: () => void;
  onSuccess: (updatedCount: number) => void;
}

export default function AdminServiceAssignModal({
  business,
  onClose,
  onSuccess,
}: AdminServiceAssignModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentServices, setCurrentServices] = useState<ServiceItem[]>([]);
  const [presetCatalog, setPresetCatalog] = useState<ServiceItem[]>([]);
  const [selectedPresets, setSelectedPresets] = useState<Record<string, boolean>>({});
  const [editablePrices, setEditablePrices] = useState<Record<string, number>>({});
  const [editableDurations, setEditableDurations] = useState<Record<string, number>>({});
  const [clearExisting, setClearExisting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formulario de servicio personalizado rápido
  const [customName, setCustomName] = useState("");
  const [customDuration, setCustomDuration] = useState(30);
  const [customPrice, setCustomPrice] = useState(business.currency === "USD" ? 10 : 25000);
  const [customDesc, setCustomDesc] = useState("");

  const loadServicesData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/services/assign?businessId=${business.id}`);
      if (!res.ok) throw new Error("Error al consultar el catálogo.");
      const data = await res.json();

      setCurrentServices(data.currentServices || []);
      setPresetCatalog(data.presetCatalog || []);

      // Pre-seleccionar por defecto los que NO existen aún si el negocio tiene 0 servicios
      const initialSelected: Record<string, boolean> = {};
      const initialPrices: Record<string, number> = {};
      const initialDurations: Record<string, number> = {};

      (data.presetCatalog || []).forEach((p: ServiceItem) => {
        initialPrices[p.name] = p.price;
        initialDurations[p.name] = p.durationMinutes;
        // Si el negocio tiene 0 servicios, auto-marcamos los primeros 3 para ahorrarle clics al reseller
        if ((data.currentServices || []).length === 0 && !p.alreadyExists) {
          initialSelected[p.name] = true;
        } else {
          initialSelected[p.name] = false;
        }
      });

      setSelectedPresets(initialSelected);
      setEditablePrices(initialPrices);
      setEditableDurations(initialDurations);
    } catch (err: any) {
      setErrorMessage(err.message || "Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServicesData();
  }, [business.id]);

  const togglePreset = (name: string) => {
    setSelectedPresets((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const selectAll = () => {
    const next: Record<string, boolean> = {};
    presetCatalog.forEach((p) => {
      next[p.name] = true;
    });
    setSelectedPresets(next);
  };

  const deselectAll = () => {
    const next: Record<string, boolean> = {};
    presetCatalog.forEach((p) => {
      next[p.name] = false;
    });
    setSelectedPresets(next);
  };

  const handleAssignSelected = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const toAssign: ServiceItem[] = [];

    // Recoger los seleccionados del catálogo
    presetCatalog.forEach((p) => {
      if (selectedPresets[p.name]) {
        toAssign.push({
          name: p.name,
          description: p.description,
          durationMinutes: editableDurations[p.name] || p.durationMinutes,
          price: editablePrices[p.name] !== undefined ? editablePrices[p.name] : p.price,
        });
      }
    });

    // Si además llenó el formulario personalizado
    if (customName.trim()) {
      toAssign.push({
        name: customName.trim(),
        description: customDesc.trim() || "Servicio personalizado",
        durationMinutes: customDuration,
        price: customPrice,
      });
    }

    if (toAssign.length === 0) {
      setErrorMessage("Por favor marca al menos un servicio con checsito [✓] para asignarle al cliente.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/services/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          servicesToAssign: toAssign,
          clearExisting,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudieron asignar los servicios.");
      }

      setSuccessMessage(data.message || "¡Servicios asignados con éxito! Cuenta desbloqueada.");
      setCustomName("");
      setCustomDesc("");
      onSuccess(data.totalServices);
      await loadServicesData();
    } catch (err: any) {
      setErrorMessage(err.message || "Error al asignar servicios.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId?: string) => {
    if (!serviceId) return;
    if (!confirm("¿Deseas eliminar este servicio de este negocio?")) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/services/assign?serviceId=${serviceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar servicio.");

      await loadServicesData();
      onSuccess(currentServices.length - 1);
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = Object.values(selectedPresets).filter(Boolean).length + (customName.trim() ? 1 : 0);
  const isZeroServices = currentServices.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-8 text-white relative flex flex-col max-h-[92vh]">
        {/* ENCABEZADO */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/60 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                SUPER ADMIN
              </span>
              <h2 className="text-xl font-bold text-white">
                Asignar Servicios con Checsitos
              </h2>
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <span className="text-slate-200 font-semibold">🏢 {business.name}</span>
              <span>•</span>
              <span className="text-emerald-400">
                {business.category === "MANICURA_SPA"
                  ? "💅 Manicura/Spa"
                  : business.category === "BARBERIA"
                  ? "💈 Barbería"
                  : business.category === "LAVADERO"
                  ? "🚗 Lavadero"
                  : "⚡ General"}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-300">Moneda: {business.currency}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ALERTA DE ESTADO */}
        <div className="px-6 pt-4 shrink-0">
          {isZeroServices ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">
                  ⚠️ Esta cuenta tiene CERO (0) servicios asignados.
                </p>
                <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                  El cliente ve actualmente la pantalla de espera y su panel está bloqueado.
                  Marca los checsitos abajo y haz clic en <strong>"Habilitar Servicios"</strong> para desbloquearlo de inmediato.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Este negocio tiene <strong>{currentServices.length} servicios activos</strong>. Su panel está desbloqueado.
                </span>
              </div>
              <span className="font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px]">
                Activo
              </span>
            </div>
          )}

          {successMessage && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-400 text-red-300 text-xs font-semibold flex items-center gap-2">
              <X className="h-4 w-4" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* CUERPO CON SCROLL */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-r-transparent"></div>
              <p className="mt-3 text-xs">Cargando catálogo maestro...</p>
            </div>
          ) : (
            <>
              {/* SECCIÓN 1: SERVICIOS ACTUALES (SI TIENE) */}
              {currentServices.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-400" />
                    <span>Servicios ya Habilitados en este Negocio ({currentServices.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentServices.map((cs) => (
                      <div
                        key={cs.id || cs.name}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-white truncate">{cs.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            ⏱️ {cs.durationMinutes} min • 💰 {formatCurrency(cs.price, business.currency)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteService(cs.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition shrink-0"
                          title="Eliminar este servicio"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 2: CATÁLOGO DE CHECSITOS */}
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <span>⚡ Marca los Servicios que quieres Habilitarle (Checsitos [✓])</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={selectAll}
                      className="text-amber-400 hover:text-amber-300 font-bold hover:underline"
                    >
                      Marcar Todos
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={deselectAll}
                      className="text-slate-400 hover:text-slate-300 hover:underline"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {presetCatalog.map((preset) => {
                    const isChecked = Boolean(selectedPresets[preset.name]);
                    const exists = preset.alreadyExists;

                    return (
                      <div
                        key={preset.name}
                        onClick={() => togglePreset(preset.name)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer select-none flex items-start gap-3.5 ${
                          isChecked
                            ? "bg-amber-500/10 border-amber-500/50 shadow-sm"
                            : exists
                            ? "bg-slate-950/40 border-slate-800 opacity-60"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {/* CHECSITO VISIBLE Y GRANDE */}
                        <div
                          className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isChecked
                              ? "bg-amber-400 text-slate-950 shadow-md font-black"
                              : "border-2 border-slate-600 bg-slate-900"
                          }`}
                        >
                          {isChecked && <Check className="h-4 w-4 stroke-[3]" />}
                        </div>

                        {/* INFO DEL SERVICIO */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">{preset.name}</span>
                            {exists && (
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                                Ya asignado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {preset.description}
                          </p>

                          {/* CONTROLES RÁPIDOS DE DURACIÓN Y PRECIO */}
                          <div
                            className="mt-2.5 flex items-center gap-3 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <input
                                type="number"
                                min={5}
                                step={5}
                                value={editableDurations[preset.name] ?? preset.durationMinutes}
                                onChange={(e) =>
                                  setEditableDurations((prev) => ({
                                    ...prev,
                                    [preset.name]: parseInt(e.target.value, 10) || 30,
                                  }))
                                }
                                className="w-12 bg-transparent text-slate-200 font-mono font-bold focus:outline-none"
                              />
                              <span className="text-slate-500 text-[11px]">min</span>
                            </div>

                            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
                              <span className="text-amber-400 font-bold">$</span>
                              <input
                                type="number"
                                min={0}
                                value={editablePrices[preset.name] ?? preset.price}
                                onChange={(e) =>
                                  setEditablePrices((prev) => ({
                                    ...prev,
                                    [preset.name]: parseFloat(e.target.value) || 0,
                                  }))
                                }
                                className="w-20 bg-transparent text-amber-300 font-mono font-bold focus:outline-none"
                              />
                              <span className="text-slate-500 text-[11px]">{business.currency}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECCIÓN 3: AGREGAR SERVICIO PERSONALIZADO EXTRA */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-400" />
                  <span>¿Deseas añadir otro servicio personalizado para este cliente?</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-400 block mb-1">Nombre del Servicio</label>
                    <input
                      type="text"
                      placeholder="Ej. Tinte & Tratamiento Capilar"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Precio ({business.currency})</label>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* OPCIÓN: REEMPLAZAR TODOS */}
              {currentServices.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={clearExisting}
                    onChange={(e) => setClearExisting(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>
                    Reemplazar catálogo existente por completo (borrará los anteriores y dejará solo los marcados)
                  </span>
                </label>
              )}
            </>
          )}
        </div>

        {/* PIE DE ACCIONES */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
          >
            Cerrar
          </button>

          <button
            onClick={handleAssignSelected}
            disabled={submitting || selectedCount === 0}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {submitting
                ? "Habilitando servicios..."
                : `⚡ Habilitar ${selectedCount} Servicios Seleccionados y Desbloquear`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
