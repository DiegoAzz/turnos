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
  status: string;
  createdAt: string;
  totalReferred: number;
  activePayingClients: number;
  pendingPayoutRequests: any[];
}

export default function AdminPartnersManager() {
  const [partners, setPartners] = useState<PartnerAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<PartnerAdmin | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal simulación
  const [simulateAmount, setSimulateAmount] = useState(60000);
  const [simulateSuccess, setSimulateSuccess] = useState<any | null>(null);

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

  // Simular renovación mensual de un cliente para acreditar comisión al embajador
  const handleSimulateCommission = async (partner: PartnerAdmin) => {
    const businessName = prompt(
      `Simular renovación mensual de un cliente para ${partner.name}.\n\nIngresa el nombre de la barbería o negocio:`,
      "Barbería de Prueba"
    );
    if (!businessName) return;

    try {
      setActionLoading(partner.id);
      // Primero verificar si tiene un negocio o creamos uno de prueba
      const res = await fetch("/api/admin/partners/simulate-commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: partner.id, // o id de negocio
          amount: simulateAmount,
          planName: `Plan PRO Mensual (${businessName})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Si no tiene negocio formal, acreditamos directamente a la billetera
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
    const ref = prompt("Ingresa el número de comprobante o referencia de transferencia (Nequi/Banco):", "TRX-" + Math.floor(100000 + Math.random() * 900000));
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

  const totalPartners = partners.length;
  const totalBalancePendiente = partners.reduce((sum, p) => sum + p.balance, 0);
  const totalHistoricoGanado = partners.reduce((sum, p) => sum + p.totalEarned, 0);
  const totalNegociosTraidos = partners.reduce((sum, p) => sum + p.totalReferred, 0);

  return (
    <div className="space-y-6">
      {/* METRICAS DE LA RED DE EMBAJADORES */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Embajadores Activos
          </span>
          <p className="mt-2 text-3xl font-black text-white">{totalPartners}</p>
          <span className="text-[11px] text-emerald-400">Promotores registrados</span>
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

      {/* BANNER INFORMATIVO */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Modelo de Ingreso Residual Recurrente (30% Vitalicio)
          </h4>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Cada vez que una barbería o consultorio renueva su suscripción ($60.000 COP / $19 USD), el embajador que lo trajo recibe automáticamente el 30% ($18.000 COP / $5.70 USD) directo a su billetera. ¡Si el cliente paga 5 años, el embajador cobra esos 5 años!
          </p>
        </div>

        <a
          href="/afiliados"
          target="_blank"
          className="whitespace-nowrap rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
        >
          <span>Ver Landing de Afiliados</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* TABLA DE EMBAJADORES */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">Red de Embajadores Registrados</h3>
            <p className="text-xs text-slate-400">
              Control de códigos de referido, clientes activos y saldos acumulados
            </p>
          </div>
          <button
            onClick={loadPartners}
            className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg"
          >
            Actualizar Lista
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Cargando embajadores...</div>
        ) : partners.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Aún no hay embajadores registrados. Puedes registrar el primero en{" "}
            <a href="/afiliados" target="_blank" className="text-emerald-400 underline font-bold">
              turnos.appzplay.online/afiliados
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Embajador</th>
                  <th className="py-3 px-4">Código Referido</th>
                  <th className="py-3 px-4">Comisión</th>
                  <th className="py-3 px-4">Clientes Traídos</th>
                  <th className="py-3 px-4">Saldo Disponible</th>
                  <th className="py-3 px-4">Total Ganado</th>
                  <th className="py-3 px-4">Medio de Retiro</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {partners.map((p) => {
                  const cleanPhone = p.phone.replace(/[^0-9]/g, "");
                  const whatsappUrl = `https://wa.me/${cleanPhone}`;

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {p.name}
                        <span className="block text-[11px] font-normal text-slate-400">
                          {p.phone}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {p.referralCode}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        {Math.round(p.commissionRate * 100)}% vitalicio
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white">{p.totalReferred}</span>
                        <span className="text-[10px] text-emerald-400 block font-medium">
                          ({p.activePayingClients} activos PRO)
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

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {/* Botón WhatsApp */}
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-500/30"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Botón simular pago recurrente */}
                        <button
                          onClick={() => handleSimulateCommission(p)}
                          disabled={actionLoading === p.id}
                          className="inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2.5 py-1.5 rounded-lg border border-amber-500/30"
                          title="Simular renovación mensual del cliente y acreditar 30%"
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span>+ Pagar Comisión</span>
                        </button>
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
          Cuando un embajador solicita cobrar su saldo, te aparecerá aquí para que le transfieras a su Nequi o cuenta bancaria.
        </p>

        {partners.every((p) => (p.pendingPayoutRequests || []).length === 0) ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
            No hay solicitudes de retiro pendientes en este momento.
          </div>
        ) : (
          <div className="space-y-3">
            {partners.flatMap((p) =>
              (p.pendingPayoutRequests || []).map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{p.name}</span>
                      <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                        Pendiente
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Monto: <strong className="text-emerald-400 text-sm">{formatCOP(req.amount)}</strong> a través de{" "}
                      <strong>{req.payoutMethod}</strong> ({req.payoutAccount})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprovePayout(req.id)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 shadow transition flex items-center gap-1.5"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Marcar Transferido
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL / AVISO DE ÉXITO DE SIMULACIÓN */}
      {simulateSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4">
              <CheckCircle className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold">¡Comisión Acreditada!</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {simulateSuccess.message}
            </p>

            {simulateSuccess.whatsappAlert && (
              <div className="mt-4">
                <a
                  href={simulateSuccess.whatsappAlert}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 flex items-center justify-center gap-2 shadow"
                >
                  <MessageCircle className="h-4 w-4" />
                  Avisar al Embajador por WhatsApp
                </a>
              </div>
            )}

            <button
              onClick={() => setSimulateSuccess(null)}
              className="w-full mt-3 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
