import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug requerido" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set("selected_business_slug", slug, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("Error al cambiar negocio:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
