import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayUtcRange, getLocalNow } from "@/lib/date-utils";
import { generateNowCallingNotificationUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get("businessId");
    const staffId = req.nextUrl.searchParams.get("staffId");

    if (!businessId || !staffId) {
      return NextResponse.json({ error: "businessId y staffId requeridos" }, { status: 400 });
    }

    const { startOfDay, endOfDay } = getTodayUtcRange();

    // Obtener información del barbero
    const barber = await prisma.staffMember.findUnique({
      where: { id: staffId },
    });

    if (!barber || !barber.active) {
      return NextResponse.json({ error: "Barbero no encontrado o inactivo" }, { status: 404 });
    }

    // 1. Turno actual en la silla de este barbero (IN_PROGRESS asignado a este barbero)
    const currentServing = await prisma.appointment.findFirst({
      where: {
        businessId,
        date: { gte: startOfDay, lte: endOfDay },
        status: "IN_PROGRESS",
        staffMemberId: staffId,
      },
      include: {
        service: true,
      },
    });

    // 2. Fila general de espera (CONFIRMED / PENDING no atendidos aún)
    const waitingList = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ["CONFIRMED", "PENDING"] },
        // O no tiene barbero asignado, o está asignado específicamente a este barbero
        OR: [{ staffMemberId: null }, { staffMemberId: staffId }],
      },
      include: {
        service: true,
      },
      orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
    });

    // 3. Cortes completados hoy por este barbero para sus finanzas personales
    const completedToday = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: startOfDay, lte: endOfDay },
        status: "COMPLETED",
        staffMemberId: staffId,
      },
      include: {
        service: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Cortes del mes actual para el acumulado
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const completedMonth = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: startOfMonth },
        status: "COMPLETED",
        staffMemberId: staffId,
      },
      include: {
        service: true,
      },
    });

    const rate = (barber.commissionRate || 50) / 100;

    let todayBilled = 0;
    completedToday.forEach((app) => {
      todayBilled += app.service?.price || 0;
    });
    const todayCommission = todayBilled * rate;

    let monthBilled = 0;
    completedMonth.forEach((app) => {
      monthBilled += app.service?.price || 0;
    });
    const monthCommission = monthBilled * rate;

    return NextResponse.json({
      success: true,
      barber: {
        id: barber.id,
        name: barber.name,
        chairNumber: barber.chairNumber,
        chairLabel: barber.chairLabel || `Silla ${barber.chairNumber || 1}`,
        commissionRate: barber.commissionRate,
      },
      currentServing,
      waitingCount: waitingList.length,
      waitingList,
      stats: {
        todayServices: completedToday.length,
        todayBilled,
        todayCommission,
        todayBusinessShare: todayBilled - todayCommission,
        monthServices: completedMonth.length,
        monthBilled,
        monthCommission,
      },
      completedHistory: completedToday.map((app) => ({
        id: app.id,
        clientName: app.clientName,
        clientPhone: app.clientPhone,
        serviceName: app.service?.name,
        price: app.service?.price || 0,
        myCommission: (app.service?.price || 0) * rate,
        time: app.startTime,
        completedAt: app.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error al obtener cola del barbero:", error);
    return NextResponse.json({ error: "Error al cargar datos de la silla" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, businessId, staffId, appointmentId } = body;

    if (!businessId || !staffId || !action) {
      return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 });
    }

    const { startOfDay, endOfDay } = getTodayUtcRange();

    const barber = await prisma.staffMember.findUnique({
      where: { id: staffId },
    });

    if (!barber) {
      return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    // 1. LLAMAR SIGUIENTE A MI SILLA
    if (action === "CALL_NEXT") {
      // Verificar si la silla de este barbero ya está ocupada
      const myActiveTurn = await prisma.appointment.findFirst({
        where: {
          businessId,
          date: { gte: startOfDay, lte: endOfDay },
          status: "IN_PROGRESS",
          staffMemberId: staffId,
        },
      });

      if (myActiveTurn) {
        return NextResponse.json(
          {
            error: `Tu silla ya está ocupada atendiendo a ${myActiveTurn.clientName}. Debes pulsar "Terminar Corte" antes de llamar al siguiente.`,
          },
          { status: 400 }
        );
      }

      // Buscar el siguiente turno disponible en espera
      const nextTurn = await prisma.appointment.findFirst({
        where: {
          businessId,
          date: { gte: startOfDay, lte: endOfDay },
          status: { in: ["CONFIRMED", "PENDING"] },
          OR: [{ staffMemberId: null }, { staffMemberId: staffId }],
        },
        include: { service: true },
        orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
      });

      if (!nextTurn) {
        return NextResponse.json({
          success: true,
          message: "No hay clientes esperando en la fila en este momento.",
          calledAppointment: null,
        });
      }

      const updated = await prisma.appointment.update({
        where: { id: nextTurn.id },
        data: {
          status: "IN_PROGRESS",
          staffMemberId: staffId,
        },
        include: { service: true },
      });

      let whatsappUrl = null;
      if (updated.clientPhone && business) {
        whatsappUrl = generateNowCallingNotificationUrl({
          phone: updated.clientPhone,
          clientName: updated.clientName,
          serviceName: updated.service.name,
          businessName: `${business.name} (${barber.chairLabel || "Silla 1"})`,
          turnNumber: updated.startTime,
        });
      }

      return NextResponse.json({
        success: true,
        calledAppointment: updated,
        whatsappUrl,
      });
    }

    // 2. LLAMAR A UN TURNO ESPECÍFICO A MI SILLA
    if (action === "CALL_SPECIFIC") {
      if (!appointmentId) {
        return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 });
      }

      const myActiveTurn = await prisma.appointment.findFirst({
        where: {
          businessId,
          date: { gte: startOfDay, lte: endOfDay },
          status: "IN_PROGRESS",
          staffMemberId: staffId,
          id: { not: appointmentId },
        },
      });

      if (myActiveTurn) {
        return NextResponse.json(
          {
            error: `Tu silla ya está ocupada atendiendo a ${myActiveTurn.clientName}. Debes finalizar ese servicio primero.`,
          },
          { status: 400 }
        );
      }

      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "IN_PROGRESS",
          staffMemberId: staffId,
        },
        include: { service: true },
      });

      let whatsappUrl = null;
      if (updated.clientPhone && business) {
        whatsappUrl = generateNowCallingNotificationUrl({
          phone: updated.clientPhone,
          clientName: updated.clientName,
          serviceName: updated.service.name,
          businessName: `${business.name} (${barber.chairLabel || "Silla 1"})`,
          turnNumber: updated.startTime,
        });
      }

      return NextResponse.json({
        success: true,
        calledAppointment: updated,
        whatsappUrl,
      });
    }

    // 3. FINALIZAR CORTE / SERVICIO
    if (action === "COMPLETE_SERVICE") {
      let targetId = appointmentId;
      if (!targetId) {
        const inProgress = await prisma.appointment.findFirst({
          where: {
            businessId,
            date: { gte: startOfDay, lte: endOfDay },
            status: "IN_PROGRESS",
            staffMemberId: staffId,
          },
        });
        targetId = inProgress?.id;
      }

      if (!targetId) {
        return NextResponse.json({ error: "No tienes ningún turno activo en tu silla para finalizar" }, { status: 400 });
      }

      const completed = await prisma.appointment.update({
        where: { id: targetId },
        data: {
          status: "COMPLETED",
          staffMemberId: staffId,
        },
        include: { service: true },
      });

      return NextResponse.json({
        success: true,
        message: "Corte finalizado exitosamente. Comisión sumada a tus finanzas.",
        completed,
      });
    }

    // 4. POSPONER TURNO
    if (action === "POSTPONE") {
      let targetId = appointmentId;
      if (!targetId) {
        const inProgress = await prisma.appointment.findFirst({
          where: {
            businessId,
            date: { gte: startOfDay, lte: endOfDay },
            status: "IN_PROGRESS",
            staffMemberId: staffId,
          },
        });
        targetId = inProgress?.id;
      }

      if (targetId) {
        await prisma.appointment.update({
          where: { id: targetId },
          data: {
            status: "CONFIRMED",
            clientNotes: "POSPUESTO_EN_SALA",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Turno pospuesto a la lista de espera.",
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    console.error("Error en acción de barbero:", error);
    return NextResponse.json({ error: "Error al procesar la acción en la silla" }, { status: 500 });
  }
}
