import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-business";
import { getTodayUtcRange } from "@/lib/date-utils";
import { parseStaffServices, encodeStaffServices } from "@/lib/staff-service-permissions";

import { isBusinessPro, getTrialStatus } from "@/lib/business-plan";


export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const business = await getCurrentBusiness();
    const queryBusinessId = req.nextUrl.searchParams.get("businessId");
    const targetBusinessId = business?.id || queryBusinessId;

    if (!targetBusinessId) {
      return NextResponse.json({ error: "No autorizado o negocio no encontrado" }, { status: 401 });
    }

    const currentBusiness = business || (await prisma.business.findUnique({
      where: { id: targetBusinessId },
    }));

    const { startOfDay, endOfDay } = getTodayUtcRange();

    // Inicio del mes actual en UTC
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

    // Obtener todos los miembros del equipo del negocio
    const staffMembers = await prisma.staffMember.findMany({
      where: {
        businessId: targetBusinessId,
      },
      orderBy: [{ chairNumber: "asc" }, { createdAt: "asc" }],
      include: {
        appointments: {
          where: {
            date: { gte: startOfMonth },
            status: { in: ["COMPLETED", "IN_PROGRESS"] },
          },
          include: {
            service: true,
          },
        },
        payouts: {
          orderBy: { paidAt: "desc" },
          take: 5,
        },
      },
    });

    // Calcular estadísticas financieras por cada barbero
    const enrichedStaff = staffMembers.map((barber) => {
      let todayServicesCount = 0;
      let todayTotalBilled = 0;
      let todayCommissionEarned = 0;

      let monthServicesCount = 0;
      let monthTotalBilled = 0;
      let monthCommissionEarned = 0;

      let currentServing: any = null;

      const rate = (barber.commissionRate || 50) / 100;

      for (const app of barber.appointments) {
        if (app.status === "IN_PROGRESS") {
          currentServing = {
            id: app.id,
            clientName: app.clientName,
            serviceName: app.service?.name,
            startTime: app.startTime,
            appointmentType: app.appointmentType,
          };
          continue;
        }

        if (app.status === "COMPLETED") {
          const price = app.service?.price || 0;
          const comm = price * rate;

          // Si fue hoy
          const appDate = new Date(app.date);
          if (appDate >= startOfDay && appDate <= endOfDay) {
            todayServicesCount += 1;
            todayTotalBilled += price;
            todayCommissionEarned += comm;
          }

          // Si fue en el mes
          monthServicesCount += 1;
          monthTotalBilled += price;
          monthCommissionEarned += comm;
        }
      }

      return {
        id: barber.id,
        name: barber.name,
        phone: barber.phone,
        email: barber.email,
        pin: barber.pin,
        commissionRate: barber.commissionRate,
        chairNumber: barber.chairNumber,
        chairLabel: barber.chairLabel || `Silla ${barber.chairNumber || 1}`,
        active: barber.active,
        allowedServiceIds: parseStaffServices(barber.avatarUrl),
        createdAt: barber.createdAt,
        currentServing,
        stats: {
          today: {
            servicesCount: todayServicesCount,
            totalBilled: todayTotalBilled,
            commissionEarned: todayCommissionEarned,
            businessShare: todayTotalBilled - todayCommissionEarned,
          },
          month: {
            servicesCount: monthServicesCount,
            totalBilled: monthTotalBilled,
            commissionEarned: monthCommissionEarned,
            businessShare: monthTotalBilled - monthCommissionEarned,
          },
        },
        recentPayouts: barber.payouts,
      };
    });

    return NextResponse.json({
      success: true,
      business: currentBusiness
        ? {
            id: currentBusiness.id,
            name: currentBusiness.name,
            slug: currentBusiness.slug,
            currency: currentBusiness.currency,
            multiBarberEnabled: currentBusiness.multiBarberEnabled,
            isPro: isBusinessPro(currentBusiness),
            trial: getTrialStatus(currentBusiness),
          }
        : null,
      staff: enrichedStaff,
    });
  } catch (error) {
    console.error("Error al obtener equipo de barberos:", error);
    return NextResponse.json({ error: "Error en el servidor al cargar equipo" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const business = await getCurrentBusiness();
    const body = await req.json();
    const targetBusinessId = business?.id || body.businessId;

    if (!targetBusinessId) {
      return NextResponse.json({ error: "No autorizado o negocio no encontrado" }, { status: 401 });
    }

    // Comprobar si el negocio tiene Plan PRO o Período de Prueba activo para registrar más de 1 barbero
    const businessRecord = await prisma.business.findUnique({
      where: { id: targetBusinessId },
      select: { plan: true, stripeCurrentPeriodEnd: true, trialEndsAt: true },
    });

    const isPro = isBusinessPro(businessRecord);
    if (!isPro) {
      const activeStaffCount = await prisma.staffMember.count({
        where: { businessId: targetBusinessId, active: true },
      });
      if (activeStaffCount >= 1) {
        return NextResponse.json(
          {
            error: "El Plan FREE permite únicamente 1 barbero/silla. Para registrar barberos adicionales, comisiones individuales y turnero multi-silla, activa el Plan PRO o solicita una extensión de tu prueba.",
            requiresPro: true,
          },
          { status: 403 }
        );
      }
    }

    const { name, phone, email, pin, commissionRate, chairNumber, chairLabel } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "El nombre del barbero es obligatorio" }, { status: 400 });
    }

    const cleanPin = pin ? String(pin).trim() : "1234";
    const parsedCommission = typeof commissionRate === "number" ? commissionRate : parseFloat(commissionRate) || 50.0;
    const parsedChair = chairNumber ? parseInt(String(chairNumber), 10) : 1;

    const newBarber = await prisma.staffMember.create({
      data: {
        businessId: targetBusinessId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        pin: cleanPin,
        commissionRate: parsedCommission,
        chairNumber: parsedChair,
        chairLabel: chairLabel?.trim() || `Silla ${parsedChair}`,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      barber: newBarber,
    });
  } catch (error) {
    console.error("Error al registrar barbero:", error);
    return NextResponse.json({ error: "Error al guardar el nuevo barbero" }, { status: 500 });
  }
}
