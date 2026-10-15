import { prisma } from "@/lib/prisma";

export function normalizeReferralCode(code: string): string {
  return code
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9-]/g, "");
}

/**
 * Registra y acredita automáticamente la comisión recurrente a un embajador/socio
 * cuando un cliente paga o renueva su suscripción.
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

    const commissionAmount = Math.round(subscriptionAmount * partner.commissionRate * 100) / 100;

    // Ejecutar transacción atómica: crear registro de comisión y sumar saldo a la billetera
    const [commission, updatedPartner] = await prisma.$transaction([
      prisma.partnerCommission.create({
        data: {
          partnerId: partner.id,
          businessId: business.id,
          subscriptionAmount,
          commissionRate: partner.commissionRate,
          amount: commissionAmount,
          description: `Comisión mensual recurrente ${planName} de ${business.name}`,
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
      newBalance: updatedPartner.balance,
      businessName: business.name,
    };
  } catch (error) {
    console.error("Error al registrar comisión de embajador:", error);
    return { credited: false, error };
  }
}

/**
 * Genera el enlace de WhatsApp para notificar al embajador que recibió una comisión recurrente
 */
export function generatePartnerCommissionWhatsAppMessage({
  phone,
  partnerName,
  businessName,
  commissionAmount,
  currency = "COP",
  newBalance,
}: {
  phone: string;
  partnerName: string;
  businessName: string;
  commissionAmount: number;
  currency?: string;
  newBalance: number;
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

  const text = `🎉 *¡Felicidades ${partnerName}! Nueva comisión recurrente ganada.*

Tu cliente *${businessName}* acaba de pagar su suscripción de TurnoYa.

💰 *Comisión ganada:* ${formattedCommission}
🏦 *Tu saldo acumulado:* ${formattedBalance}

Recuerda: ¡mientras tu cliente siga usando la app, seguirás cobrando mes a mes de por vida! 🚀

Revisa tu portal aquí: https://turnos.appzplay.online/afiliados`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
