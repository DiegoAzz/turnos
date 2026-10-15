import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, autoRemindersEnabled, reminderTiming, reminderMessageTemplate } = body;

    if (!businessId) {
      return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (typeof autoRemindersEnabled === "boolean") {
      dataToUpdate.autoRemindersEnabled = autoRemindersEnabled;
    }
    if (reminderTiming) {
      dataToUpdate.reminderTiming = reminderTiming;
    }
    if (reminderMessageTemplate !== undefined) {
      dataToUpdate.reminderMessageTemplate = reminderMessageTemplate;
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error) {
    console.error("Error al guardar configuración de recordatorios:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
