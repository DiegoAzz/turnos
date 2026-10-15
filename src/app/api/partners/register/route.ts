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
      postulationType = "AMBASSADOR", // "AMBASSADOR" | "FRANCHISE"
      franchiseName,
      franchiseCityCountry,
    } = body;

    const isApplyingFranchise = postulationType === "FRANCHISE";

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Nombre, correo y WhatsApp son obligatorios para postularte." },
        { status: 400 }
      );
    }

    if (!experience || experience.trim().length < 10) {
      return NextResponse.json(
        {
          error:
            "Por favor describe tu perfil comercial, territorio u observaciones (mínimo 10 caracteres) para que el administrador pueda validar tu solicitud.",
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
      finalCode = isApplyingFranchise ? `FQ-${base}${rand}` : `${base}${rand}`;
    }

    // Consultar configuración global de la plataforma
    let defaultFirstMonthRate = 0.50;
    let defaultRecurringRate = 0.20;
    let defaultEntryFee = 99;
    let defaultMonthlyFee = 29;

    try {
      const platformSettings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
      if (platformSettings) {
        defaultFirstMonthRate = platformSettings.partnerFirstMonthRate ?? 0.50;
        defaultRecurringRate = platformSettings.partnerRecurringRate ?? 0.20;
        defaultEntryFee = platformSettings.defaultFranchiseEntryFeeUSD ?? 99;
        defaultMonthlyFee = platformSettings.defaultFranchiseFeeUSD ?? 29;
      }
    } catch (e) {
      // Usar defaults si falla
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
            ...(isApplyingFranchise
              ? {
                  isFranchise: true,
                  franchiseStatus: "PENDING_ENTRY_FEE",
                  franchiseName: franchiseName?.trim() || `Franquicia ${name.trim()}`,
                  franchiseCityCountry: franchiseCityCountry?.trim() || null,
                  franchiseEntryFee: defaultEntryFee,
                  franchiseMonthlyFee: defaultMonthlyFee,
                  franchiseFeeCurrency: "USD",
                }
              : {}),
          },
        });

        return NextResponse.json({
          success: true,
          pendingApproval: true,
          isFranchise: updatedPartner.isFranchise,
          message: isApplyingFranchise
            ? `¡Datos actualizados con éxito! Tu postulación a Dueño de Franquicia (${updatedPartner.franchiseCityCountry || "tu territorio"}) está en revisión para validación del administrador.`
            : `¡Datos actualizados con éxito! Hemos corregido tu número de WhatsApp (${phone.trim()}) y tu postulación está en revisión para validación del administrador.`,
          partner: {
            id: updatedPartner.id,
            name: updatedPartner.name,
            email: updatedPartner.email,
            phone: updatedPartner.phone,
            referralCode: updatedPartner.referralCode,
            status: updatedPartner.status,
            isFranchise: updatedPartner.isFranchise,
            franchiseName: updatedPartner.franchiseName,
            franchiseCityCountry: updatedPartner.franchiseCityCountry,
          },
        });
      }

      return NextResponse.json(
        { error: "Tu cuenta de socio ya está activa. Si deseas actualizar tu perfil o solicitar una franquicia, puedes ingresar a tu portal de afiliados." },
        { status: 400 }
      );
    }

    // Crear el socio/embajador o franquiciado en estado PENDING para que el Super Admin lo valide primero
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
        // Campos si se postula a Franquicia
        isFranchise: isApplyingFranchise,
        franchiseName: isApplyingFranchise ? (franchiseName?.trim() || `Franquicia ${name.trim()}`) : null,
        franchiseCityCountry: isApplyingFranchise ? (franchiseCityCountry?.trim() || null) : null,
        franchiseEntryFee: isApplyingFranchise ? defaultEntryFee : 0,
        franchiseEntryFeePaid: false,
        franchiseMonthlyFee: isApplyingFranchise ? defaultMonthlyFee : 0,
        franchiseFeeCurrency: "USD",
        franchiseStatus: isApplyingFranchise ? "PENDING_ENTRY_FEE" : "INACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      isFranchise: partner.isFranchise,
      message: isApplyingFranchise
        ? `¡Solicitud de Franquicia recibida con éxito! Revisaremos tu territorio (${partner.franchiseCityCountry || "solicitado"}). Te contactaremos por WhatsApp para coordinar el canon de apertura ($${partner.franchiseEntryFee} USD) y asignarte tu territorio exclusivo.`
        : "¡Solicitud enviada con éxito! Revisaremos tu perfil comercial para validar tu cuenta. Te notificaremos a tu WhatsApp cuando quede activada.",
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        referralCode: partner.referralCode,
        status: partner.status,
        isFranchise: partner.isFranchise,
        franchiseName: partner.franchiseName,
        franchiseCityCountry: partner.franchiseCityCountry,
      },
    });
  } catch (error) {
    console.error("Error al registrar embajador/franquicia:", error);
    return NextResponse.json(
      { error: "Error al registrar la solicitud." },
      { status: 500 }
    );
  }
}
