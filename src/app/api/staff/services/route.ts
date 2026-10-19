import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-business";
import { parseStaffServices, encodeStaffServices } from "@/lib/staff-service-permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessIdParam = searchParams.get("businessId");

    let business = await getCurrentBusiness();
    if (!business && businessIdParam) {
      business = await prisma.business.findUnique({
        where: { id: businessIdParam },
      });
    }

    if (!business) {
      return NextResponse.json({ error: "No autorizado o negocio no encontrado" }, { status: 401 });
    }

    // Obtener todos los servicios activos del negocio
    const services = await prisma.service.findMany({
      where: { businessId: business.id },
      orderBy: { price: "asc" },
      select: {
        id: true,
        name: true,
        price: true,
        durationMinutes: true,
        active: true,
      },
    });

    // Obtener todo el personal del negocio
    const staffMembers = await prisma.staffMember.findMany({
      where: { businessId: business.id },
      orderBy: [{ chairNumber: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        phone: true,
        chairNumber: true,
        chairLabel: true,
        active: true,
        avatarUrl: true,
      },
    });

    const enrichedStaff = staffMembers.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      chairNumber: s.chairNumber,
      chairLabel: s.chairLabel || `Silla ${s.chairNumber || 1}`,
      active: s.active,
      allowedServiceIds: parseStaffServices(s.avatarUrl), // null significa todos los servicios habilitados
    }));

    return NextResponse.json({
      success: true,
      businessId: business.id,
      businessName: business.name,
      services,
      staff: enrichedStaff,
    });
  } catch (error) {
    console.error("Error al obtener servicios y permisos de personal:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, staffId, allowedServiceIds, bulk } = body;

    let business = await getCurrentBusiness();
    if (!business && businessId) {
      business = await prisma.business.findUnique({
        where: { id: businessId },
      });
    }

    if (!business) {
      return NextResponse.json({ error: "No autorizado o negocio no encontrado" }, { status: 401 });
    }

    // 1. Guardado masivo (bulk) para todos los barberos/personal a la vez
    if (bulk && typeof bulk === "object") {
      for (const [sId, serviceIds] of Object.entries(bulk)) {
        const staff = await prisma.staffMember.findFirst({
          where: { id: sId, businessId: business.id },
        });

        if (staff) {
          const finalAllowed = Array.isArray(serviceIds) ? (serviceIds as string[]) : null;
          const newAvatar = encodeStaffServices(finalAllowed, staff.avatarUrl);

          await prisma.staffMember.update({
            where: { id: sId },
            data: { avatarUrl: newAvatar },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Todos los servicios fueron actualizados con éxito en el personal.",
      });
    }

    // 2. Guardado individual para un barbero/personal específico
    if (!staffId) {
      return NextResponse.json({ error: "Falta staffId" }, { status: 400 });
    }

    const targetStaff = await prisma.staffMember.findFirst({
      where: { id: staffId, businessId: business.id },
    });

    if (!targetStaff) {
      return NextResponse.json({ error: "Personal no encontrado" }, { status: 404 });
    }

    const finalAllowed = Array.isArray(allowedServiceIds) ? allowedServiceIds : null;
    const newAvatar = encodeStaffServices(finalAllowed, targetStaff.avatarUrl);

    await prisma.staffMember.update({
      where: { id: staffId },
      data: { avatarUrl: newAvatar },
    });

    return NextResponse.json({
      success: true,
      message: `Servicios de ${targetStaff.name} actualizados exitosamente.`,
      staffId,
      allowedServiceIds: finalAllowed,
    });
  } catch (error) {
    console.error("Error al actualizar permisos de servicios de personal:", error);
    return NextResponse.json({ error: "Error al guardar asignación de servicios" }, { status: 500 });
  }
}
