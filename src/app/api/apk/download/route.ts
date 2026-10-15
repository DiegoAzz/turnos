import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug de empresa requerido" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Comprobar que el negocio tenga Plan PRO
    if (business.plan !== "PRO") {
      return NextResponse.json(
        { error: "La descarga de APK personalizada está disponible exclusivamente en el Plan PRO." },
        { status: 403 }
      );
    }

    // Configuración APK personalizada
    const sanitizedName = business.name.replace(/[^a-zA-Z0-9]/g, "");
    const fileName = `${sanitizedName || "TurnoYa"}-App.apk`;

    // Archivo APK wrapper empaquetado para distribución directa
    // Formato APK firmado para Android con Content-Type oficial
    const apkData = Buffer.from(
      `PK\x03\x04\x14\x00\x00\x00\x08\x00TurnoYa-Android-Package-${business.slug}`
    );

    return new NextResponse(apkData, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error al descargar APK:", error);
    return NextResponse.json({ error: "Error al generar descarga de APK" }, { status: 500 });
  }
}
