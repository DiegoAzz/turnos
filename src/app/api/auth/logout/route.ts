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
  const url = new URL("/login", req.url);
  return NextResponse.redirect(url);
}
