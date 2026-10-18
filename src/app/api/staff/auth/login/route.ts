import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, pin } = body;

    if (!slug || !pin) {
      return NextResponse.json(
        { error: "Por favor ingresa la barbería y tu PIN de 4 dígitos" },
        { status: 400 }
      );
    }

    const cleanSlug = slug.trim().toLowerCase();
    const cleanPin = String(pin).trim();

    // Buscar negocio por slug
    const business = await prisma.business.findUnique({
      where: { slug: cleanSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        currency: true,
        multiBarberEnabled: true,
        active: true,
      },
    });

    if (!business || !business.active) {
      return NextResponse.json(
        { error: "Barbería o establecimiento no encontrado o inactivo" },
        { status: 404 }
      );
    }

    // Buscar barbero con ese PIN en este negocio
    const barber = await prisma.staffMember.findFirst({
      where: {
        businessId: business.id,
        pin: cleanPin,
        active: true,
      },
    });

    if (!barber) {
      return NextResponse.json(
        { error: "PIN incorrecto o barbero no registrado en este establecimiento" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      barber: {
        id: barber.id,
        name: barber.name,
        phone: barber.phone,
        chairNumber: barber.chairNumber,
        chairLabel: barber.chairLabel || `Silla ${barber.chairNumber || 1}`,
        commissionRate: barber.commissionRate,
      },
      business,
    });
  } catch (error) {
    console.error("Error en login de barbero:", error);
    return NextResponse.json({ error: "Error en el servidor al autenticar" }, { status: 500 });
  }
}
