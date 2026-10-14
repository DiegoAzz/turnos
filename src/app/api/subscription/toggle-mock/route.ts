import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, plan } = body;

    if (!businessId || !["FREE", "PRO"].includes(plan)) {
      return NextResponse.json(
        { error: "Parámetros inválidos." },
        { status: 400 }
      );
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        plan,
        stripeSubscriptionId: plan === "PRO" ? "sub_mock_active" : null,
        stripeCurrentPeriodEnd:
          plan === "PRO"
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : null,
      },
    });

    return NextResponse.json({
      success: true,
      business: updatedBusiness,
      message: `Plan actualizado con éxito a ${plan}`,
    });
  } catch (error) {
    console.error("Error al alternar plan:", error);
    return NextResponse.json(
      { error: "Error al actualizar plan" },
      { status: 500 }
    );
  }
}
