import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeReferralCode } from "@/lib/partners";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      experience,
      payoutMethod = "NEQUI",
      payoutAccount,
      customCode,
    } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Nombre, correo y WhatsApp son obligatorios para postularte como embajador." },
        { status: 400 }
      );
    }

    if (!experience || experience.trim().length < 10) {
      return NextResponse.json(
        {
          error:
            "Por favor describe tu perfil u observaciones comerciales (mínimo 10 caracteres) para que el administrador pueda validar y aprobar tu solicitud.",
        },
        { status: 400 }
      );
    }

    // Generar código de referido inicial
    let finalCode = "";
    if (customCode && customCode.trim()) {
      finalCode = normalizeReferralCode(customCode);
    } else {
      const base = name.split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase();
      const rand = Math.floor(100 + Math.random() * 900);
      finalCode = `${base}${rand}`;
    }

    // Verificar si ya existe el código o el email
    const existingCode = await prisma.partner.findUnique({
      where: { referralCode: finalCode },
    });
    if (existingCode) {
      finalCode = `${finalCode}${Math.floor(10 + Math.random() * 90)}`;
    }

    const existingEmail = await prisma.partner.findUnique({
      where: { email },
    });
    if (existingEmail) {
      if (existingEmail.status === "PENDING" || existingEmail.status === "REJECTED") {
        // El postulante se equivocó (ej: en el teléfono) y está corrigiendo sus datos
        const updatedPartner = await prisma.partner.update({
          where: { id: existingEmail.id },
          data: {
            name: name.trim(),
            phone: phone.trim(),
            experience: experience.trim(),
            payoutMethod,
            payoutAccount: payoutAccount || phone,
            status: "PENDING", // Reactivar a revisión
          },
        });

        return NextResponse.json({
          success: true,
          pendingApproval: true,
          message: `¡Datos actualizados con éxito! Hemos corregido tu número de WhatsApp (${phone.trim()}) y tu postulación está en revisión para validación del administrador.`,
          partner: {
            id: updatedPartner.id,
            name: updatedPartner.name,
            email: updatedPartner.email,
            phone: updatedPartner.phone,
            referralCode: updatedPartner.referralCode,
            status: updatedPartner.status,
          },
        });
      }

      return NextResponse.json(
        { error: "Tu cuenta de embajador ya está activa. Si deseas actualizar tu número de WhatsApp o medios de pago, puedes ingresar a tu portal de afiliados." },
        { status: 400 }
      );
    }

    // Heredar las tasas de comisión configuradas por el administrador
    let defaultFirstMonthRate = 0.50;
    let defaultRecurringRate = 0.20;
    try {
      const platformSettings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
      if (platformSettings) {
        defaultFirstMonthRate = platformSettings.partnerFirstMonthRate ?? 0.50;
        defaultRecurringRate = platformSettings.partnerRecurringRate ?? 0.20;
      }
    } catch (e) {
      // Usar defaults si falla
    }

    // Crear el embajador en estado PENDING para que el Super Admin lo valide primero
    const partner = await prisma.partner.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        experience: experience.trim(),
        referralCode: finalCode,
        firstMonthCommissionRate: defaultFirstMonthRate,
        commissionRate: defaultRecurringRate,
        payoutMethod,
        payoutAccount: payoutAccount || phone,
        status: "PENDING", // Queda pendiente de validación manual
      },
    });

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message:
        "¡Solicitud enviada con éxito! Revisaremos tu perfil comercial para validar tu cuenta. Te notificaremos a tu WhatsApp cuando quede activada.",
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        referralCode: partner.referralCode,
        status: partner.status,
      },
    });
  } catch (error) {
    console.error("Error al registrar embajador:", error);
    return NextResponse.json(
      { error: "Error al registrar la solicitud de embajador." },
      { status: 500 }
    );
  }
}
