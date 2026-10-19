import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessIdParam = searchParams.get("businessId");
    const query = searchParams.get("q")?.trim() || "";
    const filter = searchParams.get("filter") || "ALL"; // ALL | BIRTHDAYS_WEEK | BIRTHDAYS_MONTH | FREQUENT | NEW

    let business = await getCurrentBusiness();
    if (!business && businessIdParam) {
      business = await prisma.business.findUnique({
        where: { id: businessIdParam },
      });
    }

    if (!business) {
      return NextResponse.json({ error: "Negocio no autorizado" }, { status: 401 });
    }

    // Calcular mes y día actual para filtro de cumpleaños
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0"); // "01" - "12"
    const currentDay = now.getDate();

    // Obtener todos los clientes del negocio
    let customers = await prisma.customer.findMany({
      where: {
        businessId: business.id,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { phone: { contains: query } },
                { notes: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    // Detectar cumpleañeros
    const birthdayCelebrants = customers.filter((c) => {
      if (!c.birthday) return false;
      // c.birthday puede ser "MM-DD" o "YYYY-MM-DD"
      const parts = c.birthday.split("-");
      const bMonth = parts.length === 3 ? parts[1] : parts[0];
      const bDay = parseInt(parts.length === 3 ? parts[2] : parts[1], 10);

      if (filter === "BIRTHDAYS_MONTH") {
        return bMonth === currentMonth;
      }
      if (filter === "BIRTHDAYS_WEEK") {
        if (bMonth !== currentMonth) return false;
        // Ventana de 7 días alrededor del día de hoy
        return Math.abs(bDay - currentDay) <= 4;
      }
      return false;
    });

    // Aplicar filtros especiales
    if (filter === "BIRTHDAYS_MONTH" || filter === "BIRTHDAYS_WEEK") {
      customers = birthdayCelebrants;
    } else if (filter === "FREQUENT") {
      customers = customers.filter((c) => c.totalVisits >= 3);
    } else if (filter === "NEW") {
      customers = customers.filter((c) => c.totalVisits <= 1);
    }

    // Calcular estadísticas globales de clientes
    const totalCustomers = await prisma.customer.count({
      where: { businessId: business.id },
    });

    const allCustomersForStats = await prisma.customer.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true, phone: true, birthday: true, referralCount: true },
      orderBy: { name: "asc" },
    });

    const birthdaysThisMonthCount = allCustomersForStats.filter((c) => {
      if (!c.birthday) return false;
      const parts = c.birthday.split("-");
      const bMonth = parts.length === 3 ? parts[1] : parts[0];
      return bMonth === currentMonth;
    }).length;

    const totalReferralsMade = allCustomersForStats.reduce((sum, c) => sum + (c.referralCount || 0), 0);

    return NextResponse.json({
      success: true,
      customers,
      allReferrers: allCustomersForStats.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
      })),
      stats: {
        totalCustomers,
        birthdaysThisMonthCount,
        totalReferralsMade,
      },
    });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return NextResponse.json({ error: "Error al cargar la base de clientes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      customerId,
      name,
      phone,
      email,
      birthday,
      notes,
      referredBy,
      referrerCustomerId,
    } = body;

    let business = await getCurrentBusiness();
    if (!business && businessId) {
      business = await prisma.business.findUnique({
        where: { id: businessId },
      });
    }

    if (!business) {
      return NextResponse.json({ error: "Negocio no autorizado" }, { status: 401 });
    }

    if (!name || !phone) {
      return NextResponse.json({ error: "Nombre y teléfono son obligatorios." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");

    let finalReferredBy = referredBy ? String(referredBy).trim() : null;
    let referrerToIncrementId: string | null = null;

    if (referrerCustomerId) {
      const referrerCust = await prisma.customer.findFirst({
        where: { id: referrerCustomerId, businessId: business.id },
      });
      if (referrerCust) {
        finalReferredBy = `${referrerCust.name} (${referrerCust.phone})`;
        referrerToIncrementId = referrerCust.id;
      }
    } else if (finalReferredBy) {
      // Intentar encontrar cliente en la BD por teléfono o nombre
      const cleanRef = finalReferredBy.trim();
      const matched = await prisma.customer.findFirst({
        where: {
          businessId: business.id,
          OR: [
            { name: { equals: cleanRef, mode: "insensitive" } },
            { phone: { equals: cleanRef.replace(/[^0-9]/g, "") } },
          ],
          ...(customerId ? { id: { not: customerId } } : {}),
        },
      });
      if (matched) {
        referrerToIncrementId = matched.id;
      }
    }

    let previousCustomer = null;
    if (customerId) {
      previousCustomer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { referredBy: true },
      });
    }

    // Si hay un cliente referidor y es nuevo o cambió
    if (referrerToIncrementId && (!customerId || (previousCustomer && previousCustomer.referredBy !== finalReferredBy))) {
      await prisma.customer.update({
        where: { id: referrerToIncrementId },
        data: { referralCount: { increment: 1 } },
      }).catch((e) => console.error("Error al incrementar referralCount:", e));
    }

    let customer;
    if (customerId) {
      customer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          name: name.trim(),
          phone: cleanPhone,
          email: email?.trim() || null,
          birthday: birthday?.trim() || null,
          notes: notes?.trim() || null,
          referredBy: finalReferredBy,
        },
      });
    } else {
      customer = await prisma.customer.upsert({
        where: {
          businessId_phone: {
            businessId: business.id,
            phone: cleanPhone,
          },
        },
        update: {
          name: name.trim(),
          email: email?.trim() || undefined,
          birthday: birthday?.trim() || undefined,
          notes: notes?.trim() || undefined,
          referredBy: finalReferredBy || undefined,
        },
        create: {
          businessId: business.id,
          name: name.trim(),
          phone: cleanPhone,
          email: email?.trim() || null,
          birthday: birthday?.trim() || null,
          notes: notes?.trim() || null,
          referredBy: finalReferredBy,
          totalVisits: 1,
        },
      });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Error al guardar cliente:", error);
    return NextResponse.json({ error: "Error al guardar el cliente" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return NextResponse.json({ error: "Error al eliminar el cliente" }, { status: 500 });
  }
}
