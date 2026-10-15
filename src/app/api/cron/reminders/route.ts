import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReminderUrl } from "@/lib/whatsapp";
import { sendLabsMobileSms } from "@/lib/sms";
import { verifyAdminSession } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

function parseReminderTimingMinutes(timingStr?: string): number {
  if (!timingStr) return 15;
  if (timingStr === "15_MINUTES_BEFORE") return 15;
  if (timingStr === "30_MINUTES_BEFORE") return 30;
  if (timingStr === "1_HOUR_BEFORE") return 60;
  if (timingStr === "2_HOURS_BEFORE") return 120;
  if (timingStr === "24_HOURS_BEFORE") return 1440;
  if (timingStr.startsWith("CUSTOM_")) {
    const parts = timingStr.split("_");
    const val = parseInt(parts[1], 10) || 15;
    const unit = parts[2] || "MINUTES";
    if (unit === "HOURS") return val * 60;
    if (unit === "DAYS") return val * 1440;
    return val;
  }
  return 15;
}

export async function GET(req: NextRequest) {
  try {
    // Protección de seguridad para el Cron: autorizar solo si tiene CRON_SECRET o si es admin autenticado
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    const querySecret = new URL(req.url).searchParams.get("secret");
    const isAdmin = await verifyAdminSession();

    if (cronSecret) {
      const isAuthorized =
        authHeader === `Bearer ${cronSecret}` ||
        querySecret === cronSecret ||
        isAdmin;

      if (!isAuthorized) {
        return NextResponse.json({ error: "No autorizado para ejecutar el cron de recordatorios." }, { status: 401 });
      }
    }

    const now = new Date();
    // Consultar citas de hoy con recordatorio no enviado y estado confirmado/pendiente
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
        reminderSent: false,
        status: { notIn: ["CANCELLED", "COMPLETED"] },
        business: {
          autoRemindersEnabled: true,
          active: true,
        },
      },
      include: {
        business: true,
        service: true,
      },
    });

    const dueReminders: any[] = [];

    for (const app of appointments) {
      const targetMinutes = parseReminderTimingMinutes(app.business.reminderTiming);
      
      const [hStr, mStr] = app.startTime.trim().split(":");
      let hours = parseInt(hStr, 10);
      const mins = parseInt(mStr, 10) || 0;
      if (app.startTime.toUpperCase().includes("PM") && hours < 12) hours += 12;
      if (app.startTime.toUpperCase().includes("AM") && hours === 12) hours = 0;

      const appDateTime = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, mins, 0)
      );

      const diffMs = appDateTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      // Si la cita está dentro de la ventana de anticipación
      if (diffMinutes <= targetMinutes && diffMinutes >= -30) {
        const appAddress =
          app.appointmentType === "DOMICILIO"
            ? app.clientAddress
            : app.business.address;

        const reminderUrl = app.clientPhone
          ? generateReminderUrl({
              phone: app.clientPhone,
              clientName: app.clientName,
              serviceName: app.service.name,
              businessName: app.business.name,
              timeStr: `${app.startTime} - ${app.endTime}`,
              dateStr: "Hoy",
              address: appAddress,
              rescheduleUrl: `https://turnos.appzplay.online/p/${app.business.slug}`,
            })
          : null;

        let smsStatus = "NOT_CONFIGURED";

        // Si el negocio activó SMS automáticos con LabsMobile, disparar el SMS silencioso de inmediato
        if (app.business.smsEnabled && app.business.smsApiToken && app.clientPhone) {
          const smsText = `Hola ${app.clientName}, te recordamos tu cita hoy a las ${app.startTime} en ${app.business.name}. Reagendar: https://turnos.appzplay.online/p/${app.business.slug}`;
          const smsRes = await sendLabsMobileSms({
            username: app.business.smsUsername,
            apiToken: app.business.smsApiToken,
            senderId: app.business.smsSenderId || "TurnoYa",
            phone: app.clientPhone,
            message: smsText,
          });

          if (smsRes.success) {
            await prisma.appointment.update({
              where: { id: app.id },
              data: { reminderSent: true },
            });
            smsStatus = "SENT_AUTOMATICALLY";
          } else {
            smsStatus = `ERROR: ${smsRes.error}`;
          }
        }

        dueReminders.push({
          appointmentId: app.id,
          clientName: app.clientName,
          clientPhone: app.clientPhone,
          businessName: app.business.name,
          startTime: app.startTime,
          diffMinutes,
          targetMinutes,
          smsStatus,
          reminderUrl,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      pendingDueCount: dueReminders.length,
      dueReminders,
    });
  } catch (error) {
    console.error("Error al procesar cron de recordatorios:", error);
    return NextResponse.json(
      { error: "Error en el cron de recordatorios" },
      { status: 500 }
    );
  }
}
