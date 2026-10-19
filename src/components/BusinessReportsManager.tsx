"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Truck,
  Users,
  Download,
  Printer,
  TrendingUp,
  CreditCard,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BusinessReportsManagerProps {
  business: any;
}

export default function BusinessReportsManager({ business }: BusinessReportsManagerProps) {
  const [preset, setPreset] = useState<"TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM">("THIS_MONTH");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Inicializar fechas por defecto
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;
    const startMonthStr = `${y}-${m}-01`;

    setStartDate(startMonthStr);
    setEndDate(todayStr);
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let url = `/api/reports?businessId=${business.id}&preset=${preset}`;
      if (preset === "CUSTOM" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setReportData(json);
      }
    } catch (err) {
      console.error("Error al cargar informe:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preset !== "CUSTOM" || (startDate && endDate)) {
      fetchReport();
    }
  }, [preset]);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setPreset("CUSTOM");
    fetchReport();
  };

  // Exportar a archivo CSV (compatible con Excel)
  const handleExportCSV = () => {
    if (!reportData || !reportData.appointments) return;

    const headers = ["Fecha", "Hora", "Cliente", "Telefono", "Servicio", "Modalidad", "Metodo de Pago", "Precio Servicio", "Recargo Domicilio", "Total"];
    const rows = reportData.appointments.map((a: any) => [
      a.date,
      a.time,
      `"${a.clientName.replace(/"/g, '""')}"`,
      `"${a.clientPhone}"`,
      `"${(a.serviceName || "").replace(/"/g, '""')}"`,
      a.type,
      a.paymentMethod || "EFECTIVO",
      a.price,
      a.homeFee,
      a.total,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Informe_${business.slug}_${reportData.range?.start}_al_${reportData.range?.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const metrics = reportData?.metrics;
  const curr = business.currency || "COP";

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">
              Ecosistema de Reportes & Métricas en Tiempo Real
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Consulta cuántos servicios has hecho en cualquier rango de fechas y genera tus informes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!reportData || reportData.appointments?.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition shadow-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Descargar Excel (CSV)</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 transition shadow-sm"
          >
            <Printer className="h-4 w-4 text-gray-300" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>
      </div>

      {/* SELECTOR DE RANGO DE FECHAS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setPreset("TODAY")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              preset === "TODAY" ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setPreset("THIS_WEEK")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              preset === "THIS_WEEK" ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setPreset("THIS_MONTH")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              preset === "THIS_MONTH" ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setPreset("CUSTOM")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              preset === "CUSTOM" ? "bg-purple-600 text-white shadow-sm" : "bg-gray-100 text-purple-700 hover:bg-purple-50"
            }`}
          >
            Rango Personalizado 📅
          </button>
        </div>

        {preset === "CUSTOM" && (
          <form onSubmit={handleApplyCustom} className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs text-gray-800"
            />
            <span className="text-xs text-gray-400">hasta</span>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs text-gray-800"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              Consultar
            </button>
          </form>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-gray-400 bg-white rounded-3xl border border-gray-200">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-emerald-600" />
          <span>Calculando métricas del período...</span>
        </div>
      ) : !reportData ? (
        <div className="p-12 text-center text-gray-400 bg-white rounded-3xl border border-gray-200">
          No hay datos disponibles para este rango.
        </div>
      ) : (
        <div className="space-y-6">
          {/* CABECERA PARA IMPRESIÓN */}
          <div className="hidden print:block border-b-2 border-gray-900 pb-4 mb-4">
            <h1 className="text-2xl font-black text-gray-900">{business.name}</h1>
            <p className="text-sm text-gray-600">Informe General de Servicios y Facturación</p>
            <p className="text-xs text-gray-500 mt-1">
              Período: {reportData.range?.start} al {reportData.range?.end}
            </p>
          </div>

          {/* TARJETAS DE MÉTRICAS CLAVE (KPIs) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* FACTURACIÓN BRUTA TOTAL */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-lg border border-emerald-500/30">
              <div className="flex items-center justify-between text-emerald-100 mb-1 text-xs font-bold">
                <span>Total Facturado</span>
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight">
                {formatCurrency(metrics?.grossRevenue || 0, curr)}
              </div>
              <p className="text-[11px] text-emerald-100/90 mt-1">
                Servicios + Domicilios + Tienda
              </p>
            </div>

            {/* TOTAL DE SERVICIOS REALIZADOS */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between text-gray-500 mb-1 text-xs font-bold">
                <span>Servicios Atendidos</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                {metrics?.totalServicesCompleted || 0}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                De {metrics?.totalAppointments || 0} citas agendadas
              </p>
            </div>

            {/* DOMICILIOS Y RECARGO */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between text-gray-500 mb-1 text-xs font-bold">
                <span>A Domicilio (Recargos)</span>
                <Truck className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-900">
                {formatCurrency(metrics?.homeFeesRevenue || 0, curr)}
              </div>
              <p className="text-[11px] text-purple-700 font-semibold mt-1">
                {metrics?.homeDeliveriesCount || 0} servicios a domicilio
              </p>
            </div>

            {/* CLIENTES ÚNICOS & CANCELACIONES */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between text-gray-500 mb-1 text-xs font-bold">
                <span>Clientes Atendidos</span>
                <Users className="h-4 w-4 text-rose-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                {metrics?.uniqueClientsCount || 0}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Cancelaciones: {metrics?.cancelledCount || 0} ({metrics?.cancellationRate || 0}%)
              </p>
            </div>
          </div>

          {/* DESGLOSE POR MÉTODO DE PAGO & TOP SERVICIOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DESGLOSE POR MÉTODO DE PAGO */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span>Ingresos por Medio de Pago</span>
              </h3>
              <div className="space-y-2.5">
                {Object.entries(reportData?.paymentMethodsBreakdown || {}).map(([method, amount]: [string, any]) => {
                  if (amount === 0) return null;
                  const pct = metrics?.grossRevenue > 0 ? Math.round((amount / metrics.grossRevenue) * 100) : 0;
                  return (
                    <div key={method} className="flex items-center justify-between text-xs p-2 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="font-bold text-gray-700">{method}</span>
                      <div className="text-right">
                        <span className="font-black text-gray-900">{formatCurrency(amount, curr)}</span>
                        <span className="text-[10px] text-gray-400 ml-2">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TOP SERVICIOS MÁS SOLICITADOS */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span>Ranking de Servicios Más Rentables</span>
              </h3>
              <div className="space-y-2">
                {(reportData?.topServices || []).slice(0, 5).map((srv: any, idx: number) => (
                  <div key={srv.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-purple-50/50 border border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-900 font-black text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-gray-800">{srv.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-purple-950">{formatCurrency(srv.revenue, curr)}</span>
                      <span className="text-[10px] text-purple-700 ml-1.5 font-bold">({srv.count} veces)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLA DETALLADA DE SERVICIOS REALIZADOS */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-gray-900">
                Detalle de Servicios Atendidos ({reportData.appointments?.length || 0})
              </h3>
              <span className="text-xs text-gray-400">
                {reportData.range?.start} a {reportData.range?.end}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-100">
                  <tr>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Servicio</th>
                    <th className="p-3">Modalidad</th>
                    <th className="p-3">Medio Pago</th>
                    <th className="p-3 text-right">Total Cobrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(reportData.appointments || []).map((app: any) => (
                    <tr key={app.id} className="hover:bg-gray-50/70 transition">
                      <td className="p-3 font-semibold text-gray-800">
                        {app.date} · {app.time}
                      </td>
                      <td className="p-3 font-bold text-gray-900">
                        {app.clientName}
                        <span className="block text-[10px] font-normal text-gray-400">{app.clientPhone}</span>
                      </td>
                      <td className="p-3 font-semibold text-gray-700">{app.serviceName}</td>
                      <td className="p-3">
                        {app.type === "DOMICILIO" ? (
                          <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                            🛵 Domicilio (+{formatCurrency(app.homeFee, curr)})
                          </span>
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                            En Local
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-gray-600">{app.paymentMethod || "Efectivo"}</td>
                      <td className="p-3 text-right font-black text-gray-900">
                        {formatCurrency(app.total, curr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
