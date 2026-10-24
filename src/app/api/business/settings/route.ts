import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBusinessPro } from "@/lib/business-plan";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      autoRemindersEnabled,
      reminderTiming,
      reminderMessageTemplate,
      liveStatus,
      statusMessage,
      name,
      description,
      address,
      phone,
      logoUrl,
    } = body;

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
    if (liveStatus !== undefined) {
      dataToUpdate.liveStatus = liveStatus;
    }
    if (statusMessage !== undefined) {
      dataToUpdate.statusMessage = statusMessage;
    }
    if (name && name.trim()) {
      dataToUpdate.name = name.trim();
    }
    if (description !== undefined) {
      dataToUpdate.description = description;
    }
    if (address !== undefined) {
      dataToUpdate.address = address;
    }
    if (phone !== undefined) {
      dataToUpdate.phone = phone;
    }
    if (logoUrl !== undefined) {
      dataToUpdate.logoUrl = logoUrl;
    }
    if (body.currency) {
      dataToUpdate.currency = body.currency.trim().toUpperCase();
    }
    if (typeof body.smsEnabled === "boolean") {
      dataToUpdate.smsEnabled = body.smsEnabled;
    }
    if (body.smsUsername !== undefined) {
      dataToUpdate.smsUsername = body.smsUsername?.trim() || null;
    }
    if (body.smsApiToken !== undefined) {
      dataToUpdate.smsApiToken = body.smsApiToken?.trim() || null;
    }
    if (body.smsSenderId !== undefined) {
      dataToUpdate.smsSenderId = body.smsSenderId?.trim() || "TurnoYa";
    }
    if (body.category) {
      dataToUpdate.category = body.category.trim();
    }
    if (body.serviceModality) {
      dataToUpdate.serviceModality = body.serviceModality.trim();
    }
    if (typeof body.multiBarberEnabled === "boolean") {
      if (body.multiBarberEnabled) {
        const businessRecord = await prisma.business.findUnique({
          where: { id: businessId },
          select: { plan: true, stripeCurrentPeriodEnd: true, trialEndsAt: true },
        });

        if (!isBusinessPro(businessRecord)) {
          return NextResponse.json(
            {
              error: "El módulo Multi-Barbero requiere el Plan PRO o un período de prueba activo. Tu plan actual es FREE o tu prueba ha vencido.",
              requiresPro: true,
            },
            { status: 403 }
          );
        }
      }
      dataToUpdate.multiBarberEnabled = body.multiBarberEnabled;
    }
    if (body.homeServiceFee !== undefined) {
      dataToUpdate.homeServiceFee = Number(body.homeServiceFee) || 0;
    }
    if (typeof body.requireDepositForNew === "boolean") {
      dataToUpdate.requireDepositForNew = body.requireDepositForNew;
    }
    if (body.depositAmount !== undefined) {
      dataToUpdate.depositAmount = Number(body.depositAmount) || 0;
    }
    if (body.depositPaymentInfo !== undefined) {
      dataToUpdate.depositPaymentInfo = body.depositPaymentInfo ? String(body.depositPaymentInfo).trim() : null;
    }
    if (typeof body.referralProgramEnabled === "boolean") {
      dataToUpdate.referralProgramEnabled = body.referralProgramEnabled;
    }
    if (body.referralRewardText !== undefined) {
      dataToUpdate.referralRewardText = body.referralRewardText ? String(body.referralRewardText).trim() : null;
    }
    if (body.stationHardwarePin !== undefined) {
      dataToUpdate.stationHardwarePin = body.stationHardwarePin ? String(body.stationHardwarePin).trim() : "0000";
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
