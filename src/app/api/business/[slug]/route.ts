import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get("date"); // YYYY-MM-DD

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        services: {
          where: { active: true },
          orderBy: { price: "asc" },
        },
        workingHours: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    let bookedSlots: string[] = [];

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
        },
      });

      bookedSlots = existingAppointments.map((a) => a.startTime);
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
      },
      services: business.services,
      workingHours: business.workingHours,
      bookedSlots,
    });
  } catch (error) {
    console.error("Error al obtener negocio:", error);
    return NextResponse.json(
      { error: "Error al cargar la información del negocio" },
      { status: 500 }
    );
  }
}
