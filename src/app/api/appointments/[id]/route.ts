import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReminderUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, reminderSent } = body;

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (typeof reminderSent === "boolean") dataToUpdate.reminderSent = reminderSent;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: dataToUpdate,
      include: {
        service: true,
        business: true,
      },
    });

    let reminderUrl = null;
    if (appointment.clientPhone) {
      reminderUrl = generateReminderUrl({
        phone: appointment.clientPhone,
        clientName: appointment.clientName,
        serviceName: appointment.service.name,
        businessName: appointment.business.name,
        timeStr: appointment.startTime,
        dateStr: appointment.date.toISOString().split("T")[0],
      });
    }

    return NextResponse.json({
      success: true,
      appointment,
      reminderUrl,
    });
  } catch (error) {
    console.error("Error al actualizar cita:", error);
    return NextResponse.json(
      { error: "Error al actualizar la cita" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar cita:", error);
    return NextResponse.json(
      { error: "Error al eliminar la cita" },
      { status: 500 }
    );
  }
}
