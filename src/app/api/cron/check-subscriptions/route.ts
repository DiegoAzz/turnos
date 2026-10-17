import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Endpoint autónomo de comprobación de suscripciones.
 * Puede ser invocado por un Cron Job (Vercel Cron, GitHub Actions, EasyCron, curl)
 * o automáticamente por el sistema.
 * 
 * Revisa todos los negocios cuyo periodo pagado haya caducado (fecha < ahora)
 * y los degrada automáticamente a FREE.
 */
export async function GET(req: NextRequest) {
  try {
    const now = new Date();

    const expiredBusinesses = await prisma.business.findMany({
      where: {
        plan: { not: "FREE" },
        stripeCurrentPeriodEnd: { lt: now },
      },
      select: { id: true, name: true, plan: true, stripeCurrentPeriodEnd: true },
    });

    if (expiredBusinesses.length > 0) {
      await prisma.business.updateMany({
        where: {
          id: { in: expiredBusinesses.map((b) => b.id) },
        },
        data: {
          plan: "FREE",
        },
      });

      console.log(
        `[Cron Autónomo TurnoYa] Se degradaron a FREE ${expiredBusinesses.length} negocios vencidos:`,
        expiredBusinesses.map((b) => b.name).join(", ")
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      checkedCount: expiredBusinesses.length,
      downgradedBusinesses: expiredBusinesses,
    });
  } catch (error) {
    console.error("[Cron Autónomo] Error al procesar suscripciones vencidas:", error);
    return NextResponse.json({ error: "Error en el cron de suscripciones" }, { status: 500 });
  }
}
