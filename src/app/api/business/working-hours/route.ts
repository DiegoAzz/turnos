import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

const DEFAULT_DAYS = [
  { dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isClosed: false }, // Lunes
  { dayOfWeek: 2, openTime: "09:00", closeTime: "19:00", isClosed: false }, // Martes
  { dayOfWeek: 3, openTime: "09:00", closeTime: "19:00", isClosed: false }, // Miércoles
  { dayOfWeek: 4, openTime: "09:00", closeTime: "19:00", isClosed: false }, // Jueves
  { dayOfWeek: 5, openTime: "09:00", closeTime: "19:00", isClosed: false }, // Viernes
  { dayOfWeek: 6, openTime: "09:00", closeTime: "19:00", isClosed: false }, // Sábado
  { dayOfWeek: 0, openTime: "10:00", closeTime: "16:00", isClosed: true },  // Domingo (Cerrado por defecto)
];

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
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    let hours = await prisma.workingHour.findMany({
      where: { businessId: business.id },
      orderBy: { dayOfWeek: "asc" },
    });

    // Si aún no tiene horarios configurados, sembrar los 7 días por defecto
    if (hours.length === 0) {
      for (const def of DEFAULT_DAYS) {
        await prisma.workingHour.create({
          data: {
            businessId: business.id,
            dayOfWeek: def.dayOfWeek,
            openTime: def.openTime,
            closeTime: def.closeTime,
            isClosed: def.isClosed,
          },
        });
      }

      hours = await prisma.workingHour.findMany({
        where: { businessId: business.id },
        orderBy: { dayOfWeek: "asc" },
      });
    }

    return NextResponse.json({ success: true, workingHours: hours });
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    return NextResponse.json({ error: "Error al consultar horarios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, hours } = body;

    let business = await getCurrentBusiness();
    if (!business && businessId) {
      business = await prisma.business.findUnique({
        where: { id: businessId },
      });
    }

    if (!business) {
      return NextResponse.json({ error: "Negocio no autorizado" }, { status: 401 });
    }

    if (!Array.isArray(hours)) {
      return NextResponse.json({ error: "Formato de horarios inválido" }, { status: 400 });
    }

    // Actualizar o crear cada día de la semana
    for (const h of hours) {
      await prisma.workingHour.upsert({
        where: {
          businessId_dayOfWeek: {
            businessId: business.id,
            dayOfWeek: h.dayOfWeek,
          },
        },
        update: {
          openTime: h.openTime || "09:00",
          closeTime: h.closeTime || "19:00",
          isClosed: Boolean(h.isClosed),
        },
        create: {
          businessId: business.id,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime || "09:00",
          closeTime: h.closeTime || "19:00",
          isClosed: Boolean(h.isClosed),
        },
      });
    }

    const updatedHours = await prisma.workingHour.findMany({
      where: { businessId: business.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ success: true, workingHours: updatedHours });
  } catch (error) {
    console.error("Error al actualizar horarios:", error);
    return NextResponse.json({ error: "Error al guardar horarios" }, { status: 500 });
  }
}
