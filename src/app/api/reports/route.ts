import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessIdParam = searchParams.get("businessId");
    const startDateParam = searchParams.get("startDate"); // YYYY-MM-DD
    const endDateParam = searchParams.get("endDate"); // YYYY-MM-DD
    const preset = searchParams.get("preset") || "THIS_MONTH"; // TODAY | THIS_WEEK | THIS_MONTH | CUSTOM

    let business = await getCurrentBusiness();
    if (!business && businessIdParam) {
      business = await prisma.business.findUnique({
        where: { id: businessIdParam },
      });
    }

    if (!business) {
      return NextResponse.json({ error: "Negocio no autorizado" }, { status: 401 });
    }

    // Calcular fechas según preset
    const now = new Date();
    let start: Date;
    let end: Date;

    if (preset === "TODAY") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (preset === "THIS_WEEK") {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + 6, 23, 59, 59, 999);
    } else if (preset === "CUSTOM" && startDateParam && endDateParam) {
      start = new Date(`${startDateParam}T00:00:00.000Z`);
      end = new Date(`${endDateParam}T23:59:59.999Z`);
    } else {
      // THIS_MONTH
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // 1. Consultar Citas en el rango
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        service: true,
      },
      orderBy: { date: "asc" },
    });

    // 2. Consultar Ventas de Productos
    const productSales = await prisma.productSale.findMany({
      where: {
        businessId: business.id,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        product: true,
      },
      orderBy: { date: "asc" },
    });

    // 3. Consultar Gastos
    const expenses = await prisma.expense.findMany({
      where: {
        businessId: business.id,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: "asc" },
    });

    // Cálculos de citas
    const completedAppointments = appointments.filter((a) => a.status === "COMPLETED");
    const cancelledAppointments = appointments.filter((a) => a.status === "CANCELLED");
    const pendingAppointments = appointments.filter((a) => a.status === "CONFIRMED" || a.status === "PENDING");

    // Ingresos por servicios
    const servicesRevenue = completedAppointments.reduce((sum, a) => sum + (a.service?.price || 0), 0);

    // Ingresos por domicilios (recargos)
    const homeDeliveriesCount = completedAppointments.filter((a) => a.appointmentType === "DOMICILIO").length;
    const homeFeesRevenue = completedAppointments.reduce((sum, a) => sum + (a.homeFee || 0), 0);

    // Ingresos por productos
    const productsRevenue = productSales.reduce((sum, s) => sum + (s.total || 0), 0);

    // Total Bruto
    const grossRevenue = servicesRevenue + homeFeesRevenue + productsRevenue;

    // Total Gastos
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Utilidad Neta
    const netProfit = grossRevenue - totalExpenses;

    // Clientes únicos y nuevos en el rango
    const uniqueClientsMap = new Map<string, string>();
    completedAppointments.forEach((a) => {
      uniqueClientsMap.set(a.clientPhone, a.clientName);
    });
    const uniqueClientsCount = uniqueClientsMap.size;

    // Desglose por método de pago
    const paymentMethodsBreakdown: Record<string, number> = {
      EFECTIVO: 0,
      NEQUI: 0,
      DAVIPLATA: 0,
      BANCOLOMBIA: 0,
      TARJETA: 0,
      OTRO: 0,
    };

    completedAppointments.forEach((a) => {
      const pm = (a.paymentMethod || "EFECTIVO").toUpperCase();
      const amount = (a.service?.price || 0) + (a.homeFee || 0);
      if (paymentMethodsBreakdown[pm] !== undefined) {
        paymentMethodsBreakdown[pm] += amount;
      } else {
        paymentMethodsBreakdown.OTRO += amount;
      }
    });

    productSales.forEach((s) => {
      const pm = (s.paymentMethod || "EFECTIVO").toUpperCase();
      if (paymentMethodsBreakdown[pm] !== undefined) {
        paymentMethodsBreakdown[pm] += s.total;
      } else {
        paymentMethodsBreakdown.OTRO += s.total;
      }
    });

    // Top Servicios más solicitados
    const serviceRankingMap = new Map<string, { name: string; count: number; revenue: number }>();
    completedAppointments.forEach((a) => {
      if (!a.service) return;
      const existing = serviceRankingMap.get(a.service.name) || {
        name: a.service.name,
        count: 0,
        revenue: 0,
      };
      existing.count += 1;
      existing.revenue += a.service.price;
      serviceRankingMap.set(a.service.name, existing);
    });

    const topServices = Array.from(serviceRankingMap.values()).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      range: {
        preset,
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
      metrics: {
        grossRevenue,
        servicesRevenue,
        homeFeesRevenue,
        homeDeliveriesCount,
        productsRevenue,
        totalExpenses,
        netProfit,
        totalServicesCompleted: completedAppointments.length,
        totalAppointments: appointments.length,
        cancelledCount: cancelledAppointments.length,
        cancellationRate: appointments.length > 0 ? Math.round((cancelledAppointments.length / appointments.length) * 100) : 0,
        uniqueClientsCount,
      },
      paymentMethodsBreakdown,
      topServices,
      appointments: completedAppointments.map((a) => ({
        id: a.id,
        date: a.date.toISOString().split("T")[0],
        time: a.startTime,
        clientName: a.clientName,
        clientPhone: a.clientPhone,
        serviceName: a.service?.name,
        price: a.service?.price || 0,
        homeFee: a.homeFee || 0,
        total: (a.service?.price || 0) + (a.homeFee || 0),
        type: a.appointmentType,
        paymentMethod: a.paymentMethod,
      })),
      currency: business.currency || "COP",
    });
  } catch (error) {
    console.error("Error al generar reportes:", error);
    return NextResponse.json({ error: "Error al generar los reportes del negocio" }, { status: 500 });
  }
}
