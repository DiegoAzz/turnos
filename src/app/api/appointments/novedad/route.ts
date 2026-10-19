import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointmentId, reason, cancelledBy = "CLIENT" } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId requerido" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        business: true,
        service: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const cleanReason = reason ? String(reason).trim() : "Imprevisto personal";

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        cancelledBy: cancelledBy === "BUSINESS" ? "BUSINESS" : "CLIENT",
        cancellationReason: cleanReason,
      },
      include: {
        business: true,
        service: true,
      },
    });

    const dateFormatted = new Date(appointment.date).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let notifyUrl = "";
    let notifyMessage = "";

    if (cancelledBy === "CLIENT") {
      // Notificar al negocio / manicurista por WhatsApp
      const bPhone = appointment.business.phone?.replace(/[^0-9]/g, "") || "";
      notifyMessage = `Hola *${appointment.business.name}*, te escribe *${appointment.clientName}*.
Lamentablemente tengo una novedad y debo cancelar mi cita de *${appointment.service.name}* programada para el *${dateFormatted}* a las *${appointment.startTime}*.

*Motivo de la novedad:* ${cleanReason}

Mil disculpas por el imprevisto. ¡Espero reprogramar pronto con ustedes! 🙏`;

      if (bPhone) {
        notifyUrl = `https://wa.me/${bPhone}?text=${encodeURIComponent(notifyMessage)}`;
      }
    } else {
      // Notificar al cliente por WhatsApp
      const cPhone = appointment.clientPhone?.replace(/[^0-9]/g, "") || "";
      notifyMessage = `Hola *${appointment.clientName}*, te saludamos de *${appointment.business.name}*.
Lamentamos mucho informarte que debido a una novedad de fuerza mayor (*${cleanReason}*), debemos cancelar/reprogramar tu cita de *${appointment.service.name}* del *${dateFormatted}* a las *${appointment.startTime}*.

Nos encantaría reagendarte con prioridad en cuanto te sea posible. Por favor responde a este mensaje para coordinar tu nuevo espacio. ¡Muchas gracias por tu comprensión! ❤️`;

      if (cPhone) {
        notifyUrl = `https://wa.me/${cPhone}?text=${encodeURIComponent(notifyMessage)}`;
      }
    }

    return NextResponse.json({
      success: true,
      appointment: updated,
      notifyUrl,
      notifyMessage,
    });
  } catch (error) {
    console.error("Error al reportar novedad de cita:", error);
    return NextResponse.json({ error: "Error al reportar la novedad" }, { status: 500 });
  }
}
