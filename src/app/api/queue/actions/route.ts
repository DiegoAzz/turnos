import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-business";
import {
  generatePostponedNotificationUrl,
  generateNowCallingNotificationUrl,
} from "@/lib/whatsapp";
import { getLocalNow, getTodayUtcRange } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

function getTodayRange(dateStrParam?: string | null) {
  return getTodayUtcRange("America/Bogota", dateStrParam);
}

function getCurrentTimeFormatted(): string {
  return getLocalNow("America/Bogota").timeStr;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, businessId, appointmentId, autoCallNext, clientName, clientPhone, serviceId, startImmediately } = body;

    // Verificar sesión del negocio actual o businessId válido
    let business = await getCurrentBusiness();
    if (!business && businessId) {
      business = await prisma.business.findUnique({
        where: { id: businessId },
      });
    }

    if (!business) {
      return NextResponse.json(
        { error: "No autorizado o negocio no encontrado." },
        { status: 401 }
      );
    }

    const { dateStr, startOfDay, endOfDay } = getTodayRange();

    // 1. LLAMAR SIGUIENTE EN FILA
    if (action === "CALL_NEXT") {
      // Verificar si ya hay un turno en atención en la silla
      const activeInProgress = await prisma.appointment.findFirst({
        where: {
          businessId: business.id,
          date: { gte: startOfDay, lte: endOfDay },
          status: "IN_PROGRESS",
        },
      });

      if (activeInProgress) {
        return NextResponse.json(
          {
            error: `La silla ya está ocupada atendiendo a ${activeInProgress.clientName}. Debes hacer clic en "Terminar Servicio" para finalizar el turno actual antes de llamar al siguiente.`,
          },
          { status: 400 }
        );
      }

      // Encontrar el siguiente turno confirmado o pendiente
      const nextAppointment = await prisma.appointment.findFirst({
        where: {
          businessId: business.id,
          date: { gte: startOfDay, lte: endOfDay },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        include: { service: true },
        orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
      });

      if (!nextAppointment) {
        return NextResponse.json({
          success: true,
          message: "No hay más turnos en espera por hoy.",
          calledAppointment: null,
        });
      }

      const updated = await prisma.appointment.update({
        where: { id: nextAppointment.id },
        data: { status: "IN_PROGRESS" },
        include: { service: true },
      });

      let whatsappUrl = null;
      if (updated.clientPhone) {
        whatsappUrl = generateNowCallingNotificationUrl({
          phone: updated.clientPhone,
          clientName: updated.clientName,
          serviceName: updated.service.name,
          businessName: business.name,
          turnNumber: updated.startTime,
        });
      }

      return NextResponse.json({
        success: true,
        calledAppointment: updated,
        whatsappUrl,
      });
    }

    // 2. LLAMAR A UN TURNO ESPECÍFICO
    if (action === "CALL_SPECIFIC") {
      if (!appointmentId) {
        return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 });
      }

      // Validar si la silla ya está ocupada por otro turno en atención
      const activeInProgress = await prisma.appointment.findFirst({
        where: {
          businessId: business.id,
          date: { gte: startOfDay, lte: endOfDay },
          status: "IN_PROGRESS",
          id: { not: appointmentId },
        },
      });

      if (activeInProgress) {
        return NextResponse.json(
          {
            error: `La silla ya está ocupada atendiendo a ${activeInProgress.clientName}. Debes finalizar el servicio actual ("Terminar Servicio") antes de poder atender a otro cliente.`,
          },
          { status: 400 }
        );
      }

      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "IN_PROGRESS" },
        include: { service: true },
      });

      let whatsappUrl = null;
      if (updated.clientPhone) {
        whatsappUrl = generateNowCallingNotificationUrl({
          phone: updated.clientPhone,
          clientName: updated.clientName,
          serviceName: updated.service.name,
          businessName: business.name,
          turnNumber: updated.startTime,
        });
      }

      return NextResponse.json({
        success: true,
        calledAppointment: updated,
        whatsappUrl,
      });
    }

    // 3. POSPONER (CLIENTE DIGITAL O LLAMADO QUE NO HA LLEGADO A LA SALA)
    if (action === "POSTPONE") {
      let targetId = appointmentId;

      // Si no se envió ID, posponer al que esté actualmente en progreso
      if (!targetId) {
        const inProgress = await prisma.appointment.findFirst({
          where: {
            businessId: business.id,
            date: { gte: startOfDay, lte: endOfDay },
            status: "IN_PROGRESS",
          },
        });
        targetId = inProgress?.id;
      }

      if (!targetId) {
        return NextResponse.json(
          { error: "No hay ningún turno seleccionado o en progreso para posponer." },
          { status: 400 }
        );
      }

      const postponedApp = await prisma.appointment.update({
        where: { id: targetId },
        data: { status: "POSTPONED" },
        include: { service: true },
      });

      // Generar link de WhatsApp para avisar al cliente retrasado
      let whatsappNoticeUrl = null;
      if (postponedApp.clientPhone) {
        whatsappNoticeUrl = generatePostponedNotificationUrl({
          phone: postponedApp.clientPhone,
          clientName: postponedApp.clientName,
          serviceName: postponedApp.service.name,
          businessName: business.name,
          turnNumber: postponedApp.startTime,
          turneroUrl: `https://turnos.appzplay.online/p/${business.slug}/turnero`,
        });
      }

      // Si autoCallNext es true, llamar de inmediato al siguiente en fila para no perder tiempo
      let nextCalled = null;
      if (autoCallNext) {
        const next = await prisma.appointment.findFirst({
          where: {
            businessId: business.id,
            date: { gte: startOfDay, lte: endOfDay },
            status: { in: ["CONFIRMED", "PENDING"] },
          },
          include: { service: true },
          orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
        });

        if (next) {
          nextCalled = await prisma.appointment.update({
            where: { id: next.id },
            data: { status: "IN_PROGRESS" },
            include: { service: true },
          });
        }
      }

      return NextResponse.json({
        success: true,
        postponedAppointment: postponedApp,
        whatsappNoticeUrl,
        nextCalled,
      });
    }

    // 4. REINCORPORAR POSPUESTO
    if (action === "RECALL_POSTPONED") {
      if (!appointmentId) {
        return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 });
      }

      if (startImmediately) {
        const activeInProgress = await prisma.appointment.findFirst({
          where: {
            businessId: business.id,
            date: { gte: startOfDay, lte: endOfDay },
            status: "IN_PROGRESS",
            id: { not: appointmentId },
          },
        });

        if (activeInProgress) {
          return NextResponse.json(
            {
              error: `La silla ya está ocupada atendiendo a ${activeInProgress.clientName}. Debes finalizar el servicio actual antes de llamar a este cliente a la silla. O puedes usar "Reincorporar a Fila" para dejarlo en espera.`,
            },
            { status: 400 }
          );
        }
      }

      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: startImmediately ? "IN_PROGRESS" : "CONFIRMED",
        },
        include: { service: true },
      });

      return NextResponse.json({
        success: true,
        appointment: updated,
      });
    }

    // 5. COMPLETAR SERVICIO ACTUAL
    if (action === "COMPLETE_CURRENT") {
      let targetId = appointmentId;
      if (!targetId) {
        const inProgress = await prisma.appointment.findFirst({
          where: {
            businessId: business.id,
            date: { gte: startOfDay, lte: endOfDay },
            status: "IN_PROGRESS",
          },
        });
        targetId = inProgress?.id;
      }

      if (targetId) {
        await prisma.appointment.update({
          where: { id: targetId },
          data: { status: "COMPLETED" },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Servicio finalizado con éxito.",
      });
    }

    // 6. AÑADIR TURNO PRESENCIAL (WALK-IN) CON 1 TOQUE
    if (action === "ADD_WALK_IN") {
      const nowTime = getCurrentTimeFormatted();

      // Buscar servicio por defecto si no se especificó
      let chosenServiceId = serviceId;
      if (!chosenServiceId) {
        const defaultService = await prisma.service.findFirst({
          where: { businessId: business.id, active: true },
          orderBy: { createdAt: "asc" },
        });
        chosenServiceId = defaultService?.id;
      }

      if (!chosenServiceId) {
        return NextResponse.json(
          { error: "No hay servicios disponibles en el negocio para asignar." },
          { status: 400 }
        );
      }

      const service = await prisma.service.findUnique({
        where: { id: chosenServiceId },
      });

      // Si se solicita atender de inmediato, verificar que la silla no esté ocupada
      let finalStatus = "CONFIRMED";
      if (startImmediately) {
        const activeInProgress = await prisma.appointment.findFirst({
          where: {
            businessId: business.id,
            date: { gte: startOfDay, lte: endOfDay },
            status: "IN_PROGRESS",
          },
        });

        if (activeInProgress) {
          return NextResponse.json(
            {
              error: `La silla ya está ocupada atendiendo a ${activeInProgress.clientName}. Desmarca "Atender de inmediato" para que el cliente quede en la lista de espera, o finaliza el servicio actual primero.`,
            },
            { status: 400 }
          );
        }
        finalStatus = "IN_PROGRESS";
      }

      const appointment = await prisma.appointment.create({
        data: {
          businessId: business.id,
          serviceId: chosenServiceId,
          clientName: clientName?.trim() || "Cliente en Sala",
          clientPhone: clientPhone?.trim() || "Presencial",
          appointmentType: "WALK_IN",
          date: startOfDay,
          startTime: nowTime,
          endTime: nowTime,
          status: finalStatus,
        },
        include: { service: true },
      });

      return NextResponse.json({
        success: true,
        appointment,
      });
    }

    // 7. CANCELAR TURNO
    if (action === "CANCEL_TURN") {
      if (!appointmentId) {
        return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 });
      }

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json({
        success: true,
        message: "Turno cancelado.",
      });
    }

    // 8. BLOQUEAR CLIENTE / LISTA NEGRA ANTI-SPAM
    if (action === "BLOCK_CLIENT") {
      if (!appointmentId) {
        return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 });
      }

      const target = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!target) {
        return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
      }

      // Marcar el turno y todas las citas activas de este teléfono como BLOQUEADAS
      await prisma.appointment.updateMany({
        where: {
          businessId: business.id,
          clientPhone: target.clientPhone,
          status: { in: ["CONFIRMED", "PENDING", "POSTPONED"] },
        },
        data: { status: "BLOCKED" },
      });

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "BLOCKED" },
      });

      return NextResponse.json({
        success: true,
        message: `El cliente con teléfono ${target.clientPhone} ha sido bloqueado y no podrá volver a solicitar turnos en este establecimiento.`,
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    console.error("Error en queue actions:", error);
    return NextResponse.json(
      { error: "Error procesando la acción del turnero." },
      { status: 500 }
    );
  }
}
