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

    // Obtener configuración global de comisiones
    let globalFirstMonthRate = 0.50;
    let globalRecurringRate = 0.20;
    try {
      const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
      if (settings) {
        globalFirstMonthRate = settings.partnerFirstMonthRate ?? 0.50;
        globalRecurringRate = settings.partnerRecurringRate ?? 0.20;
      }
    } catch (e) {}

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
        firstMonthCommissionRate: p.firstMonthCommissionRate ?? 0.50,
        commissionRate: p.commissionRate,
        balance: p.balance,
        totalEarned: p.totalEarned,
        payoutMethod: p.payoutMethod,
        payoutAccount: p.payoutAccount,
        experience: p.experience,
        status: p.status,
        approvedAt: p.approvedAt,
        createdAt: p.createdAt,
        totalReferred: p._count.referredBusinesses,
        activePayingClients,
        pendingPayoutRequests: p.payouts,
      };
    });

    return NextResponse.json({
      partners: data,
      globalFirstMonthRate,
      globalRecurringRate,
    });
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
    const { partnerId, commissionRate, firstMonthCommissionRate, status, updateAll } = body;

    if (updateAll) {
      const updateData: any = {};
      if (typeof commissionRate === "number") updateData.commissionRate = commissionRate;
      if (typeof firstMonthCommissionRate === "number") updateData.firstMonthCommissionRate = firstMonthCommissionRate;

      if (Object.keys(updateData).length > 0) {
        await prisma.partner.updateMany({ data: updateData });

        // Guardar también en PlatformSettings para nuevos registros
        await prisma.platformSettings.upsert({
          where: { id: "global" },
          update: {
            ...(typeof firstMonthCommissionRate === "number" ? { partnerFirstMonthRate: firstMonthCommissionRate } : {}),
            ...(typeof commissionRate === "number" ? { partnerRecurringRate: commissionRate } : {}),
          },
          create: {
            id: "global",
            partnerFirstMonthRate: typeof firstMonthCommissionRate === "number" ? firstMonthCommissionRate : 0.50,
            partnerRecurringRate: typeof commissionRate === "number" ? commissionRate : 0.20,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Comisiones de todos los embajadores y configuración global actualizadas con éxito.",
      });
    }

    const dataToUpdate: any = {};
    if (typeof commissionRate === "number") dataToUpdate.commissionRate = commissionRate;
    if (typeof firstMonthCommissionRate === "number") dataToUpdate.firstMonthCommissionRate = firstMonthCommissionRate;
    if (status) {
      dataToUpdate.status = status;
      if (status === "ACTIVE") {
        dataToUpdate.approvedAt = new Date();
      }
    }

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

// DELETE /api/admin/partners - Eliminar embajador permanentemente de la base de datos
export async function DELETE(req: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de embajador requerido" }, { status: 400 });
    }

    // Desvincular cualquier negocio que haya referido para no romper integridad
    await prisma.business.updateMany({
      where: { partnerId: id },
      data: { partnerId: null },
    });

    // Eliminar el embajador (sus comisiones y retiros se eliminan en cascada)
    await prisma.partner.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Embajador eliminado permanentemente con éxito.",
    });
  } catch (error) {
    console.error("Error al eliminar embajador:", error);
    return NextResponse.json({ error: "Error al eliminar el embajador" }, { status: 500 });
  }
}
