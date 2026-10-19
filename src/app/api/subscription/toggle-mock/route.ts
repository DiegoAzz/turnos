import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, plan } = body;

    if (!businessId || !["FREE", "INDEPENDIENTE", "PRO", "SUPERADMIN"].includes(plan)) {
      return NextResponse.json(
        { error: "Parámetros inválidos." },
        { status: 400 }
      );
    }

    const periodEnd =
      plan === "SUPERADMIN"
        ? new Date("2099-12-31")
        : plan !== "FREE"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        plan,
        stripeSubscriptionId: plan !== "FREE" ? "sub_mock_active" : null,
        stripeCurrentPeriodEnd: periodEnd,
      },
    });

    // Si el negocio sube a Plan PRO o Independiente y tiene un embajador asignado, acreditar comisión
    if (plan !== "FREE" && updatedBusiness.partnerId) {
      const { recordSubscriptionCommission } = await import("@/lib/partners");
      await recordSubscriptionCommission({
        businessId: updatedBusiness.id,
        subscriptionAmount: updatedBusiness.currency === "USD" ? 19 : 60000,
        planName: `Plan ${plan}`,
      });
    }

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
