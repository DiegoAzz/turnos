import { prisma } from "@/lib/prisma";

export function normalizeReferralCode(code: string): string {
  return code
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9-]/g, "");
}

/**
 * Registra y acredita automáticamente la comisión a un embajador/socio.
 * El PRIMER MES aplica un porcentaje mayor (Bono de Adquisición para motivarlo),
 * y a partir del MES 2 en adelante aplica la comisión recurrente vitalicia.
 */
export async function recordSubscriptionCommission({
  businessId,
  subscriptionAmount,
  planName = "Plan PRO",
}: {
  businessId: string;
  subscriptionAmount: number;
  planName?: string;
}) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { partner: true },
    });

    if (!business || !business.partnerId || !business.partner) {
      return { credited: false, reason: "El negocio no tiene un embajador asignado." };
    }

    const partner = business.partner;
    if (partner.status !== "ACTIVE") {
      return { credited: false, reason: "El embajador no se encuentra activo." };
    }

    // Contar cuántas comisiones previas ha generado este negocio para este embajador
    const previousCommissionsCount = await prisma.partnerCommission.count({
      where: {
        partnerId: partner.id,
        businessId: business.id,
      },
    });

    const isFirstMonth = previousCommissionsCount === 0;
    const monthNumber = previousCommissionsCount + 1;

    // Primer mes: gana una comisión inicial mayor para motivar su esfuerzo comercial
    // Meses siguientes: gana la comisión recurrente vitalicia pactada
    const appliedRate = isFirstMonth
      ? (partner.firstMonthCommissionRate ?? 0.50)
      : (partner.commissionRate ?? 0.20);

    const commissionAmount = Math.round(subscriptionAmount * appliedRate * 100) / 100;

    const description = isFirstMonth
      ? `🔥 Bono Inicial 1er Mes (${Math.round(appliedRate * 100)}%) por captación de ${business.name} (${planName})`
      : `🔄 Comisión Recurrente Mes #${monthNumber} (${Math.round(appliedRate * 100)}%) de ${business.name} (${planName})`;

    // Ejecutar transacción atómica: crear registro de comisión y sumar saldo a la billetera
    const [commission, updatedPartner] = await prisma.$transaction([
      prisma.partnerCommission.create({
        data: {
          partnerId: partner.id,
          businessId: business.id,
          subscriptionAmount,
          commissionRate: appliedRate,
          amount: commissionAmount,
          isFirstMonth,
          monthNumber,
          description,
        },
      }),
      prisma.partner.update({
        where: { id: partner.id },
        data: {
          balance: { increment: commissionAmount },
          totalEarned: { increment: commissionAmount },
        },
      }),
    ]);

    return {
      credited: true,
      partnerId: partner.id,
      partnerName: partner.name,
      partnerPhone: partner.phone,
      commissionAmount,
      isFirstMonth,
      monthNumber,
      appliedRate,
      recurringRate: partner.commissionRate,
      newBalance: updatedPartner.balance,
      businessName: business.name,
    };
  } catch (error) {
    console.error("Error al registrar comisión de embajador:", error);
    return { credited: false, error };
  }
}

/**
 * Genera el enlace de WhatsApp para notificar al embajador que recibió una comisión.
 * Distingue con gran entusiasmo el bono de primer mes frente a las renovaciones recurrentes.
 */
export function generatePartnerCommissionWhatsAppMessage({
  phone,
  partnerName,
  businessName,
  commissionAmount,
  currency = "COP",
  newBalance,
  isFirstMonth = false,
  monthNumber = 1,
  appliedRate,
  recurringRate,
}: {
  phone: string;
  partnerName: string;
  businessName: string;
  commissionAmount: number;
  currency?: string;
  newBalance: number;
  isFirstMonth?: boolean;
  monthNumber?: number;
  appliedRate?: number;
  recurringRate?: number;
}): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const formattedCommission = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "COP",
    maximumFractionDigits: 0,
  }).format(commissionAmount);

  const formattedBalance = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "COP",
    maximumFractionDigits: 0,
  }).format(newBalance);

  let text = "";
  if (isFirstMonth) {
    const ratePct = appliedRate ? Math.round(appliedRate * 100) : 50;
    const recPct = recurringRate ? Math.round(recurringRate * 100) : 20;
    text = `*¡Felicidades ${partnerName}! Ganaste tu BONO INICIAL del PRIMER MES.*\n\n` +
      `Acabas de captar a tu nuevo cliente *${businessName}* en TurnoYa.\n\n` +
      `✓ *Bono Inicial 1er Mes (${ratePct}%):* ${formattedCommission}\n` +
      `✓ *Tu saldo acumulado:* ${formattedBalance}\n\n` +
      `➜ *Lo mejor:* a partir del mes 2 seguirás cobrando tu *comisión recurrente del ${recPct}%* todos los meses de por vida mientras tu cliente use la app.\n\n` +
      `Revisa tu portal aquí: https://turnos.appzplay.online/afiliados`;
  } else {
    const ratePct = appliedRate ? Math.round(appliedRate * 100) : 20;
    text = `*¡Felicidades ${partnerName}! Nueva comisión recurrente ganada (Mes #${monthNumber}).*\n\n` +
      `Tu cliente *${businessName}* acaba de renovar su suscripción en TurnoYa.\n\n` +
      `✓ *Comisión Recurrente (${ratePct}%):* ${formattedCommission}\n` +
      `✓ *Tu saldo acumulado:* ${formattedBalance}\n\n` +
      `¡Tu sueldo residual pasivo sigue creciendo mes a mes!\n\n` +
      `Revisa tu portal aquí: https://turnos.appzplay.online/afiliados`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
