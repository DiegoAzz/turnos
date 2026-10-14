import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    const whereClause: any = {};
    if (businessId) whereClause.businessId = businessId;

    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    return NextResponse.json(
      { error: "Error al obtener servicios" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, name, description, durationMinutes, price } = body;

    if (!businessId || !name || !durationMinutes || price === undefined) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para el servicio." },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { services: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Regla de suscripción: el plan FREE solo permite 2 servicios activos
    if (business.plan === "FREE" && business.services.length >= PLANS.FREE.limits.maxServices) {
      return NextResponse.json(
        {
          error: "Has alcanzado el límite de 2 servicios del Plan Gratuito.",
          upgradeRequired: true,
          limitReached: "maxServices",
        },
        { status: 403 }
      );
    }

    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description,
        durationMinutes: parseInt(durationMinutes),
        price: parseFloat(price),
        active: true,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Error al crear servicio:", error);
    return NextResponse.json(
      { error: "Error interno al crear el servicio" },
      { status: 500 }
    );
  }
}
