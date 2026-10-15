import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { recordSubscriptionCommission, generatePartnerCommissionWhatsAppMessage } from "@/lib/partners";

export const dynamic = "force-dynamic";

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("turnos_admin_session");
  return session?.value === "authenticated";
}

// POST: Simular el cobro de la mensualidad de un cliente y pagar la comisión al embajador
export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { businessId, amount = 60000, planName = "Plan PRO Mensual" } = body;

    const result = await recordSubscriptionCommission({
      businessId,
      subscriptionAmount: parseFloat(amount),
      planName,
    });

    if (!result.credited) {
      return NextResponse.json({ error: result.reason || "No se pudo acreditar la comisión." }, { status: 400 });
    }

    let whatsappAlert = null;
    if (result.partnerPhone) {
      whatsappAlert = generatePartnerCommissionWhatsAppMessage({
        phone: result.partnerPhone,
        partnerName: result.partnerName || "Socio",
        businessName: result.businessName || "Negocio",
        commissionAmount: result.commissionAmount || 0,
        currency: "COP",
        newBalance: result.newBalance || 0,
        isFirstMonth: result.isFirstMonth,
        monthNumber: result.monthNumber,
        appliedRate: result.appliedRate,
        recurringRate: result.recurringRate,
      });
    }

    return NextResponse.json({
      success: true,
      result,
      whatsappAlert,
      message: `¡Comisión de $${result.commissionAmount} acreditada con éxito al embajador ${result.partnerName}!`,
    });
  } catch (error) {
    console.error("Error al simular comisión:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
