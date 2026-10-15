import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("turnos_admin_session");
  return session?.value === "authenticated";
}

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
    const { name, slug, email, phone, currency = "USD", plan = "PRO", adminPin = "1234" } = body;

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

    // 1. Crear el negocio
    const business = await prisma.business.create({
      data: {
        name,
        slug: cleanSlug,
        email,
        phone: phone || null,
        currency,
        plan,
        active: true,
        adminPin: adminPin || "1234",
      },
    });

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

    // 3. Crear servicio inicial de bienvenida
    await prisma.service.create({
      data: {
        businessId: business.id,
        name: "Servicio General / Consulta",
        description: "Servicio predeterminado listo para personalizar.",
        durationMinutes: 30,
        price: 20.0,
        active: true,
      },
    });

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
    const { id, active, plan, adminPin, name, phone } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de negocio requerido." }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (typeof active === "boolean") dataToUpdate.active = active;
    if (plan && (plan === "FREE" || plan === "PRO")) dataToUpdate.plan = plan;
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
