import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordSubscriptionCommission } from "@/lib/partners";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body?.event;
    const transaction = body?.data?.transaction;

    if (!transaction) {
      return NextResponse.json({ message: "Payload sin transacción" }, { status: 200 });
    }

    const { id, reference, status, amount_in_cents, currency } = transaction;

    if (status === "APPROVED" && reference) {
      // Formato reference: TY_{PLAN}_{SHORT_ID}_{TIMESTAMP}
      const parts = reference.split("_");
      const targetPlan = parts[1] === "INDEPENDIENTE" ? "INDEPENDIENTE" : "PRO";
      const shortId = parts[2];

      // Buscar el negocio por el prefijo de ID o buscar directamente
      const business = await prisma.business.findFirst({
        where: {
          id: {
            startsWith: shortId,
          },
        },
      });

      if (business) {
        // Calcular 30 días de suscripción (o extender 30 días si el plan ya estaba vigente)
        const now = new Date();
        const baseDate =
          business.stripeCurrentPeriodEnd &&
          new Date(business.stripeCurrentPeriodEnd) > now
            ? new Date(business.stripeCurrentPeriodEnd)
            : now;
        const newPeriodEnd = new Date(
          baseDate.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        // Actualizar el plan del negocio a PRO o INDEPENDIENTE con su fecha de vigencia
        await prisma.business.update({
          where: { id: business.id },
          data: {
            plan: targetPlan,
            active: true,
            stripeCurrentPeriodEnd: newPeriodEnd,
          },
        });

        // Si fue referido por un embajador, acreditar su comisión automáticamente
        const amountPaid = amount_in_cents ? amount_in_cents / 100 : 60000;
        await recordSubscriptionCommission({
          businessId: business.id,
          subscriptionAmount: amountPaid,
          planName: `Plan ${targetPlan} (Wompi PSE/Tarjeta - Ref: ${id})`,
        });

        console.log(`[Wompi Webhook] Negocio ${business.name} actualizado exitosamente a ${targetPlan} hasta ${newPeriodEnd.toISOString()}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error al procesar webhook de Wompi:", error);
    return NextResponse.json({ error: "Error en webhook" }, { status: 500 });
  }
}
