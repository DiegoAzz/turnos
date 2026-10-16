import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBookingConfirmationUrl, cleanPhoneNumber } from "@/lib/whatsapp";

// Función auxiliar para sumar minutos a una hora "HH:mm"
function addMinutes(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(":").map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60);
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessSlug,
      serviceId,
      date, // Formato "YYYY-MM-DD"
      startTime, // Formato "HH:mm"
      clientName,
      clientPhone,
      clientEmail,
      clientNotes,
      appointmentType = "LOCAL",
      clientAddress,
      paymentMethod = "EFECTIVO",
    } = body;

    if (!businessSlug || !serviceId || !date || !startTime || !clientName || !clientPhone) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para agendar la cita." },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.active) {
      return NextResponse.json({ error: "Servicio no válido o inactivo." }, { status: 400 });
    }

    // Calcular hora de fin según duración del servicio
    const endTime = addMinutes(startTime, service.durationMinutes);

    // Parsear fecha
    const appointmentDate = new Date(`${date}T00:00:00.000Z`);

    // Validar si existe colisión de intervalos con citas ya reservadas
    function toMinutes(t: string): number {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    }

    const reqStartMin = toMinutes(startTime);
    const reqEndMin = toMinutes(endTime);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: appointmentDate,
        status: { not: "CANCELLED" },
      },
    });

    const hasCollision = existingAppointments.some((app) => {
      const appStartMin = toMinutes(app.startTime);
      const appEndMin = toMinutes(app.endTime);
      return reqStartMin < appEndMin && reqEndMin > appStartMin;
    });

    if (hasCollision) {
      return NextResponse.json(
        { error: "Este horario se cruza con otra cita ya reservada. Por favor elige otro horario." },
        { status: 409 }
      );
    }

    const formattedPhone = cleanPhoneNumber(clientPhone);

    // Crear cita con tipo (LOCAL o DOMICILIO) y dirección
    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        serviceId: service.id,
        clientName,
        clientPhone: formattedPhone,
        clientEmail: clientEmail || null,
        clientNotes: clientNotes || null,
        appointmentType: appointmentType === "DOMICILIO" ? "DOMICILIO" : "LOCAL",
        clientAddress: clientAddress || null,
        paymentMethod: paymentMethod || "EFECTIVO",
        date: appointmentDate,
        startTime,
        endTime,
        status: "CONFIRMED",
      },
      include: {
        service: true,
        business: true,
      },
    });

    // Calcular posición y número de turno para el día según orden de hora
    const allAppointmentsDay = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: appointmentDate,
        status: { not: "CANCELLED" },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    const turnIndex = allAppointmentsDay.findIndex((app) => app.id === appointment.id);
    const turnNumber = turnIndex !== -1 ? turnIndex + 1 : allAppointmentsDay.length;
    const aheadCount = Math.max(0, turnNumber - 1);

    // Dirección a mostrar en el comprobante: si es a domicilio, la del cliente; si no, la del local
    const displayAddress =
      appointmentType === "DOMICILIO" && clientAddress
        ? `${clientAddress} (A Domicilio)`
        : business.address;

    // Generar enlace de WhatsApp para confirmación inmediata con link de reagendamiento y turno asignado
    const whatsappUrl = generateBookingConfirmationUrl({
      phone: formattedPhone,
      clientName,
      serviceName: service.name,
      businessName: business.name,
      dateStr: date,
      timeStr: `${startTime} a ${endTime}`,
      address: displayAddress,
      rescheduleUrl: `https://turnos.appzplay.online/p/${business.slug}`,
      turnNumber,
    });

    return NextResponse.json({
      success: true,
      appointment,
      turnNumber,
      aheadCount,
      totalTurnsDay: allAppointmentsDay.length,
      whatsappUrl,
    });
  } catch (error) {
    console.error("Error al crear cita:", error);
    return NextResponse.json(
      { error: "Error interno al procesar la reserva." },
      { status: 500 }
    );
  }
}
