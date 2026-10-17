import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession as verifyAdmin } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

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

    // Obtener configuración global de comisiones y franquicias
    let settings: any = null;
    let globalFirstMonthRate = 0.50;
    let globalRecurringRate = 0.20;
    try {
      settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
      if (settings) {
        globalFirstMonthRate = settings.partnerFirstMonthRate ?? 0.50;
        globalRecurringRate = settings.partnerRecurringRate ?? 0.20;
      }
    } catch (e) {}

    const data = partners.map((p: any) => {
      const activePayingClients = p.referredBusinesses.filter(
        (b: any) => b.plan !== "FREE" && b.active
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
        // Campos de Franquicia SaaS
        isFranchise: p.isFranchise,
        franchiseName: p.franchiseName,
        franchiseCityCountry: p.franchiseCityCountry,
        franchiseEntryFee: p.franchiseEntryFee,
        franchiseEntryFeePaid: p.franchiseEntryFeePaid,
        franchiseMonthlyFee: p.franchiseMonthlyFee,
        franchiseFeeCurrency: p.franchiseFeeCurrency,
        franchiseStatus: p.franchiseStatus,
        franchiseDueDate: p.franchiseDueDate,
        franchiseNotes: p.franchiseNotes,
      };
    });

    return NextResponse.json({
      partners: data,
      globalFirstMonthRate,
      globalRecurringRate,
      defaultFranchiseEntryFeeUSD: settings?.defaultFranchiseEntryFeeUSD ?? 99,
      defaultFranchiseEntryFeeCOP: settings?.defaultFranchiseEntryFeeCOP ?? 400000,
      defaultFranchiseFeeUSD: settings?.defaultFranchiseFeeUSD ?? 29,
      defaultFranchiseFeeCOP: settings?.defaultFranchiseFeeCOP ?? 100000,
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

    // Actualizaciones de Franquicia SaaS / Marca Blanca
    if (typeof body.isFranchise === "boolean") dataToUpdate.isFranchise = body.isFranchise;
    if (body.franchiseName !== undefined) dataToUpdate.franchiseName = body.franchiseName ? body.franchiseName.trim() : null;
    if (body.franchiseCityCountry !== undefined) dataToUpdate.franchiseCityCountry = body.franchiseCityCountry ? body.franchiseCityCountry.trim() : null;
    if (typeof body.franchiseEntryFee === "number") dataToUpdate.franchiseEntryFee = body.franchiseEntryFee;
    if (typeof body.franchiseEntryFeePaid === "boolean") dataToUpdate.franchiseEntryFeePaid = body.franchiseEntryFeePaid;
    if (typeof body.franchiseMonthlyFee === "number") dataToUpdate.franchiseMonthlyFee = body.franchiseMonthlyFee;
    if (body.franchiseFeeCurrency) dataToUpdate.franchiseFeeCurrency = body.franchiseFeeCurrency;
    if (body.franchiseStatus) dataToUpdate.franchiseStatus = body.franchiseStatus;
    if (body.franchiseDueDate !== undefined) {
      dataToUpdate.franchiseDueDate = body.franchiseDueDate ? new Date(body.franchiseDueDate) : null;
    }
    if (body.franchiseNotes !== undefined) dataToUpdate.franchiseNotes = body.franchiseNotes;

    // Registrar pago mensual de franquicia (extender fecha de corte por 30 días)
    if (body.registerMonthlyPayment) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
      dataToUpdate.franchiseDueDate = nextDate;
      dataToUpdate.franchiseStatus = "ACTIVE";
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
