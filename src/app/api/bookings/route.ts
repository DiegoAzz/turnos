import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBookingConfirmationUrl } from "@/lib/whatsapp";

// Función auxiliar para sumar minutos a una hora "HH:mm"
function addMinutes(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(":").map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60);
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
}

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

    // Validar si ya existe una cita en el mismo horario que no esté cancelada
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        businessId: business.id,
        date: appointmentDate,
        startTime,
        status: { not: "CANCELLED" },
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: "Este horario ya ha sido reservado por otro cliente. Por favor elige otro." },
        { status: 409 }
      );
    }

    // Crear cita
    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        serviceId: service.id,
        clientName,
        clientPhone,
        clientEmail: clientEmail || null,
        clientNotes: clientNotes || null,
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

    // Generar enlace de WhatsApp para confirmación inmediata
    const whatsappUrl = generateBookingConfirmationUrl({
      phone: clientPhone,
      clientName,
      serviceName: service.name,
      businessName: business.name,
      dateStr: date,
      timeStr: `${startTime} a ${endTime}`,
      address: business.address,
    });

    return NextResponse.json({
      success: true,
      appointment,
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
