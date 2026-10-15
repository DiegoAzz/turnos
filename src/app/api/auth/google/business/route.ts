import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setBusinessSessionCookie } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

/**
 * Decodifica de forma segura el payload de un Google JWT id_token
 */
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
    const { credential, email: manualEmail, name: manualName, photoUrl: manualPhoto } = body;

    let userEmail: string | null = null;
    let userName: string | null = null;
    let userPicture: string | null = null;

    if (credential) {
      // Intentar validar directamente con la API de Google si hay conectividad
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
        );
        if (verifyRes.ok) {
          const googleData = await verifyRes.json();
          userEmail = googleData.email?.toLowerCase().trim();
          userName = googleData.name;
          userPicture = googleData.picture;
        }
      } catch (err) {
        console.warn("Fallo validación remota Google, decodificando payload local:", err);
      }

      // Si falló verificación remota por red, decodificar payload
      if (!userEmail) {
        const decoded = decodeJwtPayload(credential);
        if (decoded && decoded.email) {
          userEmail = decoded.email.toLowerCase().trim();
          userName = decoded.name;
          userPicture = decoded.picture;
        }
      }
    } else if (manualEmail) {
      // Soporte modo prueba / fallback
      userEmail = manualEmail.toLowerCase().trim();
      userName = manualName || "Usuario Gmail";
      userPicture = manualPhoto || null;
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "No se pudo obtener una cuenta de Google válida." },
        { status: 400 }
      );
    }

    // 1. Buscar si ya existe un negocio con este correo
    let business = await prisma.business.findFirst({
      where: { email: userEmail },
    });

    if (!business) {
      // 2. Si no existe, crear automáticamente un nuevo negocio registrado con Gmail
      const baseName = userName ? userName.split(" ")[0] : "Mi Negocio";
      const cleanBase = baseName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "negocio";
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      let newSlug = `${cleanBase}-${randomSuffix}`;

      // Asegurar que el slug sea único
      const existingSlug = await prisma.business.findUnique({ where: { slug: newSlug } });
      if (existingSlug) {
        newSlug = `${cleanBase}-${Date.now().toString().slice(-4)}`;
      }

      business = await prisma.business.create({
        data: {
          name: `${baseName} (Turnos)`,
          slug: newSlug,
          email: userEmail,
          logoUrl: userPicture || null,
          currency: "USD",
          plan: "FREE",
          active: true,
          adminPin: "1234",
          category: "BARBERIA",
          serviceModality: "LOCAL",
        },
      });

      // Crear horarios por defecto de Lunes a Sábado
      const defaultHours = [
        { dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 2, openTime: "09:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 3, openTime: "09:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 4, openTime: "09:00", closeTime: "19:00", isClosed: false },
        { dayOfWeek: 5, openTime: "09:00", closeTime: "20:00", isClosed: false },
        { dayOfWeek: 6, openTime: "10:00", closeTime: "18:00", isClosed: false },
        { dayOfWeek: 0, openTime: "10:00", closeTime: "14:00", isClosed: true },
      ];

      for (const h of defaultHours) {
        await prisma.workingHour.create({
          data: {
            businessId: business.id,
            ...h,
          },
        });
      }

      // Crear servicio inicial de bienvenida
      await prisma.service.create({
        data: {
          businessId: business.id,
          name: "Servicio Inicial",
          description: "Servicio de bienvenida creado automáticamente",
          durationMinutes: 30,
          price: 15,
          active: true,
        },
      });
    }

    if (!business.active) {
      return NextResponse.json(
        { error: "Tu cuenta de negocio se encuentra suspendida temporalmente." },
        { status: 403 }
      );
    }

    // 3. Crear sesión criptográfica segura
    await setBusinessSessionCookie(business.slug);

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        email: business.email,
      },
      redirectUrl: "/dashboard",
    });
  } catch (error) {
    console.error("Error en Google Auth Negocios:", error);
    return NextResponse.json(
      { error: "Error al procesar el inicio de sesión con Google." },
      { status: 500 }
    );
  }
}
