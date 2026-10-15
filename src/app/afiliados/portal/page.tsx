"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  Users,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  LogOut,
  Building2,
  Calendar,
  MessageCircle,
  ExternalLink,
  Wallet,
  Clock,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PartnerPortalPage() {
  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [referredBusinesses, setReferredBusinesses] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [referralLink, setReferralLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  // Modal retiro
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("NEQUI");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/partners/me");
        if (!res.ok) {
          router.push("/afiliados");
          return;
        }
        const data = await res.json();
        setPartner(data.partner);
        setStats(data.stats);
        setReferredBusinesses(data.referredBusinesses || []);
        setCommissions(data.commissions || []);
        setPayouts(data.payouts || []);
        setReferralLink(data.referralLink);
        setPayoutMethod(data.partner?.payoutMethod || "NEQUI");
        setPayoutAccount(data.partner?.payoutAccount || data.partner?.phone || "");
      } catch (err) {
        console.error(err);
        router.push("/afiliados");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyScript = (key: string, scriptText: string) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(key);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) return;

    try {
      setSubmittingPayout(true);
      const res = await fetch("/api/partners/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(payoutAmount),
          payoutMethod,
          payoutAccount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo solicitar el retiro.");

      setPartner((prev: any) => ({ ...prev, balance: data.newBalance }));
      setPayouts([data.payout, ...payouts]);
      setPayoutSuccessMsg("¡Solicitud enviada con éxito! La revisaremos para transferirte.");
      setPayoutAmount("");
      setTimeout(() => {
        setShowPayoutModal(false);
        setPayoutSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || "Error al solicitar retiro.");
    } finally {
      setSubmittingPayout(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "turnoya_partner_id=; path=/; max-age=0";
    router.push("/afiliados");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-gray-500">Cargando tu portal de embajador...</p>
        </div>
      </div>
    );
  }

  if (!partner) return null;

  // Guiones de prospección pre-hechos
  const scriptBarberia = `¡Hola! 👋 Vi tu barbería y quería mostrarte cómo otros barberos están llenando su agenda 24/7 sin llamadas ni mensajes manuales: te permite agendar con un link y envía recordatorios automáticos por WhatsApp para eliminar clientes que no asisten. Puedes probarlo gratis aquí: ${referralLink}`;
  const scriptSpa = `Hola, un gusto saludarte ✨ ¿Sabías que más del 25% de citas en estéticas y spas se pierden por olvido del cliente? Con TurnoYa tus clientes agendan desde el móvil y reciben un aviso por WhatsApp 2 horas antes de la cita. Pruébalo sin costo aquí: ${referralLink}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* HEADER DEL PORTAL */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                Socio Embajador Oficial
              </span>
              <span className="text-xs font-semibold text-gray-500">
                Código: <strong className="text-gray-900 font-mono">{partner.referralCode}</strong>
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Panel de {partner.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Comisión recurrente activa: <strong>{partner.commissionRate * 100}% de por vida</strong> sobre cada cliente que mantengas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPayoutModal(true)}
              style={{ backgroundColor: "#059669", color: "#ffffff" }}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
            >
              <Wallet className="h-4 w-4" />
              Solicitar Retiro
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-gray-300 bg-white p-2.5 text-gray-600 hover:bg-gray-100 transition"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CAJA DEL ENLACE ÚNICO DE REFERIDO */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-gray-900 text-white p-6 sm:p-8 shadow-xl mb-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              Tu Enlace Único de Comisiones
            </span>
            <h2 className="mt-3 text-xl sm:text-2xl font-black">
              Comparte este enlace con barberías, estéticas y consultorios:
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 mb-5">
              Cualquier negocio que entre por tu link quedará enlazado a tu cuenta para siempre. Cuando paguen su plan, recibirás tu comisión mes a mes.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-xs sm:text-sm font-mono text-emerald-200 select-all truncate">
                {referralLink}
              </div>
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-bold text-gray-900 shadow-md hover:bg-gray-100 transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Enlace
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* TARJETAS DE RENDIMIENTO RESIDUAL */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* SALDO DISPONIBLE */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Saldo Disponible para Retirar
            </span>
            <p className="mt-2 text-3xl font-black text-emerald-600">
              {formatCOP(partner.balance)}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              Transferencia a tu {partner.payoutMethod}
            </p>
          </div>

          {/* TOTAL GANADO HISTÓRICO */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Ganado de por Vida
            </span>
            <p className="mt-2 text-3xl font-black text-gray-900">
              {formatCOP(partner.totalEarned)}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              Acumulado de todas tus comisiones
            </p>
          </div>

          {/* NEGOCIOS ACTIVOS */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Clientes que te pagan mes a mes
            </span>
            <p className="mt-2 text-3xl font-black text-gray-900">
              {stats?.clientesProActivos || 0}
            </p>
            <p className="mt-1 text-[11px] text-emerald-600 font-medium">
              de {stats?.totalClientes || 0} negocios registrados
            </p>
          </div>

          {/* SUELDO MENSUAL ESTIMADO (MRR) */}
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-5 shadow-sm">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Tu Sueldo Mensual Estimado
            </span>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {formatCOP((stats?.clientesProActivos || 0) * 18000)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-800 font-medium">
              ingreso pasivo que recibes cada mes
            </p>
          </div>
        </div>

        {/* KITS DE PROSPECCIÓN WHATSAPP LISTOS PARA ENVIAR */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
                Guiones de WhatsApp Listos para Vender
              </h3>
              <p className="text-xs text-gray-500">
                Copia estos mensajes probados y envíaselos a dueños de negocios en tu ciudad
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4 border border-gray-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-gray-900">💈 Para Barberías & Peluquerías</span>
                <p className="text-xs text-gray-600 mt-2 font-mono bg-white p-3 rounded-lg border border-gray-200/80 leading-relaxed">
                  {scriptBarberia}
                </p>
              </div>
              <button
                onClick={() => handleCopyScript("barberia", scriptBarberia)}
                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-300 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
              >
                {copiedScript === "barberia" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedScript === "barberia" ? "¡Mensaje Copiado!" : "Copiar Guion Barbería"}
              </button>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 border border-gray-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-gray-900">💅 Para Spas, Uñas & Estéticas</span>
                <p className="text-xs text-gray-600 mt-2 font-mono bg-white p-3 rounded-lg border border-gray-200/80 leading-relaxed">
                  {scriptSpa}
                </p>
              </div>
              <button
                onClick={() => handleCopyScript("spa", scriptSpa)}
                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-300 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
              >
                {copiedScript === "spa" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedScript === "spa" ? "¡Mensaje Copiado!" : "Copiar Guion Estética"}
              </button>
            </div>
          </div>
        </div>

        {/* TABLAS DE NEGOCIOS Y COMISIONES */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* NEGOCIOS REFERIDOS */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Tus Negocios Vinculados ({referredBusinesses.length})
            </h3>

            {referredBusinesses.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Aún no tienes clientes registrados con tu enlace. Comparte tu link en redes o WhatsApp para empezar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Negocio</th>
                      <th className="py-2.5 px-3">Plan</th>
                      <th className="py-2.5 px-3">Citas</th>
                      <th className="py-2.5 px-3 text-right">Comisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {referredBusinesses.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          {b.name}
                          <span className="block text-[10px] text-gray-400">
                            {b.phone || "Sin teléfono"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              b.plan === "PRO"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {b.plan}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-600">
                          {b._count?.appointments || 0} citas
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          {b.plan === "PRO"
                            ? `${partner?.commissionRate ? Math.round(partner.commissionRate * 100) : 20}% recurrente`
                            : "En prueba"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* HISTORIAL DE COMISIONES GANADAS */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Historial de Comisiones Cobradas ({commissions.length})
            </h3>

            {commissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Cada vez que tus clientes paguen su mensualidad, aquí verás registrada tu comisión en tiempo real.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Concepto</th>
                      <th className="py-2.5 px-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commissions.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString("es-ES")}
                        </td>
                        <td className="py-2.5 px-3 text-gray-900 font-medium truncate max-w-[200px]">
                          {c.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                          +{formatCOP(c.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* MODAL SOLICITUD DE RETIRO */}
        {showPayoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900">Solicitar Retiro de Saldo</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Saldo disponible: <strong>{formatCOP(partner.balance)}</strong>
              </p>

              {payoutSuccessMsg && (
                <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                  {payoutSuccessMsg}
                </div>
              )}

              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Monto a retirar ($ COP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="10000"
                    max={partner.balance}
                    placeholder="Monto a retirar"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Medio de Pago
                    </label>
                    <select
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="NEQUI">Nequi</option>
                      <option value="DAVIPLATA">Daviplata</option>
                      <option value="BANCOLOMBIA">Bancolombia</option>
                      <option value="PAYPAL">PayPal</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Número / Celular
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutAccount}
                      onChange={(e) => setPayoutAccount(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayout || partner.balance <= 0}
                    style={{ backgroundColor: "#059669", color: "#ffffff" }}
                    className="rounded-xl px-5 py-2 text-xs font-bold shadow hover:bg-emerald-500 transition disabled:opacity-50"
                  >
                    {submittingPayout ? "Procesando..." : "Confirmar Retiro"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
