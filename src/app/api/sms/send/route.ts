import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLabsMobileSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, phone, message, testMode, customToken, customUsername, customSender } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Se requiere teléfono y mensaje para enviar el SMS." },
        { status: 400 }
      );
    }

    let username = customUsername || "director@appzplay.online";
    let apiToken = customToken;
    let senderId = customSender || "TurnoYa";

    // Si pasaron businessId y no pasaron token manual, buscar en BD
    if (businessId && !apiToken) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { smsUsername: true, smsApiToken: true, smsSenderId: true },
      });

      if (business) {
        if (business.smsUsername) username = business.smsUsername;
        if (business.smsApiToken) apiToken = business.smsApiToken;
        if (business.smsSenderId) senderId = business.smsSenderId;
      }
    }

    const result = await sendLabsMobileSms({
      username,
      apiToken,
      senderId,
      phone,
      message,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "No se pudo enviar el SMS con LabsMobile.", details: result.data },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "SMS enviado exitosamente a través de LabsMobile.",
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error en API de SMS:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno al enviar SMS" },
      { status: 500 }
    );
  }
}
