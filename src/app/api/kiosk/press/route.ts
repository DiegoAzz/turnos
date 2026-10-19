import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Función central para procesar pulsación de botón físico o virtual
async function processButtonAction(
  businessIdentifier: { slug?: string; id?: string },
  rawAction: string,
  pin?: string | null
) {
  const business = await prisma.business.findFirst({
    where: {
      OR: [
        businessIdentifier.id ? { id: businessIdentifier.id } : undefined,
        businessIdentifier.slug ? { slug: businessIdentifier.slug } : undefined,
        businessIdentifier.slug ? { slug: { equals: businessIdentifier.slug, mode: "insensitive" } } : undefined,
      ].filter(Boolean) as any,
    },
  });

  if (!business) {
    return { error: "Negocio no encontrado", status: 404 };
  }

  // Validar PIN de hardware si está configurado
  if (business.stationHardwarePin && business.stationHardwarePin !== "0000") {
    if (pin !== business.stationHardwarePin) {
      return { error: "PIN de hardware inválido", status: 403 };
    }
  }

  // Normalizar acción según color de botón del módulo físico (Verde, Amarillo, Rojo)
  let action = rawAction.toUpperCase();
  if (action === "GREEN" || action === "VERDE") action = "COMPLETE_AND_NEXT";
  if (action === "YELLOW" || action === "AMARILLO") action = "PAUSE";
  if (action === "RED" || action === "ROJO") action = "CANCEL_NO_SHOW";

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // BOTÓN AMARILLO: PAUSA / ALMUERZO
  if (action === "PAUSE") {
    const newStatus = business.liveStatus === "LUNCH" ? "OPEN" : "LUNCH";
    await prisma.business.update({
      where: { id: business.id },
      data: { liveStatus: newStatus },
    });
    return {
      success: true,
      buttonColor: "YELLOW",
      action: "PAUSE",
      liveStatus: newStatus,
      message: newStatus === "LUNCH" ? "Negocio en Pausa/Almuerzo" : "Negocio Abierto de Nuevo",
    };
  }

  // Obtener citas activas de hoy
  const todayAppointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    include: { service: true },
    orderBy: { startTime: "asc" },
  });

  const currentInProgress = todayAppointments.find((a) => a.status === "IN_PROGRESS");
  let completedAppointment = null;
  let cancelledAppointment = null;
  let nextAppointment = null;

  // BOTÓN ROJO: CANCELAR O CLIENTE NO LLEGÓ
  if (action === "CANCEL_NO_SHOW") {
    if (currentInProgress) {
      cancelledAppointment = await prisma.appointment.update({
        where: { id: currentInProgress.id },
        data: {
          status: "CANCELLED",
          cancelledBy: "BUSINESS",
          cancellationReason: "Cliente no se presentó / Cancelado desde botonera",
        },
        include: { service: true },
      });
    }
  }

  // BOTÓN VERDE: COMPLETAR SERVICIO ACTUAL
  if (action === "COMPLETE_AND_NEXT") {
    if (currentInProgress) {
      completedAppointment = await prisma.appointment.update({
        where: { id: currentInProgress.id },
        data: { status: "COMPLETED" },
        include: { service: true },
      });

      // Registrar visita en CRM
      try {
        await prisma.customer.updateMany({
          where: {
            businessId: business.id,
            phone: currentInProgress.clientPhone,
          },
          data: {
            totalVisits: { increment: 1 },
            totalSpent: {
              increment: (currentInProgress.service?.price || 0) + (currentInProgress.homeFee || 0),
            },
          },
        });
      } catch (_) {}
    }
  }

  // En ambos casos (Verde o Rojo o si no había nadie en progreso): Llamar al siguiente cliente en espera
  const pendingList = todayAppointments.filter(
    (a) =>
      (a.status === "CONFIRMED" || a.status === "PENDING") &&
      a.id !== currentInProgress?.id
  );

  if (pendingList.length > 0) {
    const nextCandidate = pendingList[0];
    nextAppointment = await prisma.appointment.update({
      where: { id: nextCandidate.id },
      data: { status: "IN_PROGRESS" },
      include: { service: true },
    });
  }

  return {
    success: true,
    buttonColor: action === "CANCEL_NO_SHOW" ? "RED" : "GREEN",
    action,
    completedAppointment: completedAppointment
      ? {
          id: completedAppointment.id,
          clientName: completedAppointment.clientName,
          serviceName: completedAppointment.service?.name,
          startTime: completedAppointment.startTime,
        }
      : null,
    cancelledAppointment: cancelledAppointment
      ? {
          id: cancelledAppointment.id,
          clientName: cancelledAppointment.clientName,
          serviceName: cancelledAppointment.service?.name,
          startTime: cancelledAppointment.startTime,
        }
      : null,
    nextAppointment: nextAppointment
      ? {
          id: nextAppointment.id,
          clientName: nextAppointment.clientName,
          serviceName: nextAppointment.service?.name,
          startTime: nextAppointment.startTime,
        }
      : null,
    remainingInQueue: Math.max(0, pendingList.length - 1),
    message: nextAppointment
      ? `¡Llamando a ${nextAppointment.clientName}! (${nextAppointment.startTime} - ${nextAppointment.service?.name})`
      : "No hay más clientes en espera para hoy.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessSlug, businessId, action = "COMPLETE_AND_NEXT", btn, pin } = body;

    const chosenAction = btn || action;
    const result = await processButtonAction(
      { slug: businessSlug, id: businessId },
      chosenAction,
      pin
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en POST de botonera:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

// GET soporta tanto consultar cola de espera como disparar botón desde ESP32 / Arduino con una sola URL HTTP
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || searchParams.get("businessSlug");
    const id = searchParams.get("id") || searchParams.get("businessId");
    const btn = searchParams.get("btn") || searchParams.get("button") || searchParams.get("action");
    const pin = searchParams.get("pin");

    // Si viene con parámetro 'btn' (ej: ?slug=barberia&btn=green o btn=yellow o btn=red), procesa la pulsación física
    if (btn) {
      const result = await processButtonAction({ slug: slug || undefined, id: id || undefined }, btn, pin);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status || 400 });
      }
      return NextResponse.json(result);
    }

    // Si no viene con botón, retorna el estado actual de la estación / turnero
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          id ? { id } : undefined,
          slug ? { slug } : undefined,
          slug ? { slug: { equals: slug, mode: "insensitive" } } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: { service: true },
      orderBy: { startTime: "asc" },
    });

    const inProgress = appointments.find((a) => a.status === "IN_PROGRESS") || null;
    const waiting = appointments.filter((a) => a.status === "CONFIRMED" || a.status === "PENDING");
    const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        liveStatus: business.liveStatus,
      },
      inProgress,
      nextWaiting: waiting[0] || null,
      waitingQueue: waiting,
      waitingCount: waiting.length,
      completedCount,
    });
  } catch (error) {
    console.error("Error al consultar Kiosk:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
