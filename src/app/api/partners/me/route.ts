import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get("partnerId");

    const cookieStore = await cookies();
    const cookieId = cookieStore.get("turnoya_partner_id")?.value;

    const partnerId = queryId || cookieId;

    if (!partnerId) {
      return NextResponse.json({ error: "No autenticado como embajador." }, { status: 401 });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        referredBusinesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            plan: true,
            active: true,
            currency: true,
            category: true,
            createdAt: true,
            _count: {
              select: {
                appointments: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        commissions: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            business: {
              select: { name: true, slug: true, currency: true },
            },
          },
        },
        payouts: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "Embajador no encontrado." }, { status: 404 });
    }

    if (partner.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error:
            partner.status === "PENDING"
              ? "Tu postulación está pendiente de validación por el administrador."
              : "Tu cuenta de embajador no está activa.",
          status: partner.status,
        },
        { status: 403 }
      );
    }

    // Calcular métricas
    const totalClientes = partner.referredBusinesses.length;
    const clientesProActivos = partner.referredBusinesses.filter(
      (b: any) => b.plan !== "FREE" && b.active
    ).length;

    // Ingreso mensual recurrente estimado (MRR estimado del socio)
    // Supongamos que cada plan PRO paga ~60.000 COP o 19 USD y la tasa es partner.commissionRate
    const estimatedMonthlyCommission = clientesProActivos * (19 * partner.commissionRate);

    return NextResponse.json({
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        referralCode: partner.referralCode,
        firstMonthCommissionRate: partner.firstMonthCommissionRate ?? 0.50,
        commissionRate: partner.commissionRate,
        balance: partner.balance,
        totalEarned: partner.totalEarned,
        payoutMethod: partner.payoutMethod,
        payoutAccount: partner.payoutAccount,
        status: partner.status,
        createdAt: partner.createdAt,
        isFranchise: partner.isFranchise,
        franchiseName: partner.franchiseName,
        franchiseCityCountry: partner.franchiseCityCountry,
        franchiseEntryFee: partner.franchiseEntryFee,
        franchiseEntryFeePaid: partner.franchiseEntryFeePaid,
        franchiseMonthlyFee: partner.franchiseMonthlyFee,
        franchiseFeeCurrency: partner.franchiseFeeCurrency,
        franchiseStatus: partner.franchiseStatus,
        franchiseDueDate: partner.franchiseDueDate,
      },
      stats: {
        totalClientes,
        clientesProActivos,
        estimatedMonthlyCommission,
      },
      referredBusinesses: partner.referredBusinesses,
      commissions: partner.commissions,
      payouts: partner.payouts,
      referralLink: `https://turnos.appzplay.online/?ref=${partner.referralCode}`,
      platformWhatsapp: (await prisma.platformSettings.findUnique({ where: { id: "global" } }))?.whatsappPaymentNumber || "3001234567",
    });
  } catch (error) {
    console.error("Error al obtener datos del embajador:", error);
    return NextResponse.json(
      { error: "Error al cargar datos del embajador." },
      { status: 500 }
    );
  }
}
