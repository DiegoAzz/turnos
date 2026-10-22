import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      name,
      category,
      serviceModality,
      currency,
      phone,
      description,
      generateInitialServices,
    } = body;

    if (!businessId) {
      return NextResponse.json({ error: "businessId es requerido." }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "El nombre del negocio es obligatorio." }, { status: 400 });
    }

    const validCategory = category || "OTRO";
    const validModality = serviceModality || "LOCAL";
    const validCurrency = currency ? currency.trim().toUpperCase() : "COP";

    // 1. Actualizar datos base del negocio
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: name.trim(),
        category: validCategory,
        serviceModality: validModality,
        currency: validCurrency,
        ...(phone ? { phone: phone.trim() } : {}),
        ...(description ? { description: description.trim() } : {}),
      },
    });

    // 2. Si se solicitó generar servicios sugeridos de inicio
    if (generateInitialServices !== false) {
      const existingServices = await prisma.service.findMany({
        where: { businessId },
      });

      // Regla SaaS: Las cuentas nuevas no auto-crean servicios de arranque.
      // El Super Administrador asigna los servicios autorizados desde el panel con sus checsitos.
    }

    return NextResponse.json({
      success: true,
      business: updatedBusiness,
      message: "Perfil del negocio y rubro configurados con éxito.",
    });
  } catch (error) {
    console.error("Error en onboarding de negocio:", error);
    return NextResponse.json({ error: "Error en el servidor al guardar configuración." }, { status: 500 });
  }
}
