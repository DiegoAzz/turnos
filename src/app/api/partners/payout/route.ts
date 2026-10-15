import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, payoutMethod, payoutAccount } = body;

    const cookieStore = await cookies();
    const partnerId = cookieStore.get("turnoya_partner_id")?.value;

    if (!partnerId) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return NextResponse.json({ error: "Embajador no encontrado." }, { status: 404 });
    }

    const requestedAmount = parseFloat(amount);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      return NextResponse.json({ error: "Monto inválido para retiro." }, { status: 400 });
    }

    if (requestedAmount > partner.balance) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Tu saldo disponible es de $${partner.balance}.` },
        { status: 400 }
      );
    }

    // Transacción: crear solicitud de retiro y descontar del saldo disponible
    const [payout, updatedPartner] = await prisma.$transaction([
      prisma.partnerPayout.create({
        data: {
          partnerId: partner.id,
          amount: requestedAmount,
          payoutMethod: payoutMethod || partner.payoutMethod,
          payoutAccount: payoutAccount || partner.payoutAccount || partner.phone,
          status: "REQUESTED",
        },
      }),
      prisma.partner.update({
        where: { id: partner.id },
        data: {
          balance: { decrement: requestedAmount },
        },
      }),
    ]);

    // Generar link de WhatsApp para coordinar el retiro con soporte/admin
    const cleanPhone = "573000000000"; // Admin phone o link de soporte
    const msg = `Hola, soy ${partner.name} (Embajador TurnoYa código ${partner.referralCode}). Acabo de solicitar un retiro de comisiones por valor de $${requestedAmount} a mi ${payout.payoutMethod} (${payout.payoutAccount}). Quedo atento a la confirmación de pago.`;
    const whatsappNoticeUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;

    return NextResponse.json({
      success: true,
      payout,
      newBalance: updatedPartner.balance,
      whatsappNoticeUrl,
    });
  } catch (error) {
    console.error("Error al procesar solicitud de retiro:", error);
    return NextResponse.json(
      { error: "Error en el servidor al procesar el retiro." },
      { status: 500 }
    );
  }
}
