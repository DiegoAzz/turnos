import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession as verifyAdmin } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

// GET /api/admin/businesses - Listar todas las empresas con métricas
export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const businesses = await prisma.business.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            appointments: true,
            services: true,
          },
        },
        appointments: {
          where: { status: { not: "CANCELLED" } },
          select: {
            service: {
              select: { price: true },
            },
          },
        },
      },
    });

    const data = businesses.map((b) => {
      const totalIngresos = b.appointments.reduce(
        (sum, a) => sum + (a.service?.price || 0),
        0
      );

      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        email: b.email,
        phone: b.phone,
        currency: b.currency,
        plan: b.plan,
        category: b.category || "BARBERIA",
        serviceModality: b.serviceModality || "LOCAL",
        multiBarberEnabled: b.multiBarberEnabled,
        active: b.active,
        adminPin: b.adminPin,
        createdAt: b.createdAt,
        totalCitas: b._count.appointments,
        totalServicios: b._count.services,
        totalIngresos,
      };
    });

    return NextResponse.json({ businesses: data });
  } catch (error) {
    console.error("Error al obtener empresas:", error);
    return NextResponse.json({ error: "Error en el servidor." }, { status: 500 });
  }
}

// POST /api/admin/businesses - Crear nueva empresa
export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      slug,
      email,
      phone,
      currency = "COP",
      plan = "PRO",
      category = "BARBERIA",
      serviceModality = "LOCAL",
      adminPin = "1234",
      partnerId: initialPartnerId,
      partnerCode,
    } = body;

    if (!name || !slug || !email) {
      return NextResponse.json(
        { error: "Nombre, slug y correo son obligatorios." },
        { status: 400 }
      );
    }

    // Normalizar slug (minúsculas, sin espacios ni caracteres especiales)
    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    // Verificar si ya existe el slug o email
    const existingSlug = await prisma.business.findUnique({ where: { slug: cleanSlug } });
    if (existingSlug) {
      return NextResponse.json(
        { error: `El slug "${cleanSlug}" ya está registrado para otro negocio.` },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.business.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: `El correo "${email}" ya está registrado.` },
        { status: 400 }
      );
    }

    // Resolver embajador si se pasó código o ID
    let finalPartnerId = initialPartnerId || null;
    if (partnerCode) {
      const p = await prisma.partner.findFirst({
        where: {
          OR: [
            { referralCode: partnerCode.toUpperCase().trim() },
            { id: partnerCode },
          ],
        },
      });
      if (p) finalPartnerId = p.id;
    }

    // 1. Crear el negocio con su rubro y modalidad
    const business = await prisma.business.create({
      data: {
        name,
        slug: cleanSlug,
        email,
        phone: phone || null,
        currency,
        plan,
        category,
        serviceModality,
        active: true,
        adminPin: adminPin || "1234",
        partnerId: finalPartnerId,
      },
    });

    // Si tiene embajador y es de pago, acreditar primera comisión
    if (finalPartnerId && plan !== "FREE") {
      const { recordSubscriptionCommission } = await import("@/lib/partners");
      await recordSubscriptionCommission({
        businessId: business.id,
        subscriptionAmount: currency === "USD" ? 19 : 60000,
        planName: `Plan ${plan}`,
      });
    }

    // 2. Horarios por defecto (Lunes a Sábado 09:00 a 19:00, Domingo cerrado)
    const workingHours = [
      { dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isClosed: false },
      { dayOfWeek: 2, openTime: "09:00", closeTime: "19:00", isClosed: false },
      { dayOfWeek: 3, openTime: "09:00", closeTime: "19:00", isClosed: false },
      { dayOfWeek: 4, openTime: "09:00", closeTime: "19:00", isClosed: false },
      { dayOfWeek: 5, openTime: "09:00", closeTime: "20:00", isClosed: false },
      { dayOfWeek: 6, openTime: "10:00", closeTime: "18:00", isClosed: false },
      { dayOfWeek: 0, openTime: "10:00", closeTime: "14:00", isClosed: true },
    ];

    for (const wh of workingHours) {
      await prisma.workingHour.create({
        data: {
          businessId: business.id,
          ...wh,
        },
      });
    }

    // 3. Crear servicios pre-configurados según el rubro de trabajo
    let initialServices: Array<{
      name: string;
      description: string;
      durationMinutes: number;
      price: number;
    }> = [];

    if (category === "MANICURA_SPA") {
      // Manicuristas: tiempos más largos (45 a 120 min) y servicios especializados
      initialServices = [
        {
          name: "Semipermanente en Manos (Diseño & Ruso)",
          description: "Limpieza profunda de cutícula, nivelación y esmaltado semipermanente de alta duración.",
          durationMinutes: 90,
          price: currency === "USD" ? 15.0 : 45000,
        },
        {
          name: "Uñas Acrílicas / Polygel Esculpidas",
          description: "Extensión completa, esculpido estructural y esmaltado.",
          durationMinutes: 120,
          price: currency === "USD" ? 25.0 : 80000,
        },
        {
          name: "Pedicura Spa & Exfoliación Relajante",
          description: "Limpieza profunda, arreglo de uñas, exfoliación e hidratación intensiva.",
          durationMinutes: 60,
          price: currency === "USD" ? 12.0 : 35000,
        },
        {
          name: "Manicura Tradicional Express",
          description: "Limpieza rápida y esmaltado tradicional.",
          durationMinutes: 45,
          price: currency === "USD" ? 8.0 : 25000,
        },
      ];
    } else if (category === "BARBERIA") {
      // Barberos: turnos dinámicos de 20 a 45 minutos
      initialServices = [
        {
          name: "Corte Clásico / Fade Degradado",
          description: "Corte moderno o clásico con asesoría de imagen y peinado.",
          durationMinutes: 30,
          price: currency === "USD" ? 8.0 : 20000,
        },
        {
          name: "Corte + Ritual de Barba con Toalla Caliente",
          description: "Corte completo y perfilado de barba con aceite hidratante y toalla caliente.",
          durationMinutes: 45,
          price: currency === "USD" ? 12.0 : 35000,
        },
        {
          name: "Perfilado de Barba & Cejas",
          description: "Marcación a navaja, exfoliación suave y acabado limpio.",
          durationMinutes: 20,
          price: currency === "USD" ? 5.0 : 15000,
        },
      ];
    } else if (category === "LAVADERO") {
      // Lavaderos: turnos de 45 a 90 minutos
      initialServices = [
        {
          name: "Lavado General + Aspirado Express",
          description: "Lavado exterior a presión con hidrófobo y aspirado de piso y asientos.",
          durationMinutes: 45,
          price: currency === "USD" ? 10.0 : 25000,
        },
        {
          name: "Lavado Especial + Encerado + Detailing",
          description: "Limpieza profunda de cojinería, encerado a máquina y brillo en llantas y rines.",
          durationMinutes: 90,
          price: currency === "USD" ? 22.0 : 65000,
        },
      ];
    } else {
      initialServices = [
        {
          name: "Servicio General / Consulta",
          description: "Servicio predeterminado listo para personalizar.",
          durationMinutes: 45,
          price: currency === "USD" ? 15.0 : 35000,
        },
      ];
    }

    for (const s of initialServices) {
      await prisma.service.create({
        data: {
          businessId: business.id,
          name: s.name,
          description: s.description,
          durationMinutes: s.durationMinutes,
          price: s.price,
          active: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      business,
      message: `Empresa "${business.name}" creada exitosamente.`,
    });
  } catch (error) {
    console.error("Error al crear negocio:", error);
    return NextResponse.json({ error: "Error al crear el negocio." }, { status: 500 });
  }
}

// PATCH /api/admin/businesses - Modificar estado activo/suspendido, plan o pin
export async function PATCH(req: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, active, plan, adminPin, name, phone, category, serviceModality } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de negocio requerido." }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (typeof active === "boolean") dataToUpdate.active = active;
    if (plan && (plan === "FREE" || plan === "INDEPENDIENTE" || plan === "PRO")) {
      dataToUpdate.plan = plan;
      if (plan === "FREE") {
        dataToUpdate.stripeCurrentPeriodEnd = null;
      } else {
        dataToUpdate.stripeCurrentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    }
    if (category) dataToUpdate.category = category;
    if (serviceModality) dataToUpdate.serviceModality = serviceModality;
    if (adminPin) dataToUpdate.adminPin = adminPin;
    if (name) dataToUpdate.name = name;
    if (phone !== undefined) dataToUpdate.phone = phone;

    const updated = await prisma.business.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error) {
    console.error("Error al actualizar negocio:", error);
    return NextResponse.json({ error: "Error al actualizar." }, { status: 500 });
  }
}

// DELETE /api/admin/businesses - Eliminar empresa
export async function DELETE(req: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de negocio requerido." }, { status: 400 });
    }

    await prisma.business.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Empresa eliminada." });
  } catch (error) {
    console.error("Error al eliminar negocio:", error);
    return NextResponse.json({ error: "Error al eliminar la empresa." }, { status: 500 });
  }
}
