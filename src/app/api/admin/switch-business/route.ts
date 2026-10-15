import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, setBusinessSessionCookie } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug requerido" }, { status: 400 });
    }

    await setBusinessSessionCookie(slug);

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("Error al cambiar negocio:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
