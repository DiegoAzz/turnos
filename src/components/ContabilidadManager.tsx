"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingDown,
  Wallet,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Sparkles,
  PieChart,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ContabilidadManager({ business }: { business: any }) {
  const isPro = business.plan === "PRO" || business.plan === "SUPERADMIN";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Formulario nuevo gasto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("INSUMOS");
  const [submitting, setSubmitting] = useState(false);

  const loadFinances = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finances?businessId=${business.id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinances();
  }, [business.id]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/finances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          description: description.trim(),
          amount: parseFloat(amount),
          category,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setDescription("");
        setAmount("");
        setCategory("INSUMOS");
        loadFinances();
      } else {
        alert("Error al guardar el gasto");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("¿Eliminar este registro de gasto?")) return;
    try {
      const res = await fetch(`/api/finances?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadFinances();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Si no tiene Plan PRO, mostrar banner de bloqueo para motivar la actualización
  if (!isPro) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50/60 to-white p-8 text-center max-w-2xl mx-auto shadow-sm">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-7 w-7" />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 mb-2">
          <Sparkles className="h-3 w-3" />
          Función Exclusiva del Plan PRO
        </span>
        <h3 className="text-xl font-bold text-gray-900 mt-1">
          Módulo Contable y Arqueo Financiero
        </h3>
        <p className="text-xs text-gray-600 mt-2 max-w-lg mx-auto leading-relaxed">
          Controla en tiempo real tus ingresos recaudados, registro de compras e insumos (esmaltes, productos, pasajes, arriendo), arqueo diario por Nequi y Efectivo, y cálculo automático de ganancia neta.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="/dashboard/suscripcion"
            style={{ backgroundColor: "#059669", color: "#ffffff" }}
            className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-90 transition inline-flex items-center justify-center"
          >
            Actualizar al Plan Pro ($19/mes)
          </a>
        </div>
      </div>
    );
  }

  const totalIncome = data?.totalIncome || 0;
  const totalExpenses = data?.totalExpenses || 0;
  const netProfit = data?.netProfit || 0;
  const incomeByMethod = data?.incomeByMethod || {};
  const expenses = data?.expenses || [];
  const completedAppointments = data?.completedAppointments || [];
  const currency = business.currency || "COP";

  return (
    <div className="space-y-6">
      {/* TARJETAS DE RESUMEN CONTABLE */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* INGRESOS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Ingresos Recaudados</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700 font-mono">
            {formatCurrency(totalIncome, currency)}
          </p>
          <span className="text-[11px] text-gray-400">Por citas atendidas y completadas</span>
        </div>

        {/* GASTOS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Gastos Registrados</span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600 font-mono">
            {formatCurrency(totalExpenses, currency)}
          </p>
          <span className="text-[11px] text-gray-400">Insumos, transportes y egresos</span>
        </div>

        {/* GANANCIA NETA */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Ganancia Neta Real</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-950 font-mono">
            {formatCurrency(netProfit, currency)}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">Ingresos libres tras descontar gastos</span>
        </div>
      </div>

      {/* ARQUEO POR MÉTODO DE PAGO */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <PieChart className="h-4 w-4 text-emerald-600" />
          <span>Arqueo por Método de Pago</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-500 font-medium block">💵 Efectivo</span>
            <span className="text-base font-bold text-gray-900 font-mono mt-1 block">
              {formatCurrency(incomeByMethod["EFECTIVO"] || 0, currency)}
            </span>
          </div>

          <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100">
            <span className="text-purple-700 font-bold block">📲 Nequi</span>
            <span className="text-base font-bold text-purple-950 font-mono mt-1 block">
              {formatCurrency(incomeByMethod["NEQUI"] || 0, currency)}
            </span>
          </div>

          <div className="p-3.5 bg-yellow-50/60 rounded-xl border border-yellow-200">
            <span className="text-yellow-800 font-bold block">🏦 Bancolombia</span>
            <span className="text-base font-bold text-yellow-950 font-mono mt-1 block">
              {formatCurrency(incomeByMethod["BANCOLOMBIA"] || 0, currency)}
            </span>
          </div>

          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-blue-700 font-bold block">💳 Tarjeta / Datáfono</span>
            <span className="text-base font-bold text-blue-950 font-mono mt-1 block">
              {formatCurrency(incomeByMethod["TARJETA"] || 0, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE GASTOS CON BOTÓN PARA REGISTRAR */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Control de Gastos y Egresos</h3>
            <p className="text-xs text-gray-500">
              Registra compras de esmaltes, productos, pasajes de domicilios o servicios
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Registrar Gasto</span>
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs">
            No hay gastos registrados aún. Pulsa "+ Registrar Gasto" para empezar tu control.
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3 text-right">Monto</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 text-gray-500">
                      {new Date(exp.date).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-gray-900">
                      {exp.description}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                      - {formatCurrency(exp.amount, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 transition"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL REGISTRAR NUEVO GASTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <h3 className="font-extrabold text-base text-gray-900 mb-1">
              Registrar Nuevo Gasto o Egreso
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Añade tus costos de insumos, transporte o productos para calcular la ganancia real.
            </p>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Descripción del gasto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Esmaltes semipermanentes y removedor"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Monto ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="25000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-rose-500 font-medium"
                  >
                    <option value="INSUMOS">💅 Insumos / Productos</option>
                    <option value="TRANSPORTE">🛵 Transporte / Domicilio</option>
                    <option value="ARRIENDO">🏢 Arriendo / Local</option>
                    <option value="SERVICIOS">💡 Servicios / Luz / Agua</option>
                    <option value="OTRO">📦 Otro Gasto</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {submitting ? "Guardando..." : "Guardar Gasto ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
