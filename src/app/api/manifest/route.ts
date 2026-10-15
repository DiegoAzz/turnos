import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    let business = null;
    if (slug) {
      business = await prisma.business.findUnique({
        where: { slug },
      });
    }

    const appName = business?.name || "TurnoYa - Reservas Online";
    const shortName = business?.name
      ? business.name.length > 12
        ? business.name.substring(0, 12)
        : business.name
      : "TurnoYa";
    const startUrl = business ? `/p/${business.slug}` : "/";
    const logoUrl = business?.logoUrl || "/file.svg";

    const manifest = {
      name: appName,
      short_name: shortName,
      description: business?.description || `Reserva tus turnos y citas en ${appName}`,
      start_url: startUrl,
      id: startUrl,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#059669",
      orientation: "portrait",
      icons: [
        {
          src: logoUrl,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable",
        },
        {
          src: logoUrl,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
      categories: ["business", "lifestyle", "productivity"],
    };

    return new NextResponse(JSON.stringify(manifest, null, 2), {
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Error al generar manifest:", error);
    return NextResponse.json({ error: "Error al generar manifest" }, { status: 500 });
  }
}
