import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeReferralCode } from "@/lib/partners";

export const dynamic = "force-dynamic";

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      credential,
      accessToken,
      email: manualEmail,
      name: manualName,
      postulationType = "AMBASSADOR",
      franchiseName,
      franchiseCityCountry,
      phone,
    } = body;

    let userEmail: string | null = null;
    let userName: string | null = null;

    if (accessToken) {
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          const uInfo = await userInfoRes.json();
          userEmail = uInfo.email?.toLowerCase().trim();
          userName = uInfo.name;
        }
      } catch (err) {
        console.warn("Fallo obtener userinfo con accessToken de Google en partner:", err);
      }
    } else if (credential) {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
        );
        if (verifyRes.ok) {
          const googleData = await verifyRes.json();
          userEmail = googleData.email?.toLowerCase().trim();
          userName = googleData.name;
        }
      } catch (err) {
        console.warn("Fallo verificación remota Google, decodificando payload local:", err);
      }

      if (!userEmail) {
        const decoded = decodeJwtPayload(credential);
        if (decoded && decoded.email) {
          userEmail = decoded.email.toLowerCase().trim();
          userName = decoded.name;
        }
      }
    } else if (manualEmail) {
      userEmail = manualEmail.toLowerCase().trim();
      userName = manualName || "Afiliado Gmail";
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "No se pudo obtener una cuenta de Google válida." },
        { status: 400 }
      );
    }

    const isFranchise = postulationType === "FRANCHISE";

    // 1. Buscar si ya existe el socio
    let partner = await prisma.partner.findUnique({
      where: { email: userEmail },
    });

    const cookieStore = await cookies();

    if (partner) {
      // Si el socio ya existe y está activo, iniciar sesión en su portal
      if (partner.status === "ACTIVE") {
        cookieStore.set("turnoya_partner_id", partner.id, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 días
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        return NextResponse.json({
          success: true,
          isExisting: true,
          status: "ACTIVE",
          partner: {
            id: partner.id,
            name: partner.name,
            email: partner.email,
            referralCode: partner.referralCode,
            isFranchise: partner.isFranchise,
          },
          redirectUrl: "/afiliados/portal",
        });
      }

      // Si está en PENDING
      return NextResponse.json({
        success: true,
        isExisting: true,
        pendingApproval: true,
        status: partner.status,
        partner: {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          referralCode: partner.referralCode,
          isFranchise: partner.isFranchise,
        },
        message: "Tu cuenta vinculada a Gmail está en revisión para validación del administrador.",
      });
    }

    // 2. Si no existe, crear la postulación como Embajador o Franquicia
    const partnerName = (userName || userEmail.split("@")[0] || "Embajador").trim();
    const cleanBase = partnerName.split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase() || "SOCIO";
    const rand = Math.floor(100 + Math.random() * 900);
    const finalCode = isFranchise ? `FQ-${cleanBase}${rand}` : `${cleanBase}${rand}`;

    // Obtener comisiones globales por defecto
    let defaultFirstMonth = 0.50;
    let defaultRecurring = 0.20;
    let defaultEntryFee = 99;
    let defaultMonthlyFee = 29;

    try {
      const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
      if (settings) {
        defaultFirstMonth = settings.partnerFirstMonthRate ?? 0.50;
        defaultRecurring = settings.partnerRecurringRate ?? 0.20;
        defaultEntryFee = settings.defaultFranchiseEntryFeeUSD ?? 99;
        defaultMonthlyFee = settings.defaultFranchiseFeeUSD ?? 29;
      }
    } catch (e) {
      // defaults
    }

    partner = await prisma.partner.create({
      data: {
        name: partnerName,
        email: userEmail,
        phone: phone || "+57 300 000 0000",
        referralCode: finalCode,
        firstMonthCommissionRate: defaultFirstMonth,
        commissionRate: defaultRecurring,
        payoutMethod: "NEQUI",
        payoutAccount: phone || userEmail,
        status: "PENDING",
        experience: isFranchise
          ? `Registro directo con Google / Gmail como Dueño de Franquicia (${franchiseCityCountry || "Territorio pendiente"}).`
          : "Registro directo con Google / Gmail como Embajador de Comisiones.",
        isFranchise,
        franchiseName: isFranchise ? (franchiseName?.trim() || `Franquicia ${partnerName}`) : null,
        franchiseCityCountry: isFranchise ? (franchiseCityCountry?.trim() || null) : null,
        franchiseEntryFee: isFranchise ? defaultEntryFee : 0,
        franchiseEntryFeePaid: false,
        franchiseMonthlyFee: isFranchise ? defaultMonthlyFee : 0,
        franchiseFeeCurrency: "USD",
        franchiseStatus: isFranchise ? "PENDING_ENTRY_FEE" : "INACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      isFranchise: partner.isFranchise,
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        referralCode: partner.referralCode,
        status: partner.status,
        isFranchise: partner.isFranchise,
      },
      message: isFranchise
        ? `¡Postulación como Franquiciado registrada con tu cuenta Gmail! Validaremos tu territorio (${partner.franchiseCityCountry || "solicitado"}).`
        : "¡Cuenta de embajador registrada con éxito con tu cuenta de Google! El administrador revisará tu postulación para activarte.",
    });
  } catch (error) {
    console.error("Error en Google Auth Afiliados:", error);
    return NextResponse.json(
      { error: "Error al procesar el registro con Google." },
      { status: 500 }
    );
  }
}
