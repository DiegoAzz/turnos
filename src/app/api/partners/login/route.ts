import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeReferralCode } from "@/lib/partners";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier } = body; // Puede ser código de referido, email o teléfono

    if (!identifier) {
      return NextResponse.json(
        { error: "Ingresa tu código de referido, email o teléfono registrado." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();
    const normalizedCode = normalizeReferralCode(cleanIdentifier);

    // Buscar por código, email o teléfono
    const partner = await prisma.partner.findFirst({
      where: {
        OR: [
          { referralCode: normalizedCode },
          { email: cleanIdentifier.toLowerCase() },
          { phone: cleanIdentifier },
        ],
      },
    });

    if (!partner) {
      return NextResponse.json(
        { error: "No encontramos ningún embajador con esos datos." },
        { status: 404 }
      );
    }

    if (partner.status === "PENDING") {
      return NextResponse.json(
        {
          error:
            "Tu postulación está actualmente en revisión por el administrador. En breve te contactaremos a tu WhatsApp para validar tu perfil y darte acceso.",
          status: "PENDING",
        },
        { status: 403 }
      );
    }

    if (partner.status === "REJECTED") {
      return NextResponse.json(
        {
          error:
            "Tu postulación como embajador no fue aprobada. Si consideras que es un error, por favor contáctanos por WhatsApp.",
          status: "REJECTED",
        },
        { status: 403 }
      );
    }

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
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión de embajador:", error);
    return NextResponse.json(
      { error: "Error en el servidor al iniciar sesión." },
      { status: 500 }
    );
  }
}
