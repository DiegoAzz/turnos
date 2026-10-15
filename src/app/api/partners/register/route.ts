import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeReferralCode } from "@/lib/partners";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, payoutMethod = "NEQUI", payoutAccount, customCode } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Nombre, correo y WhatsApp son obligatorios para ser embajador." },
        { status: 400 }
      );
    }

    // Generar código de referido
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
      return NextResponse.json(
        { error: "Este correo electrónico ya está registrado como embajador. Por favor inicia sesión." },
        { status: 400 }
      );
    }

    // Crear el embajador
    const partner = await prisma.partner.create({
      data: {
        name,
        email,
        phone,
        referralCode: finalCode,
        commissionRate: 0.30, // 30% recurrente vitalicio
        payoutMethod,
        payoutAccount: payoutAccount || phone,
        status: "ACTIVE",
      },
    });

    // Guardar cookie de sesión del embajador (30 días)
    const cookieStore = await cookies();
    cookieStore.set("turnoya_partner_id", partner.id, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: false,
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        referralCode: partner.referralCode,
        commissionRate: partner.commissionRate,
        balance: partner.balance,
      },
      referralLink: `https://turnos.appzplay.online/?ref=${partner.referralCode}`,
    });
  } catch (error) {
    console.error("Error al registrar embajador:", error);
    return NextResponse.json(
      { error: "Error al registrar el embajador." },
      { status: 500 }
    );
  }
}
