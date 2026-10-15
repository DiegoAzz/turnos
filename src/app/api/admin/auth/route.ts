import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "AdminTurnos2026!";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password !== SUPERADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Contraseña de Super Admin incorrecta." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("turnos_admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    return NextResponse.json({ success: true, message: "Sesión iniciada con éxito." });
  } catch (error) {
    console.error("Error en autenticación admin:", error);
    return NextResponse.json({ error: "Error en el servidor." }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("turnos_admin_session");
  const isAuthenticated = session?.value === "authenticated";

  return NextResponse.json({ isAuthenticated });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("turnos_admin_session");
  return NextResponse.json({ success: true, message: "Sesión cerrada." });
}
