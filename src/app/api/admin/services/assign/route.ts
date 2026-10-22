import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

// Catálogos maestros pre-configurados para asignar con checsitos
const PRESET_CATALOGS: Record<
  string,
  Array<{ name: string; description: string; durationMinutes: number; priceCOP: number; priceUSD: number }>
> = {
  BARBERIA: [
    {
      name: "Corte Clásico / Fade Degradado",
      description: "Corte moderno o clásico a máquina y tijera con asesoría de imagen y peinado.",
      durationMinutes: 30,
      priceCOP: 20000,
      priceUSD: 8,
    },
    {
      name: "Corte + Ritual de Barba con Toalla Caliente",
      description: "Corte completo y perfilado de barba con aceite hidratante, toalla caliente y navaja.",
      durationMinutes: 45,
      priceCOP: 35000,
      priceUSD: 12,
    },
    {
      name: "Perfilado de Barba & Cejas",
      description: "Marcación a navaja, toalla caliente, hidratación y perfilado de cejas.",
      durationMinutes: 20,
      priceCOP: 15000,
      priceUSD: 5,
    },
    {
      name: "Lavado Capilar & Peinado Pomada",
      description: "Lavado profundo con masaje capilar, tónico refrescante y fijación profesional.",
      durationMinutes: 15,
      priceCOP: 10000,
      priceUSD: 4,
    },
    {
      name: "Black Mask / Limpieza Facial de Puntos Negros",
      description: "Exfoliación suave, mascarilla negra purificante y toalla fría de cierre.",
      durationMinutes: 25,
      priceCOP: 18000,
      priceUSD: 6,
    },
    {
      name: "Pigmentación de Barba / Cubrimiento de Canas",
      description: "Aplicación de tinte o pigmento temporal de alta definición para barba poblada.",
      durationMinutes: 30,
      priceCOP: 20000,
      priceUSD: 7,
    },
    {
      name: "Corte Infantil Especial",
      description: "Atención paciente y amigable con peinado divertido para niños.",
      durationMinutes: 30,
      priceCOP: 18000,
      priceUSD: 6,
    },
  ],
  MANICURA_SPA: [
    {
      name: "Semipermanente en Manos (Diseño & Ruso)",
      description: "Limpieza profunda de cutícula, nivelación y esmaltado semipermanente de alta duración.",
      durationMinutes: 90,
      priceCOP: 45000,
      priceUSD: 15,
    },
    {
      name: "Uñas Acrílicas / Polygel Esculpidas",
      description: "Extensión completa, esculpido estructural y esmaltado con diseño.",
      durationMinutes: 120,
      priceCOP: 80000,
      priceUSD: 25,
    },
    {
      name: "Pedicura Spa & Exfoliación Relajante",
      description: "Limpieza profunda, arreglo de uñas, exfoliación de talones e hidratación intensiva.",
      durationMinutes: 60,
      priceCOP: 35000,
      priceUSD: 12,
    },
    {
      name: "Kapping / Baño de Acrílico sobre Uña Natural",
      description: "Refuerzo protector de acrílico o gel sobre la uña natural para evitar quiebres.",
      durationMinutes: 75,
      priceCOP: 50000,
      priceUSD: 16,
    },
    {
      name: "Manicura Tradicional Express",
      description: "Limpieza rápida de cutícula, limado y esmaltado clásico tradicional.",
      durationMinutes: 45,
      priceCOP: 25000,
      priceUSD: 8,
    },
    {
      name: "Retiro de Semipermanente o Acrílico",
      description: "Retiro cuidadoso sin maltratar la uña natural y nutrición con aceite de almendras.",
      durationMinutes: 30,
      priceCOP: 15000,
      priceUSD: 5,
    },
    {
      name: "Diseño a Mano Alzada / Efectos Especiales",
      description: "Arte en uñas, efectos ojo de gato, cromo, encapsulados o cristales Swarovski.",
      durationMinutes: 30,
      priceCOP: 20000,
      priceUSD: 6,
    },
  ],
  LAVADERO: [
    {
      name: "Lavado General + Aspirado Express",
      description: "Lavado exterior a presión con hidrófobo y aspirado completo de piso y asientos.",
      durationMinutes: 45,
      priceCOP: 25000,
      priceUSD: 10,
    },
    {
      name: "Lavado Especial + Encerado + Detailing",
      description: "Limpieza profunda de cojinería, encerado a máquina y brillo en llantas y rines.",
      durationMinutes: 90,
      priceCOP: 65000,
      priceUSD: 22,
    },
    {
      name: "Lavado de Motor & Chasis a Vapor",
      description: "Desengrasado seguro a vapor sin dañar componentes eléctricos y protección de plásticos.",
      durationMinutes: 40,
      priceCOP: 30000,
      priceUSD: 12,
    },
    {
      name: "Desinfección con Ozono / Interior",
      description: "Eliminación de bacterias, hongos y malos olores en ductos de aire y tapicería.",
      durationMinutes: 30,
      priceCOP: 20000,
      priceUSD: 8,
    },
  ],
  SALUD_CONSULTORIO: [
    {
      name: "Consulta / Valoración Especializada",
      description: "Evaluación clínica integral, diagnóstico, formulación y plan de tratamiento.",
      durationMinutes: 45,
      priceCOP: 80000,
      priceUSD: 25,
    },
    {
      name: "Sesión de Control o Terapia Especializada",
      description: "Sesión de seguimiento de tratamiento, fisioterapia o control especializado.",
      durationMinutes: 30,
      priceCOP: 50000,
      priceUSD: 18,
    },
    {
      name: "Limpieza Facial Profunda / Dermatológica",
      description: "Higienización, peeling ultrasónico, extracción de comedones y mascarilla calmante.",
      durationMinutes: 60,
      priceCOP: 70000,
      priceUSD: 22,
    },
  ],
};

// GET /api/admin/services/assign?businessId=xyz
export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado. Requiere sesión Super Admin." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "businessId es requerido" }, { status: 400 });
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        services: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const categoryKey = business.category || "BARBERIA";
    const rawPresets = PRESET_CATALOGS[categoryKey] || PRESET_CATALOGS["BARBERIA"];
    const isUSD = business.currency === "USD";

    const presetCatalog = rawPresets.map((p) => ({
      name: p.name,
      description: p.description,
      durationMinutes: p.durationMinutes,
      price: isUSD ? p.priceUSD : p.priceCOP,
      currency: business.currency,
      alreadyExists: business.services.some(
        (s) => s.name.toLowerCase().trim() === p.name.toLowerCase().trim()
      ),
    }));

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        category: business.category,
        currency: business.currency,
        plan: business.plan,
        active: business.active,
        totalServices: business.services.length,
      },
      currentServices: business.services,
      presetCatalog,
      allAvailableCategories: Object.keys(PRESET_CATALOGS),
    });
  } catch (error) {
    console.error("Error al obtener catálogo para asignación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/services/assign
export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado. Requiere sesión Super Admin." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { businessId, servicesToAssign, clearExisting } = body;

    if (!businessId || !Array.isArray(servicesToAssign) || servicesToAssign.length === 0) {
      return NextResponse.json(
        { error: "businessId y al menos un servicio seleccionado son requeridos." },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Si se solicitó limpiar previos
    if (clearExisting) {
      await prisma.service.deleteMany({
        where: { businessId },
      });
    }

    // Crear los servicios asignados
    const createdServices = [];
    for (const s of servicesToAssign) {
      if (!s.name || !s.durationMinutes) continue;

      const created = await prisma.service.create({
        data: {
          businessId,
          name: s.name.trim(),
          description: s.description || "Servicio asignado por el Administrador",
          durationMinutes: parseInt(s.durationMinutes, 10) || 30,
          price: parseFloat(s.price) || 0,
          active: true,
        },
      });
      createdServices.push(created);
    }

    // Obtener la cuenta total resultante
    const totalCount = await prisma.service.count({
      where: { businessId },
    });

    return NextResponse.json({
      success: true,
      message: `¡Se asignaron ${createdServices.length} servicios a "${business.name}" exitosamente! La cuenta está desbloqueada.`,
      createdCount: createdServices.length,
      totalServices: totalCount,
      services: createdServices,
    });
  } catch (error) {
    console.error("Error al asignar servicios:", error);
    return NextResponse.json({ error: "Error al guardar servicios en la base de datos" }, { status: 500 });
  }
}

// DELETE /api/admin/services/assign?serviceId=xyz
export async function DELETE(req: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId es requerido" }, { status: 400 });
    }

    await prisma.service.delete({
      where: { id: serviceId },
    });

    return NextResponse.json({ success: true, message: "Servicio eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    return NextResponse.json({ error: "Error al eliminar servicio" }, { status: 500 });
  }
}
