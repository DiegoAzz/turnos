import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayUtcRange } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

function getTodayRange(dateStrParam?: string | null) {
  return getTodayUtcRange("America/Bogota", dateStrParam);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get("date");

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
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        category: true,
        address: true,
        phone: true,
        liveStatus: true,
        statusMessage: true,
        currency: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const { dateStr, startOfDay, endOfDay } = getTodayRange(dateQuery);

    // Obtener todas las citas del día ordenadas cronológicamente
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            price: true,
          },
        },
      },
      orderBy: [
        { startTime: "asc" },
        { createdAt: "asc" },
      ],
    });

    // Asignar número de turno secuencial de hoy (#01, #02...) a los que no estén cancelados
    let turnCounter = 0;
    const turnsWithNumbers = appointments.map((app) => {
      if (app.status === "CANCELLED") {
        return {
          ...app,
          turnNumber: null,
          turnLabel: "Cancelado",
        };
      }
      turnCounter++;
      const numFormatted = String(turnCounter).padStart(2, "0");
      return {
        ...app,
        turnNumber: turnCounter,
        turnLabel: `#${numFormatted}`,
      };
    });

    const activeTurns = turnsWithNumbers.filter((t) => t.status !== "CANCELLED");

    // Identificar el que está en silla (IN_PROGRESS)
    const currentServing =
      activeTurns.filter((t) => t.status === "IN_PROGRESS").pop() || null;

    // En espera (CONFIRMED o PENDING)
    const waiting = activeTurns.filter(
      (t) => t.status === "CONFIRMED" || t.status === "PENDING"
    );

    // Pospuestos (llamados pero no estaban en sala)
    const postponed = activeTurns.filter((t) => t.status === "POSTPONED");

    // Completados hoy
    const completed = activeTurns.filter((t) => t.status === "COMPLETED");

    return NextResponse.json({
      success: true,
      business,
      date: dateStr,
      currentServing,
      nextUp: waiting[0] || null,
      waiting,
      postponed,
      completedCount: completed.length,
      totalTurnsCount: activeTurns.length,
      allTurns: activeTurns,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error al consultar turnero en vivo:", error);
    return NextResponse.json(
      { error: "Error interno al consultar la fila virtual." },
      { status: 500 }
    );
  }
}
