import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseStaffServices } from "@/lib/staff-service-permissions";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get("date"); // YYYY-MM-DD

    const decodedSlug = decodeURIComponent(slug).trim();
    const cleanLower = decodedSlug.toLowerCase();

    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { slug: decodedSlug },
          { slug: cleanLower },
          { slug: { equals: decodedSlug, mode: "insensitive" } },
          { id: decodedSlug },
        ],
      },
      include: {
        services: {
          where: { active: true },
          orderBy: { price: "asc" },
        },
        workingHours: {
          orderBy: { dayOfWeek: "asc" },
        },
        products: {
          where: { active: true, stock: { gt: 0 } },
          orderBy: { name: "asc" },
        },
        staffMembers: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            chairNumber: true,
            chairLabel: true,
            avatarUrl: true,
          },
          orderBy: { chairNumber: "asc" },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Comprobación autónoma de vigencia del plan
    if (
      business.plan !== "FREE" &&
      business.plan !== "SUPERADMIN" &&
      business.stripeCurrentPeriodEnd &&
      new Date(business.stripeCurrentPeriodEnd) < new Date()
    ) {
      await prisma.business.update({
        where: { id: business.id },
        data: { plan: "FREE" },
      });
      business.plan = "FREE";
    }

    if (!business.active) {
      return NextResponse.json(
        { error: "Este establecimiento se encuentra temporalmente inactivo.", inactive: true },
        { status: 403 }
      );
    }

    const staffMemberIdQuery = searchParams.get("staffMemberId");

    let bookedSlots: string[] = [];
    let bookedIntervals: { startTime: string; endTime: string }[] = [];

    if (dateQuery) {
      const targetDate = new Date(`${dateQuery}T00:00:00.000Z`);
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          businessId: business.id,
          date: targetDate,
          status: { not: "CANCELLED" },
        },
        select: {
          startTime: true,
          endTime: true,
          staffMemberId: true,
        },
      });

      if (business.multiBarberEnabled) {
        const activeStaffCount = Math.max(1, (business.staffMembers || []).length);

        if (staffMemberIdQuery) {
          // El cliente seleccionó un barbero específico: solo citas de ese barbero bloquean
          const barberApps = existingAppointments.filter((a) => a.staffMemberId === staffMemberIdQuery);
          bookedIntervals = barberApps.map((a) => ({ startTime: a.startTime, endTime: a.endTime }));

          for (const app of barberApps) {
            const [sH, sM] = app.startTime.split(":").map(Number);
            const [eH, eM] = app.endTime.split(":").map(Number);
            let cur = sH * 60 + sM;
            const end = eH * 60 + eM;
            while (cur < end) {
              const h = Math.floor(cur / 60);
              const m = cur % 60;
              const slotStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
              if (!bookedSlots.includes(slotStr)) {
                bookedSlots.push(slotStr);
              }
              cur += 30;
            }
          }
        } else {
          // El cliente eligió "Cualquier barbero":
          // Un horario se bloquea ÚNICAMENTE si la cantidad de citas simultáneas alcanza el número de barberos activos
          const slotOccupancy: Record<string, number> = {};
          for (const app of existingAppointments) {
            const [sH, sM] = app.startTime.split(":").map(Number);
            const [eH, eM] = app.endTime.split(":").map(Number);
            let cur = sH * 60 + sM;
            const end = eH * 60 + eM;
            while (cur < end) {
              const h = Math.floor(cur / 60);
              const m = cur % 60;
              const slotStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
              slotOccupancy[slotStr] = (slotOccupancy[slotStr] || 0) + 1;
              cur += 30;
            }
          }

          for (const [slotStr, count] of Object.entries(slotOccupancy)) {
            if (count >= activeStaffCount) {
              bookedSlots.push(slotStr);
            }
          }
        }
      } else {
        // Negocio clásico con 1 silla
        bookedIntervals = existingAppointments.map((app) => ({
          startTime: app.startTime,
          endTime: app.endTime,
        }));

        for (const app of existingAppointments) {
          const [sH, sM] = app.startTime.split(":").map(Number);
          const [eH, eM] = app.endTime.split(":").map(Number);
          let cur = sH * 60 + sM;
          const end = eH * 60 + eM;
          while (cur < end) {
            const h = Math.floor(cur / 60);
            const m = cur % 60;
            const slotStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            if (!bookedSlots.includes(slotStr)) {
              bookedSlots.push(slotStr);
            }
            cur += 30;
          }
        }
      }
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        phone: business.phone,
        description: business.description,
        address: business.address,
        currency: business.currency,
        plan: business.plan,
        liveStatus: business.liveStatus || "OPEN",
        statusMessage: business.statusMessage || null,
        logoUrl: business.logoUrl || null,
        category: business.category || "BARBERIA",
        serviceModality: business.serviceModality || "LOCAL",
        multiBarberEnabled: business.multiBarberEnabled,
      },
      services: business.services,
      workingHours: business.workingHours,
      products: business.products || [],
      staffMembers: (business.staffMembers || []).map((s) => ({
        ...s,
        allowedServiceIds: parseStaffServices(s.avatarUrl),
      })),
      bookedSlots,
      bookedIntervals,
    });
  } catch (error) {
    console.error("Error al obtener negocio:", error);
    return NextResponse.json(
      { error: "Error al cargar la información del negocio" },
      { status: 500 }
    );
  }
}
