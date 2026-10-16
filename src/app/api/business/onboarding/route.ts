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

      // Solo sustituimos si el negocio no tiene servicios o solo tiene el genérico "Servicio Inicial"
      const isVirgin =
        existingServices.length === 0 ||
        (existingServices.length === 1 &&
          (existingServices[0].name.toLowerCase().includes("servicio inicial") ||
            existingServices[0].name.toLowerCase().includes("servicio de bienvenida")));

      if (isVirgin) {
        // Eliminar el servicio temporal
        if (existingServices.length > 0) {
          await prisma.service.deleteMany({
            where: { businessId },
          });
        }

        // Obtener servicios según rubro
        const isUSD = validCurrency === "USD";
        let starterServices: Array<{
          name: string;
          description: string;
          durationMinutes: number;
          price: number;
        }> = [];

        if (validCategory === "MANICURA_SPA") {
          starterServices = [
            {
              name: "Semipermanente en Manos (Diseño & Ruso)",
              description: "Limpieza profunda de cutícula, nivelación y esmaltado semipermanente de alta duración.",
              durationMinutes: 90,
              price: isUSD ? 15 : 45000,
            },
            {
              name: "Pedicura Spa & Exfoliación Relajante",
              description: "Limpieza profunda, arreglo de uñas, exfoliación e hidratación intensiva.",
              durationMinutes: 60,
              price: isUSD ? 12 : 35000,
            },
          ];
        } else if (validCategory === "BARBERIA") {
          starterServices = [
            {
              name: "Corte Clásico / Fade Degradado",
              description: "Corte moderno o clásico con asesoría de imagen y peinado.",
              durationMinutes: 30,
              price: isUSD ? 8 : 20000,
            },
            {
              name: "Corte + Ritual de Barba con Toalla Caliente",
              description: "Corte completo y perfilado de barba con aceite hidratante y toalla caliente.",
              durationMinutes: 45,
              price: isUSD ? 12 : 35000,
            },
          ];
        } else if (validCategory === "SALUD_CONSULTORIO") {
          starterServices = [
            {
              name: "Consulta Médica / Valoración General",
              description: "Evaluación clínica integral, diagnóstico, formulación y plan de tratamiento.",
              durationMinutes: 45,
              price: isUSD ? 25 : 80000,
            },
            {
              name: "Sesión de Control o Terapia",
              description: "Sesión de seguimiento de tratamiento, fisioterapia o control especializado.",
              durationMinutes: 30,
              price: isUSD ? 18 : 50000,
            },
          ];
        } else if (validCategory === "LAVADERO") {
          starterServices = [
            {
              name: "Lavado General Exterior e Interior",
              description: "Lavado con espuma activa, aspirado completo, silicona en llantas y aromatizado.",
              durationMinutes: 45,
              price: isUSD ? 8 : 25000,
            },
            {
              name: "Lavado Especial, Encerado & Aspirado",
              description: "Lavado premium con cera protectora UV, desinfección y brillo intenso.",
              durationMinutes: 60,
              price: isUSD ? 15 : 45000,
            },
          ];
        } else if (validCategory === "VETERINARIA") {
          starterServices = [
            {
              name: "Consulta Veterinaria General",
              description: "Revisión física completa, control de peso, chequeo preventivo y recomendaciones.",
              durationMinutes: 30,
              price: isUSD ? 15 : 50000,
            },
            {
              name: "Baño, Corte de Uñas y Peluquería Canina",
              description: "Baño relajante, limpieza de oídos, corte de uñas y cepillado profesional.",
              durationMinutes: 60,
              price: isUSD ? 12 : 40000,
            },
          ];
        } else {
          starterServices = [
            {
              name: "Servicio Profesional (Sesión)",
              description: "Atención personalizada y asesoría especializada para tu cita.",
              durationMinutes: 45,
              price: isUSD ? 10 : 35000,
            },
            {
              name: "Cita de Asesoría o Atención Personalizada",
              description: "Revisión rápida de avance o sesión de consulta personalizada.",
              durationMinutes: 30,
              price: isUSD ? 7 : 20000,
            },
          ];
        }

        for (const s of starterServices) {
          await prisma.service.create({
            data: {
              businessId,
              name: s.name,
              description: s.description,
              durationMinutes: s.durationMinutes,
              price: s.price,
              active: true,
            },
          });
        }
      }
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
