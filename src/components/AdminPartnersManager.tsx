"use client";

import { useEffect, useState } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  Sparkles,
  CheckCircle,
  Clock,
  MessageCircle,
  Copy,
  Check,
  Send,
  Wallet,
  Play,
  ArrowRight,
  ShieldAlert,
  Settings2,
  Edit2,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
} from "lucide-react";

interface PartnerAdmin {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  commissionRate: number;
  balance: number;
  totalEarned: number;
  payoutMethod: string;
  payoutAccount: string | null;
  experience?: string | null;
  status: string;
  approvedAt?: string | null;
  createdAt: string;
  totalReferred: number;
  activePayingClients: number;
  pendingPayoutRequests: any[];
}

export default function AdminPartnersManager() {
  const [partners, setPartners] = useState<PartnerAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACTIVE">("ALL");

  // Modal simulación
  const [simulateAmount, setSimulateAmount] = useState(60000);
  const [simulateSuccess, setSimulateSuccess] = useState<any | null>(null);
  const [globalRateInput, setGlobalRateInput] = useState("20");

  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/partners");
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
      }
    } catch (err) {
      console.error("Error al cargar embajadores:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  // Aprobar un embajador pendiente
  const handleApprovePartner = async (partner: PartnerAdmin) => {
    const confirmApprove = confirm(
      `¿Deseas APROBAR a "${partner.name}" como Embajador Oficial?\n\nWhatsApp: ${partner.phone}\nObservaciones: ${partner.experience || "Sin perfil especificado"}`
    );
    if (!confirmApprove) return;

    try {
      setActionLoading(partner.id);
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: partner.id,
          status: "ACTIVE",
        }),
      });

      if (res.ok) {
        const cleanPhone = partner.phone.replace(/[^0-9]/g, "");
        const approvalMsg = encodeURIComponent(
          `¡Hola ${partner.name}! 👋 Te informamos que tu postulación como Embajador Oficial de TurnoYa ha sido APROBADA con éxito 🎉.\n\n` +
          `🔑 Tu código de referido oficial es: ${partner.referralCode}\n` +
          `📈 Comisión asignada: ${Math.round(partner.commissionRate * 100)}% recurrente vitalicio.\n` +
          `🌐 Ya puedes ingresar a tu portal en https://turnos.appzplay.online/afiliados con tu WhatsApp para obtener tu enlace único y comenzar a registrar negocios.`
        );
        const notifyWA = confirm("¡Embajador Aprobado! ¿Deseas abrir WhatsApp para enviarle el mensaje de bienvenida con su código de referido ahora?");
        if (notifyWA) {
          window.open(`https://wa.me/${cleanPhone}?text=${approvalMsg}`, "_blank");
        }
        await loadPartners();
      } else {
        alert("No se pudo aprobar el embajador.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al aprobar embajador.");
    } finally {
      setActionLoading(null);
    }
  };

  // Rechazar postulación
  const handleRejectPartner = async (partner: PartnerAdmin) => {
    const confirmReject = confirm(
      `¿Deseas RECHAZAR la postulación de "${partner.name}"?`
    );
    if (!confirmReject) return;

    try {
      setActionLoading(partner.id);
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: partner.id,
          status: "REJECTED",
        }),
      });

      if (res.ok) {
        alert("Postulación rechazada.");
        await loadPartners();
      }
    } catch (err) {
      console.error(err);
      alert("Error al rechazar embajador.");
    } finally {
      setActionLoading(null);
    }
  };

  // Editar porcentaje de un embajador individual
  const handleEditCommissionRate = async (partner: PartnerAdmin) => {
    const currentPct = Math.round(partner.commissionRate * 100);
    const input = prompt(
      `Personalizar porcentaje de comisión para "${partner.name}":\n\nIngresa el porcentaje deseado (ej: 15 para 15%, 25 para 25%, 40 para 40%):`,
      String(currentPct)
    );
    if (input === null) return;

    const newRateNum = parseFloat(input);
    if (isNaN(newRateNum) || newRateNum < 0 || newRateNum > 100) {
      alert("Por favor ingresa un número válido entre 0 y 100.");
      return;
    }

    try {
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: partner.id,
          commissionRate: newRateNum / 100,
        }),
      });

      if (res.ok) {
        alert(`¡Comisión de ${partner.name} actualizada a ${newRateNum}% con éxito!`);
        await loadPartners();
      }
    } catch (err) {
      console.error(err);
      alert("Error al actualizar comisión.");
    }
  };

  // Guardar y aplicar porcentaje global a todos los embajadores
  const handleApplyGlobalRate = async () => {
    const rateNum = parseFloat(globalRateInput);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      alert("Por favor ingresa un porcentaje válido entre 0 y 100.");
      return;
    }

    const confirmApply = confirm(
      `¿Deseas fijar la comisión al ${rateNum}% para TODOS los embajadores registrados y nuevos?`
    );
    if (!confirmApply) return;

    try {
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateAll: true,
          commissionRate: rateNum / 100,
        }),
      });

      if (res.ok) {
        alert(`¡Comisión global fijada al ${rateNum}% con éxito!`);
        await loadPartners();
      }
    } catch (err) {
      console.error(err);
      alert("Error al aplicar comisión global.");
    }
  };

  // Simular renovación mensual de un cliente para acreditar comisión al embajador
  const handleSimulateCommission = async (partner: PartnerAdmin) => {
    const businessName = prompt(
      `Simular renovación mensual de un cliente para ${partner.name}.\n\nIngresa el nombre de la barbería o negocio:`,
      "Barbería de Prueba"
    );
    if (!businessName) return;

    try {
      setActionLoading(partner.id);
      const res = await fetch("/api/admin/partners/simulate-commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: partner.id,
          amount: simulateAmount,
          planName: `Plan PRO Mensual (${businessName})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo simular la comisión.");
        return;
      }

      setSimulateSuccess(data);
      await loadPartners();
    } catch (err) {
      console.error(err);
      alert("Error al simular comisión.");
    } finally {
      setActionLoading(null);
    }
  };

  // Aprobar pago de retiro
  const handleApprovePayout = async (payoutId: string) => {
    const ref = prompt(
      "Ingresa el número de comprobante o referencia de transferencia (Nequi/Banco):",
      "TRX-" + Math.floor(100000 + Math.random() * 900000)
    );
    if (!ref) return;

    try {
      const res = await fetch(`/api/admin/partners/payouts/${payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE", reference: ref }),
      });

      if (res.ok) {
        alert("¡Retiro marcado como PAGADO con éxito!");
        await loadPartners();
      }
    } catch (err) {
      console.error(err);
      alert("Error al procesar pago.");
    }
  };

  const pendingPartnersCount = partners.filter((p) => p.status === "PENDING").length;
  const activePartnersCount = partners.filter((p) => p.status === "ACTIVE").length;
  const totalPartners = partners.length;
  const totalBalancePendiente = partners.reduce((sum, p) => sum + p.balance, 0);
  const totalHistoricoGanado = partners.reduce((sum, p) => sum + p.totalEarned, 0);
  const totalNegociosTraidos = partners.reduce((sum, p) => sum + p.totalReferred, 0);

  const displayedPartners = partners.filter((p) => {
    if (statusFilter === "PENDING") return p.status === "PENDING";
    if (statusFilter === "ACTIVE") return p.status === "ACTIVE";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* METRICAS DE LA RED DE EMBAJADORES */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Embajadores Activos
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-black text-white">{activePartnersCount}</p>
            {pendingPartnersCount > 0 && (
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] px-2 py-0.5 font-bold">
                +{pendingPartnersCount} por validar
              </span>
            )}
          </div>
          <span className="text-[11px] text-emerald-400">Promotores validados</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Clientes Traídos por la Red
          </span>
          <p className="mt-2 text-3xl font-black text-emerald-400">{totalNegociosTraidos}</p>
          <span className="text-[11px] text-slate-400">Barberías, spas y consultorios</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Saldo Pendiente por Liquidar
          </span>
          <p className="mt-2 text-3xl font-black text-amber-400">
            {formatCOP(totalBalancePendiente)}
          </p>
          <span className="text-[11px] text-slate-400">Por transferir a sus Nequi/Bancos</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Total Comisiones Pagadas
          </span>
          <p className="mt-2 text-3xl font-black text-white">
            {formatCOP(totalHistoricoGanado)}
          </p>
          <span className="text-[11px] text-emerald-400">Repartido de por vida</span>
        </div>
      </div>

      {/* BANNER INFORMATIVO & CONFIGURADOR GLOBAL */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Banner explicativo */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/20 p-5 flex flex-col justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Modelo de Ingreso Residual Recurrente (100% Personalizable)
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Cada vez que una barbería o negocio renueva su suscripción ($60.000 COP / $19 USD), el embajador recibe automáticamente su porcentaje asignado directo a su billetera. Las postulaciones nuevas entran en revisión para que puedas validar su perfil antes de activarlos.
            </p>
          </div>

          <div>
            <a
              href="/afiliados"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 shadow-md shadow-emerald-600/20 transition"
            >
              <span>Ver Formulario de Afiliados</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Tarjeta de configuración de comisión global */}
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="h-4 w-4" />
              Comisión Global
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Fija el porcentaje predeterminado y aplícalo a todos los embajadores:
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                max="100"
                value={globalRateInput}
                onChange={(e) => setGlobalRateInput(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white font-bold pr-8 focus:border-emerald-500 focus:outline-none"
                placeholder="20"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
            </div>
            <button
              onClick={handleApplyGlobalRate}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2.5 transition whitespace-nowrap shadow-sm"
            >
              Fijar a Todos
            </button>
          </div>
        </div>
      </div>

      {/* TABLA DE EMBAJADORES Y POSTULACIONES */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-white">Red de Embajadores & Postulaciones</h3>
            <p className="text-xs text-slate-400">
              Valida perfiles antes de activarlos, ajusta comisiones y monitorea rendimientos
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtros de estado */}
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === "ALL"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Todos ({partners.length})
              </button>
              <button
                onClick={() => setStatusFilter("PENDING")}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  statusFilter === "PENDING"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-amber-400 hover:text-amber-300"
                }`}
              >
                <span>🟡 Pendientes</span>
                {pendingPartnersCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                    {pendingPartnersCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === "ACTIVE"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🟢 Activos ({activePartnersCount})
              </button>
            </div>

            <button
              onClick={loadPartners}
              className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg"
            >
              Actualizar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Cargando embajadores...</div>
        ) : displayedPartners.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No hay registros con el filtro seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Postulante / Embajador</th>
                  <th className="py-3 px-4">Código Referido</th>
                  <th className="py-3 px-4">Comisión</th>
                  <th className="py-3 px-4">Clientes</th>
                  <th className="py-3 px-4">Saldo Disp.</th>
                  <th className="py-3 px-4">Total Ganado</th>
                  <th className="py-3 px-4">Medio Pago</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedPartners.map((p) => {
                  const cleanPhone = p.phone.replace(/[^0-9]/g, "");
                  const whatsappInterviewUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `¡Hola ${p.name}! 👋 Te escribo desde TurnoYa respecto a tu solicitud para ser Embajador Oficial. Nos gustaría conocer más sobre tu propuesta.`
                  )}`;

                  const isPending = p.status === "PENDING";
                  const isRejected = p.status === "REJECTED";

                  return (
                    <tr
                      key={p.id}
                      className={`transition ${
                        isPending
                          ? "bg-amber-950/20 hover:bg-amber-950/30"
                          : "hover:bg-slate-900/40"
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-white max-w-xs">
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          {isPending ? (
                            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] px-2 py-0.5 font-bold">
                              🟡 Por Validar
                            </span>
                          ) : isRejected ? (
                            <span className="rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] px-2 py-0.5 font-bold">
                              🔴 Rechazado
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.5 font-bold">
                              🟢 Activo
                            </span>
                          )}
                        </div>

                        <span className="block text-[11px] font-normal text-slate-400 mt-0.5">
                          {p.phone} • {p.email}
                        </span>

                        {/* PERFIL COMERCIAL / OBSERVACIONES CARGADAS POR EL POSTULANTE */}
                        {p.experience && (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/70 text-[11px] text-slate-200">
                            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1 mb-1">
                              <FileText className="h-3 w-3" />
                              Perfil / Observaciones del Postulante:
                            </span>
                            <p className="leading-snug italic font-normal text-slate-300">
                              &ldquo;{p.experience}&rdquo;
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {p.referralCode}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        <button
                          onClick={() => handleEditCommissionRate(p)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold transition group"
                          title="Click para cambiar el porcentaje de comisión de este embajador"
                        >
                          <span>{Math.round(p.commissionRate * 100)}% vitalicio</span>
                          <Edit2 className="h-3 w-3 text-slate-400 group-hover:text-emerald-300 transition" />
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white">{p.totalReferred}</span>
                        <span className="text-[10px] text-emerald-400 block font-medium">
                          ({p.activePayingClients} PRO)
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-emerald-400">
                        {formatCOP(p.balance)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-300">
                        {formatCOP(p.totalEarned)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="font-bold text-white">{p.payoutMethod}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {p.payoutAccount || p.phone}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        {/* ACCIONES DEPENDIENDO DEL ESTADO */}
                        {isPending ? (
                          <>
                            {/* BOTÓN APROBAR */}
                            <button
                              onClick={() => handleApprovePartner(p)}
                              disabled={actionLoading === p.id}
                              className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                              title="Aprobar embajador y generar mensaje de WhatsApp"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Aprobar</span>
                            </button>

                            {/* BOTÓN RECHAZAR */}
                            <button
                              onClick={() => handleRejectPartner(p)}
                              disabled={actionLoading === p.id}
                              className="inline-flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 rounded-lg transition"
                              title="Rechazar postulación"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Rechazar</span>
                            </button>

                            {/* CONTACTAR WHATSAPP ANTES DE APROBAR */}
                            <a
                              href={whatsappInterviewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-500/30"
                              title="Escribir por WhatsApp para entrevistarlo"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>Entrevistar</span>
                            </a>
                          </>
                        ) : (
                          <>
                            {/* BOTÓN WHATSAPP */}
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-500/30"
                              title="Contactar por WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </a>

                            {/* BOTÓN SIMULAR PAGO RECURRENTE */}
                            <button
                              onClick={() => handleSimulateCommission(p)}
                              disabled={actionLoading === p.id}
                              className="inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2.5 py-1.5 rounded-lg border border-amber-500/30"
                              title={`Simular renovación mensual del cliente y acreditar ${Math.round(p.commissionRate * 100)}%`}
                            >
                              <Play className="h-3.5 w-3.5" />
                              <span>+ Pagar Comisión</span>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SOLICITUDES DE RETIRO PENDIENTES */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-xl">
        <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-amber-400" />
          Solicitudes de Retiro de Fondos
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Cuando un embajador solicita cobrar su saldo acumulado, te aparecerá aquí para que le transfieras a su Nequi o cuenta bancaria.
        </p>

        {partners.every((p) => (p.pendingPayoutRequests || []).length === 0) ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
            No hay solicitudes de retiro pendientes en este momento.
          </div>
        ) : (
          <div className="space-y-3">
            {partners
              .flatMap((p) =>
                (p.pendingPayoutRequests || []).map((req) => ({
                  ...req,
                  partnerName: p.name,
                  partnerPhone: p.phone,
                  partnerReferralCode: p.referralCode,
                }))
              )
              .map((req) => {
                const cleanPhone = req.partnerPhone.replace(/[^0-9]/g, "");
                return (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {req.partnerName} ({req.partnerReferralCode})
                        </span>
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          {req.payoutMethod}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Cuenta / Celular: <strong className="text-white font-mono">{req.payoutAccount}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Solicitado el {new Date(req.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block uppercase font-semibold">
                          Monto a Transferir
                        </span>
                        <span className="text-lg font-black text-amber-400">
                          {formatCOP(req.amount)}
                        </span>
                      </div>

                      <a
                        href={`https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(req.partnerName)},%20recibimos%20tu%20solicitud%20de%20retiro%20por%20${encodeURIComponent(formatCOP(req.amount))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-slate-300 hover:text-white transition"
                        title="Avisar por WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>

                      <button
                        onClick={() => handleApprovePayout(req.id)}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="h-4 w-4" />
                        <span>Confirmar Transferencia Realizada</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* MODAL / AVISO DE COMISIÓN SIMULADA CON ÉXITO */}
      {simulateSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">¡Comisión Acreditada!</h4>
                <p className="text-xs text-emerald-400">Billetera del embajador actualizada</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 mb-6">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Embajador:</span>
                <span className="font-bold text-white">{simulateSuccess.partnerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Pago suscripción mensual:</span>
                <span className="font-bold text-white">{formatCOP(simulateSuccess.subscriptionAmount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Comisión ganada:</span>
                <span className="font-bold text-emerald-400 text-sm">+{formatCOP(simulateSuccess.commissionEarned)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Nuevo saldo disponible:</span>
                <span className="font-bold text-amber-400 text-sm">{formatCOP(simulateSuccess.newBalance)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={simulateSuccess.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 shadow-md shadow-emerald-600/25 transition"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Enviar Notificación por WhatsApp al Embajador</span>
              </a>

              <button
                onClick={() => setSimulateSuccess(null)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs py-2.5 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
