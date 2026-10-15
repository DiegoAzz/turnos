import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("turnos_admin_session");
  return session?.value === "authenticated";
}

export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            referredBusinesses: true,
            commissions: true,
            payouts: true,
          },
        },
        referredBusinesses: {
          select: {
            id: true,
            name: true,
            plan: true,
            active: true,
            createdAt: true,
          },
        },
        payouts: {
          where: { status: "REQUESTED" },
        },
      },
    });

    const data = partners.map((p) => {
      const activePayingClients = p.referredBusinesses.filter(
        (b) => b.plan !== "FREE" && b.active
      ).length;

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        referralCode: p.referralCode,
        commissionRate: p.commissionRate,
        balance: p.balance,
        totalEarned: p.totalEarned,
        payoutMethod: p.payoutMethod,
        payoutAccount: p.payoutAccount,
        status: p.status,
        createdAt: p.createdAt,
        totalReferred: p._count.referredBusinesses,
        activePayingClients,
        pendingPayoutRequests: p.payouts,
      };
    });

    return NextResponse.json({ partners: data });
  } catch (error) {
    console.error("Error al listar embajadores:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { partnerId, commissionRate, status, updateAll } = body;

    if (updateAll && typeof commissionRate === "number") {
      await prisma.partner.updateMany({
        data: { commissionRate },
      });
      return NextResponse.json({ success: true, message: `Comisión de todos los embajadores actualizada a ${commissionRate * 100}%` });
    }

    const dataToUpdate: any = {};
    if (typeof commissionRate === "number") dataToUpdate.commissionRate = commissionRate;
    if (status) dataToUpdate.status = status;

    const updated = await prisma.partner.update({
      where: { id: partnerId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, partner: updated });
  } catch (error) {
    console.error("Error al actualizar embajador:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
