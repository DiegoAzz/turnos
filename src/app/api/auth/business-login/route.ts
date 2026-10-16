import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setBusinessSessionCookie, clearAdminSessionCookie } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { identifier, pin } = await req.json();

    if (!identifier || !pin) {
      return NextResponse.json(
        { error: "Por favor ingresa tu identificador (slug o correo) y PIN." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Buscar negocio por slug o email
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { slug: cleanIdentifier },
          { email: cleanIdentifier },
        ],
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "No se encontró ningún negocio registrado con ese nombre o correo." },
        { status: 404 }
      );
    }

    if (business.adminPin !== pin.trim()) {
      return NextResponse.json(
        { error: "El PIN de acceso ingresado es incorrecto." },
        { status: 401 }
      );
    }

    if (!business.active) {
      return NextResponse.json(
        { error: "Esta cuenta se encuentra temporalmente suspendida. Contacta a soporte." },
        { status: 403 }
      );
    }

    // Aislar sesión: eliminar cookie de Super Admin si existiera en este navegador
    await clearAdminSessionCookie();

    await setBusinessSessionCookie(business.slug);

    return NextResponse.json({
      success: true,
      slug: business.slug,
      name: business.name,
    });
  } catch (error) {
    console.error("Error en login de negocio:", error);
    return NextResponse.json({ error: "Error en el servidor." }, { status: 500 });
  }
}
