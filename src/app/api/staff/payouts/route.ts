import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const business = await getCurrentBusiness();
    const body = await req.json();
    const targetBusinessId = business?.id || body.businessId;

    if (!targetBusinessId) {
      return NextResponse.json({ error: "No autorizado o negocio no encontrado" }, { status: 401 });
    }

    const { staffMemberId, amount, servicesCount, notes, periodStart, periodEnd } = body;

    if (!staffMemberId || !amount) {
      return NextResponse.json({ error: "staffMemberId y amount son obligatorios" }, { status: 400 });
    }

    const payout = await prisma.staffPayout.create({
      data: {
        businessId: targetBusinessId,
        staffMemberId,
        amount: parseFloat(String(amount)),
        servicesCount: parseInt(String(servicesCount || 0), 10),
        notes: notes?.trim() || null,
        periodStart: periodStart ? new Date(periodStart) : new Date(),
        periodEnd: periodEnd ? new Date(periodEnd) : new Date(),
      },
      include: {
        staffMember: true,
      },
    });

    return NextResponse.json({
      success: true,
      payout,
    });
  } catch (error) {
    console.error("Error al registrar liquidación:", error);
    return NextResponse.json({ error: "Error al registrar pago al barbero" }, { status: 500 });
  }
}
