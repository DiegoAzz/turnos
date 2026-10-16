import { NextResponse } from "next/server";
import { clearAdminSessionCookie, clearBusinessSessionCookie } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearBusinessSessionCookie();
  await clearAdminSessionCookie();
  return NextResponse.json({ success: true, redirectUrl: "/login" });
}

export async function GET(req: Request) {
  await clearBusinessSessionCookie();
  await clearAdminSessionCookie();

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";

  if (host && !host.includes("0.0.0.0") && !host.includes("127.0.0.1") && !host.includes("localhost")) {
    return NextResponse.redirect(`${proto}://${host}/login`);
  }

  const fallbackAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://turnos.appzplay.online";
  return NextResponse.redirect(`${fallbackAppUrl}/login`);
}
