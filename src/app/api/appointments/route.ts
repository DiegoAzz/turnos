import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
    }

    const appointments = await prisma.appointment.findMany({
      where: { businessId },
      include: {
        service: true,
      },
      orderBy: [
        { date: "desc" },
        { startTime: "asc" },
      ],
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error al obtener citas en vivo:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
