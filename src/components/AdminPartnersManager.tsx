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
  Trash2,
  X,
  Crown,
  Building2,
} from "lucide-react";

interface PartnerAdmin {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  firstMonthCommissionRate?: number;
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
  // Campos Franquicia SaaS
  isFranchise?: boolean;
  franchiseName?: string | null;
  franchiseCityCountry?: string | null;
  franchiseEntryFee?: number;
  franchiseEntryFeePaid?: boolean;
  franchiseMonthlyFee?: number;
  franchiseFeeCurrency?: string;
  franchiseStatus?: string;
  franchiseDueDate?: string | null;
  franchiseNotes?: string | null;
}

export default function AdminPartnersManager() {
  const [partners, setPartners] = useState<PartnerAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACTIVE" | "FRANCHISE">("ALL");

  // Configuración de comisiones globales (2 niveles)
  const [globalFirstMonthRateInput, setGlobalFirstMonthRateInput] = useState("50");
  const [globalRecurringRateInput, setGlobalRecurringRateInput] = useState("20");

  // Modal para personalizar comisiones de un embajador individual
  const [editingPartnerRates, setEditingPartnerRates] = useState<PartnerAdmin | null>(null);
  const [partnerFirstMonthInput, setPartnerFirstMonthInput] = useState("50");
  const [partnerRecurringInput, setPartnerRecurringInput] = useState("20");

  // Modal para administrar Franquicia SaaS (Inscripción + Mensualidad)
  const [editingFranchisePartner, setEditingFranchisePartner] = useState<PartnerAdmin | null>(null);
  const [franchiseEnabled, setFranchiseEnabled] = useState(false);
  const [franchiseName, setFranchiseName] = useState("");
  const [franchiseCityCountry, setFranchiseCityCountry] = useState("");
  const [franchiseEntryFee, setFranchiseEntryFee] = useState("99");
  const [franchiseEntryFeePaid, setFranchiseEntryFeePaid] = useState(false);
  const [franchiseMonthlyFee, setFranchiseMonthlyFee] = useState("29");
  const [franchiseFeeCurrency, setFranchiseFeeCurrency] = useState("USD");
  const [franchiseStatus, setFranchiseStatus] = useState("ACTIVE");
  const [franchiseNotes, setFranchiseNotes] = useState("");

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
        if (data.globalFirstMonthRate !== undefined) {
          setGlobalFirstMonthRateInput(String(Math.round(data.globalFirstMonthRate * 100)));
        }
        if (data.globalRecurringRate !== undefined) {
          setGlobalRecurringRateInput(String(Math.round(data.globalRecurringRate * 100)));
        }
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
        const firstMonthPct = Math.round((partner.firstMonthCommissionRate ?? 0.50) * 100);
        const recurringPct = Math.round(partner.commissionRate * 100);

        // Mensaje limpio con formato nativo de WhatsApp (sin caracteres que causen símbolos de rombo ?)
        const approvalMsg = encodeURIComponent(
          `¡Hola ${partner.name}! Te informamos que tu postulación como Embajador Oficial de TurnoYa ha sido *APROBADA con éxito*.\n\n` +
          `✓ *Código de referido oficial:* ${partner.referralCode}\n` +
          `✓ *Bono 1er Mes (Captación):* ${firstMonthPct}%\n` +
          `✓ *Comisión Recurrente Vitalicia:* ${recurringPct}% mensual por cada cliente activo\n\n` +
          `➜ *Ingresa a tu portal aquí:* https://turnos.appzplay.online/afiliados\n` +
          `Accede con tu número de WhatsApp para obtener tu enlace único y comenzar a registrar negocios.`
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

  // Eliminar permanentemente de la base de datos
  const handleDeletePartner = async (partner: PartnerAdmin) => {
    const confirmDelete = confirm(
      `¿Estás seguro de ELIMINAR PERMANENTEMENTE a "${partner.name}"?\n\nEsta acción borrará al embajador de la base de datos por completo y liberará su correo (${partner.email}) y código (${partner.referralCode}).`
    );
    if (!confirmDelete) return;

    try {
      setActionLoading(partner.id);
      const res = await fetch(`/api/admin/partners?id=${partner.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        alert("¡Embajador eliminado de la base de datos con éxito!");
        await loadPartners();
      } else {
        alert(data.error || "No se pudo eliminar al embajador.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al eliminar al embajador.");
    } finally {
      setActionLoading(null);
    }
  };

  // Abrir modal de edición de porcentajes de un embajador
  const handleOpenRateEditModal = (p: PartnerAdmin) => {
    setEditingPartnerRates(p);
    setPartnerFirstMonthInput(String(Math.round((p.firstMonthCommissionRate ?? 0.50) * 100)));
    setPartnerRecurringInput(String(Math.round(p.commissionRate * 100)));
  };

  // Guardar porcentajes individuales de un embajador
  const handleSavePartnerRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartnerRates) return;

    const firstMonthNum = parseFloat(partnerFirstMonthInput);
    const recurringNum = parseFloat(partnerRecurringInput);

    if (
      isNaN(firstMonthNum) ||
      firstMonthNum < 0 ||
      firstMonthNum > 100 ||
      isNaN(recurringNum) ||
      recurringNum < 0 ||
      recurringNum > 100
    ) {
      alert("Por favor ingresa porcentajes válidos entre 0 y 100.");
      return;
    }

    try {
      setActionLoading(editingPartnerRates.id);
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: editingPartnerRates.id,
          firstMonthCommissionRate: firstMonthNum / 100,
          commissionRate: recurringNum / 100,
        }),
      });

      if (res.ok) {
        alert(`¡Comisiones de ${editingPartnerRates.name} actualizadas con éxito!\n🔥 1er Mes: ${firstMonthNum}%\n🔄 Meses 2+: ${recurringNum}%`);
        setEditingPartnerRates(null);
        await loadPartners();
      } else {
        alert("No se pudo actualizar la comisión.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar porcentajes.");
    } finally {
      setActionLoading(null);
    }
  };

  // Abrir modal de Franquicia SaaS (Inscripción + Mensualidad)
  const handleOpenFranchiseModal = (p: PartnerAdmin) => {
    setEditingFranchisePartner(p);
    setFranchiseEnabled(Boolean(p.isFranchise));
    setFranchiseName(p.franchiseName || `Franquicia ${p.name}`);
    setFranchiseCityCountry(p.franchiseCityCountry || "");
    setFranchiseEntryFee(String(p.franchiseEntryFee ?? 99));
    setFranchiseEntryFeePaid(Boolean(p.franchiseEntryFeePaid));
    setFranchiseMonthlyFee(String(p.franchiseMonthlyFee ?? 29));
    setFranchiseFeeCurrency(p.franchiseFeeCurrency || "USD");
    setFranchiseStatus(p.franchiseStatus || "ACTIVE");
    setFranchiseNotes(p.franchiseNotes || "");
  };

  // Guardar configuración de Franquicia
  const handleSaveFranchise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFranchisePartner) return;

    try {
      setActionLoading(editingFranchisePartner.id);
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: editingFranchisePartner.id,
          isFranchise: franchiseEnabled,
          franchiseName: franchiseName.trim() || null,
          franchiseCityCountry: franchiseCityCountry.trim() || null,
          franchiseEntryFee: parseFloat(franchiseEntryFee) || 0,
          franchiseEntryFeePaid,
          franchiseMonthlyFee: parseFloat(franchiseMonthlyFee) || 0,
          franchiseFeeCurrency,
          franchiseStatus,
          franchiseNotes: franchiseNotes.trim() || null,
        }),
      });

      if (res.ok) {
        alert(`¡Configuración de Franquicia de "${editingFranchisePartner.name}" actualizada con éxito!`);
        setEditingFranchisePartner(null);
        await loadPartners();
      } else {
        alert("No se pudo guardar la franquicia.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar franquicia.");
    } finally {
      setActionLoading(null);
    }
  };

  // Registrar pago de mensualidad de franquicia (+30 días de vigencia)
  const handleRegisterFranchiseMonthlyPayment = async (p: PartnerAdmin) => {
    const feeStr = `${p.franchiseMonthlyFee || 29} ${p.franchiseFeeCurrency || "USD"}`;
    const confirmPay = confirm(
      `¿Confirmas haber recibido el pago de mensualidad (${feeStr}) de "${p.name}" (${p.franchiseName || "Franquicia"})?\n\nEsto extenderá la fecha de corte por 30 días adicionales y marcará su franquicia como AL DÍA.`
    );
    if (!confirmPay) return;

    try {
      setActionLoading(p.id);
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: p.id,
          registerMonthlyPayment: true,
        }),
      });

      if (res.ok) {
        alert("¡Mensualidad registrada con éxito! La franquicia quedó al día.");
        await loadPartners();
      }
    } catch (err) {
      console.error(err);
      alert("Error al registrar mensualidad.");
    } finally {
      setActionLoading(null);
    }
  };

  // Guardar y aplicar porcentajes globales a todos los embajadores
  const handleApplyGlobalRate = async () => {
    const firstMonthNum = parseFloat(globalFirstMonthRateInput);
    const recurringNum = parseFloat(globalRecurringRateInput);

    if (
      isNaN(firstMonthNum) ||
      firstMonthNum < 0 ||
      firstMonthNum > 100 ||
      isNaN(recurringNum) ||
      recurringNum < 0 ||
      recurringNum > 100
    ) {
      alert("Por favor ingresa porcentajes válidos entre 0 y 100.");
      return;
    }

    const confirmApply = confirm(
      `¿Deseas fijar la comisión global:\n\n🔥 1er Mes (Bono de Captación): ${firstMonthNum}%\n🔄 Meses 2+ (Residual Recurrente): ${recurringNum}%\n\nSe aplicará a TODOS los embajadores registrados y a los nuevos registros?`
    );
    if (!confirmApply) return;

    try {
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateAll: true,
          firstMonthCommissionRate: firstMonthNum / 100,
          commissionRate: recurringNum / 100,
        }),
      });

      if (res.ok) {
        alert(`¡Comisiones globales fijadas con éxito! (1er Mes: ${firstMonthNum}%, Recurrente: ${recurringNum}%)`);
        await loadPartners();
      }
    } catch (err) {
      console.error(err);
      alert("Error al aplicar comisiones globales.");
    }
  };

  // Simular renovación mensual de un cliente para acreditar comisión al embajador
  const handleSimulateCommission = async (partner: PartnerAdmin) => {
    const businessName = prompt(
      `Simular pago de un cliente para ${partner.name}.\n\nIngresa el nombre del negocio (Barbería, Spa, etc.):`,
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

      setSimulateSuccess({
        partnerName: data.result?.partnerName || partner.name,
        businessName: data.result?.businessName || businessName,
        subscriptionAmount: simulateAmount,
        commissionEarned: data.result?.commissionAmount,
        newBalance: data.result?.newBalance,
        isFirstMonth: data.result?.isFirstMonth,
        monthNumber: data.result?.monthNumber,
        appliedRate: data.result?.appliedRate,
        recurringRate: data.result?.recurringRate,
        whatsappUrl: data.whatsappAlert,
      });

      await loadPartners();
    } catch (err) {
      console.error(err);
      alert("Error al simular comisión.");
    } finally {
      setActionLoading(null);
    }
  };

  // Aprobar pago de retiro
  const handleMarkPayoutPaid = async (payoutId: string, partnerName: string, amount: number) => {
    const ref = prompt(
      `Aprobar y registrar pago de ${formatCOP(amount)} a ${partnerName}.\n\nIngresa el comprobante o referencia bancaria (Nequi / Daviplata):`,
      `NEQUI-${Date.now().toString().slice(-6)}`
    );
    if (!ref) return;

    try {
      const res = await fetch(`/api/admin/partners/payouts/${payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          reference: ref,
        }),
      });

      if (res.ok) {
        alert("¡Retiro marcado como pagado exitosamente!");
        await loadPartners();
      }
    } catch (err) {
      console.error(err);
      alert("Error al procesar pago.");
    }
  };

  // Filtrado de embajadores
  const displayedPartners = partners.filter((p) => {
    if (statusFilter === "PENDING") return p.status === "PENDING";
    if (statusFilter === "ACTIVE") return p.status === "ACTIVE";
    if (statusFilter === "FRANCHISE") return Boolean(p.isFranchise);
    return true;
  });

  const pendingPartnersCount = partners.filter((p) => p.status === "PENDING").length;
  const activePartnersCount = partners.filter((p) => p.status === "ACTIVE").length;
  const franchisePartnersCount = partners.filter((p) => p.isFranchise).length;

  // Métricas globales
  const totalSocios = partners.length;
  const totalNegociosTraidos = partners.reduce((acc, p) => acc + p.totalReferred, 0);
  const totalBalancePendiente = partners.reduce((acc, p) => acc + p.balance, 0);
  const totalHistoricoGanado = partners.reduce((acc, p) => acc + p.totalEarned, 0);
  const totalFranchiseMonthlyMRR = partners
    .filter((p) => p.isFranchise && p.franchiseStatus === "ACTIVE")
    .reduce((acc, p) => acc + (p.franchiseMonthlyFee || 0), 0);

  return (
    <div className="space-y-6">
      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Embajadores Oficiales
            </span>
            <Users className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-white">{totalSocios}</p>
          <span className="text-[11px] text-slate-400">
            {activePartnersCount} activos • {pendingPartnersCount} pendientes
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Clientes Registrados
            </span>
            <TrendingUp className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-400">{totalNegociosTraidos}</p>
          <span className="text-[11px] text-slate-400">Barberías, spas y consultorios</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Saldo Pendiente por Liquidar
            </span>
            <Wallet className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-amber-400">
            {formatCOP(totalBalancePendiente)}
          </p>
          <span className="text-[11px] text-slate-400">Por transferir a sus Nequi/Bancos</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Total Comisiones Pagadas
            </span>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-white">
            {formatCOP(totalHistoricoGanado)}
          </p>
          <span className="text-[11px] text-emerald-400">Repartido de por vida</span>
        </div>
      </div>

      {/* BANNER INFORMATIVO & CONFIGURADOR GLOBAL (2 NIVELES) */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Banner explicativo */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/20 p-5 flex flex-col justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Modelo Escalonado: Bono 1er Mes Mayor + Residual Recurrente
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              El embajador gana una <strong>comisión inicial mayor en el primer mes</strong> para motivarlo agresivamente a buscar clientes, y a partir del <strong>segundo mes en adelante gana su porcentaje recurrente vitalicio</strong> mientras el negocio renueve. Puedes personalizar los porcentajes de forma global o individual por embajador.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/afiliados"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 shadow-md shadow-emerald-600/20 transition"
            >
              <span>Ver Formulario Público de Afiliados</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Tarjeta de configuración de comisiones globales */}
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="h-4 w-4" />
              Comisiones Globales Predeterminadas
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Fija los porcentajes para nuevos registros y aplícalos a todos:
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-amber-400 mb-1">
                  🔥 Bono 1er Mes
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={globalFirstMonthRateInput}
                    onChange={(e) => setGlobalFirstMonthRateInput(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white font-bold pr-7 focus:border-amber-500 focus:outline-none"
                    placeholder="50"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-emerald-400 mb-1">
                  🔄 Meses 2+ (Residual)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={globalRecurringRateInput}
                    onChange={(e) => setGlobalRecurringRateInput(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white font-bold pr-7 focus:border-emerald-500 focus:outline-none"
                    placeholder="20"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleApplyGlobalRate}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 transition shadow-sm"
            >
              Guardar y Aplicar a Todos
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
              Valida perfiles, personaliza comisiones de 1er mes / recurrentes o elimina registros no deseados
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
              <button
                onClick={() => setStatusFilter("FRANCHISE")}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  statusFilter === "FRANCHISE"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-amber-400 hover:text-amber-300"
                }`}
              >
                <span>👑 Franquicias ({franchisePartnersCount})</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Cargando embajadores...
          </div>
        ) : displayedPartners.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No hay registros con el filtro seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Postulante / Embajador</th>
                  <th className="py-3 px-4">Código Referido</th>
                  <th className="py-3 px-4">Comisiones (1er Mes / Recurrente)</th>
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
                    `¡Hola ${p.name}! Te escribo desde TurnoYa respecto a tu solicitud para ser Embajador Oficial. Nos gustaría conocer más sobre tu propuesta.`
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

                        <span className="block text-[11px] font-normal text-slate-400 mt-0.5 font-mono">
                          {p.phone} • {p.email}
                        </span>

                        {/* INSIGNIA DE FRANQUICIA SI ESTÁ HABILITADO */}
                        {p.isFranchise && (
                          <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 space-y-1">
                            <div className="flex items-center gap-1 font-bold">
                              <Crown className="h-3.5 w-3.5 text-amber-400" />
                              <span>{p.franchiseName || "Franquicia Oficial"}</span>
                              {p.franchiseCityCountry && <span className="text-slate-400 font-normal">({p.franchiseCityCountry})</span>}
                            </div>
                            <div className="text-[10px] text-slate-300 flex items-center gap-2 flex-wrap">
                              <span>Inscripción: {p.franchiseEntryFeePaid ? "✓ Pagada" : "⚠️ Pendiente"}</span>
                              <span>•</span>
                              <span>Canon: ${p.franchiseMonthlyFee || 29} {p.franchiseFeeCurrency || "USD"}/mes</span>
                              <span>•</span>
                              <span className={p.franchiseStatus === "ACTIVE" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                                {p.franchiseStatus === "ACTIVE" ? "🟢 Al día" : "🟡 Revisar"}
                              </span>
                            </div>
                          </div>
                        )}

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

                      {/* COMISIONES: 1ER MES Y RECURRENTE CON BOTÓN PARA EDITAR */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenRateEditModal(p)}
                          className="flex flex-col gap-0.5 items-start p-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 transition group text-left"
                          title="Click para personalizar porcentajes del 1er mes y recurrentes"
                        >
                          <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                            🔥 1er Mes: {Math.round((p.firstMonthCommissionRate ?? 0.50) * 100)}%
                          </span>
                          <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                            🔄 Mes 2+: {Math.round(p.commissionRate * 100)}%
                            <Edit2 className="h-2.5 w-2.5 text-slate-400 group-hover:text-emerald-300 ml-1 transition" />
                          </span>
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

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* ACCIONES DEPENDIENDO DEL ESTADO */}
                        {isPending ? (
                          <>
                            {/* BOTÓN APROBAR */}
                            <button
                              onClick={() => handleApprovePartner(p)}
                              disabled={actionLoading === p.id}
                              className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition"
                              title="Aprobar embajador y generar mensaje de WhatsApp"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Aprobar</span>
                            </button>

                            {/* BOTÓN RECHAZAR */}
                            <button
                              onClick={() => handleRejectPartner(p)}
                              disabled={actionLoading === p.id}
                              className="inline-flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-2 py-1.5 rounded-lg transition"
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
                              className="inline-flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-2 py-1.5 rounded-lg border border-emerald-500/30"
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
                              className="inline-flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-2 py-1.5 rounded-lg border border-emerald-500/30"
                              title="Contactar por WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </a>

                            {/* BOTÓN SIMULAR PAGO */}
                            <button
                              onClick={() => handleSimulateCommission(p)}
                              disabled={actionLoading === p.id}
                              className="inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2 py-1.5 rounded-lg border border-amber-500/30"
                              title="Simular pago de cliente y acreditar comisión"
                            >
                              <Play className="h-3.5 w-3.5" />
                              <span>+ Pagar Comisión</span>
                            </button>
                          </>
                        )}

                        {/* BOTÓN ADMINISTRAR FRANQUICIA */}
                        <button
                          onClick={() => handleOpenFranchiseModal(p)}
                          disabled={actionLoading === p.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition shadow-sm ${
                            p.isFranchise
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                              : "bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800"
                          }`}
                          title="Configurar Franquicia SaaS, inscripción y canon mensual"
                        >
                          <Crown className="h-3.5 w-3.5 text-amber-400" />
                          <span>Franquicia</span>
                        </button>

                        {/* BOTÓN ELIMINAR PERMANENTEMENTE */}
                        <button
                          onClick={() => handleDeletePartner(p)}
                          disabled={actionLoading === p.id}
                          className="inline-flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 px-2 py-1.5 rounded-lg transition"
                          title="Eliminar permanentemente de la base de datos"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Eliminar</span>
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
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-amber-400" />
          Solicitudes de Retiro de Dinero Pendientes
        </h4>

        {partners.every((p) => p.pendingPayoutRequests.length === 0) ? (
          <p className="text-xs text-slate-500 italic">No hay solicitudes de retiro pendientes.</p>
        ) : (
          <div className="space-y-3">
            {partners
              .filter((p) => p.pendingPayoutRequests.length > 0)
              .map((p) => (
                <div key={p.id} className="space-y-2">
                  {p.pendingPayoutRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 gap-3"
                    >
                      <div>
                        <span className="font-bold text-white text-xs block">{p.name}</span>
                        <span className="text-slate-400 text-[11px] block">
                          Método: <strong>{req.payoutMethod}</strong> ({req.payoutAccount})
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          Solicitado el {new Date(req.createdAt).toLocaleDateString("es-ES")}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-black text-amber-400 text-sm">
                          {formatCOP(req.amount)}
                        </span>
                        <button
                          onClick={() => handleMarkPayoutPaid(req.id, p.name, req.amount)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition"
                        >
                          Marcar como Pagado
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* MODAL PERSONALIZAR COMISIONES DE UN EMBAJADOR */}
      {editingPartnerRates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-slate-950 p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingPartnerRates(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Personalizar Comisiones</h4>
                <p className="text-xs text-slate-400">{editingPartnerRates.name} ({editingPartnerRates.referralCode})</p>
              </div>
            </div>

            <form onSubmit={handleSavePartnerRates} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1">
                  🔥 Bono 1er Mes (Captación Inicial) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={partnerFirstMonthInput}
                    onChange={(e) => setPartnerFirstMonthInput(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white font-bold pr-8 focus:border-amber-500 focus:outline-none"
                    placeholder="50"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Porcentaje del primer pago cuando el cliente contrata TurnoYa.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1">
                  🔄 Comisión Recurrente Vitalicia (Meses 2+) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={partnerRecurringInput}
                    onChange={(e) => setPartnerRecurringInput(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white font-bold pr-8 focus:border-emerald-500 focus:outline-none"
                    placeholder="20"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Porcentaje de todas las renovaciones mensuales siguientes mientras el negocio pague.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPartnerRates(null)}
                  className="w-1/2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs py-2.5 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === editingPartnerRates.id}
                  className="w-1/2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2.5 transition shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESULTADO DE SIMULACIÓN */}
      {simulateSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
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
                <span className="text-slate-400">Negocio Cliente:</span>
                <span className="font-bold text-white">{simulateSuccess.businessName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Concepto / Mes:</span>
                <span className="font-bold text-amber-400">
                  {simulateSuccess.isFirstMonth ? "🔥 Bono Inicial 1er Mes" : `🔄 Renovación Mes #${simulateSuccess.monthNumber}`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Tasa aplicada:</span>
                <span className="font-bold text-white">
                  {Math.round((simulateSuccess.appliedRate || 0.20) * 100)}%
                </span>
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
              {simulateSuccess.whatsappUrl && (
                <a
                  href={simulateSuccess.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 shadow-md shadow-emerald-600/25 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Enviar Notificación por WhatsApp</span>
                </a>
              )}

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

      {/* MODAL CONFIGURACIÓN Y ADMINISTRACIÓN DE FRANQUICIA SAAS */}
      {editingFranchisePartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-amber-500/30 bg-slate-950 p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setEditingFranchisePartner(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <span>Administración de Franquicia SaaS</span>
                </h4>
                <p className="text-xs text-slate-400">
                  {editingFranchisePartner.name} · WhatsApp: {editingFranchisePartner.phone}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveFranchise} className="space-y-4 text-xs">
              {/* Activar como Franquicia */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <span className="font-bold text-white block">¿Activar como Franquicia Oficial?</span>
                  <span className="text-[11px] text-slate-400">
                    Convierte a este aliado en dueño de la plataforma en su territorio.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={franchiseEnabled}
                    onChange={(e) => setFranchiseEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {franchiseEnabled && (
                <>
                  {/* Nombre y Territorio de la Franquicia */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Nombre de la Franquicia:
                      </label>
                      <input
                        type="text"
                        value={franchiseName}
                        onChange={(e) => setFranchiseName(e.target.value)}
                        placeholder="Ej. TurnoYa Medellín"
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Ciudad / País:
                      </label>
                      <input
                        type="text"
                        value={franchiseCityCountry}
                        onChange={(e) => setFranchiseCityCountry(e.target.value)}
                        placeholder="Ej. Medellín, Colombia"
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 1. CUOTA DE INSCRIPCIÓN INICIAL */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">
                        1️⃣ Cuota de Inscripción Inicial (Canon de Entrada)
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-amber-200 font-bold text-[11px]">
                        <input
                          type="checkbox"
                          checked={franchiseEntryFeePaid}
                          onChange={(e) => setFranchiseEntryFeePaid(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span>{franchiseEntryFeePaid ? "✓ Ya Pagada" : "⚠️ Pendiente"}</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={franchiseEntryFee}
                        onChange={(e) => setFranchiseEntryFee(e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-none"
                        placeholder="99"
                      />
                      <span className="font-bold text-slate-400">{franchiseFeeCurrency}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Pago único al inicio por adquirir la licencia y configuración de franquicia (ej. $99 USD o $400.000 COP).
                    </p>
                  </div>

                  {/* 2. MENSUALIDAD TECNOLÓGICA RECURRENTE */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300">
                        2️⃣ Mensualidad Tecnológica Recurrente
                      </span>
                      <select
                        value={franchiseFeeCurrency}
                        onChange={(e) => setFranchiseFeeCurrency(e.target.value)}
                        className="rounded-lg bg-slate-900 border border-slate-700 text-white font-bold px-2 py-1 text-[11px]"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="COP">COP ($)</option>
                        <option value="MXN">MXN ($)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={franchiseMonthlyFee}
                        onChange={(e) => setFranchiseMonthlyFee(e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white font-bold focus:border-emerald-500 focus:outline-none"
                        placeholder="29"
                      />
                      <span className="font-bold text-slate-400">{franchiseFeeCurrency} / mes</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Valor mensual fijo que el franquiciado te paga para mantener sus servidores, soporte y sistema activo (ej. $29 USD o $100.000 COP/mes).
                    </p>
                  </div>

                  {/* Estado de la Franquicia y Próximo Vencimiento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Estado del Canon:
                      </label>
                      <select
                        value={franchiseStatus}
                        onChange={(e) => setFranchiseStatus(e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-none"
                      >
                        <option value="ACTIVE">🟢 Al Día (Activa)</option>
                        <option value="PENDING_ENTRY_FEE">🟡 Pendiente de Inscripción</option>
                        <option value="PENDING_MONTHLY">🟠 Mensualidad Pendiente</option>
                        <option value="PAST_DUE">🔴 Vencida / En Mora</option>
                        <option value="INACTIVE">⚪ Inactiva</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Próximo Corte de Mensualidad:
                      </label>
                      <div className="text-white font-mono bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl">
                        {editingFranchisePartner.franchiseDueDate
                          ? new Date(editingFranchisePartner.franchiseDueDate).toLocaleDateString("es-ES")
                          : "No definida"}
                      </div>
                    </div>
                  </div>

                  {/* Botón rápido para registrar pago mensual recibido */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">¿Recibiste la mensualidad este mes?</span>
                      <span className="text-[11px] text-slate-400">Extiende 30 días la fecha de corte.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRegisterFranchiseMonthlyPayment(editingFranchisePartner)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                    >
                      + Registrar Pago Mensual
                    </button>
                  </div>

                  {/* Notas internas */}
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      Notas del Acuerdo / Franquicia:
                    </label>
                    <textarea
                      rows={2}
                      value={franchiseNotes}
                      onChange={(e) => setFranchiseNotes(e.target.value)}
                      placeholder="Ej. Franquicia exclusiva para la zona norte. Contacto directo por WhatsApp..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Botones */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFranchisePartner(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === editingFranchisePartner.id}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold transition shadow-md"
                >
                  {actionLoading === editingFranchisePartner.id ? "Guardando..." : "Guardar Franquicia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
