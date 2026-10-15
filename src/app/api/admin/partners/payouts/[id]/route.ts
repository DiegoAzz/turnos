import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("turnos_admin_session");
  return session?.value === "authenticated";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { action, reference, notes } = body; // action: "APPROVE" | "REJECT"

    const payout = await prisma.partnerPayout.findUnique({
      where: { id },
      include: { partner: true },
    });

    if (!payout) {
      return NextResponse.json({ error: "Solicitud no encontrada." }, { status: 404 });
    }

    if (action === "APPROVE") {
      const updated = await prisma.partnerPayout.update({
        where: { id },
        data: {
          status: "PAID",
          reference: reference || "PAGO_DIRECTO",
          notes: notes || null,
          processedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, payout: updated });
    }

    if (action === "REJECT") {
      // Si se rechaza, devolvemos el saldo al embajador
      const [updatedPayout] = await prisma.$transaction([
        prisma.partnerPayout.update({
          where: { id },
          data: {
            status: "REJECTED",
            notes: notes || "Rechazado por administración",
            processedAt: new Date(),
          },
        }),
        prisma.partner.update({
          where: { id: payout.partnerId },
          data: {
            balance: { increment: payout.amount },
          },
        }),
      ]);
      return NextResponse.json({ success: true, payout: updatedPayout });
    }

    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (error) {
    console.error("Error al actualizar pago:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
