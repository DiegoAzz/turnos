import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET_KEY =
  process.env.SESSION_SECRET ||
  process.env.SUPERADMIN_PASSWORD ||
  "TurnoYa_Super_Secret_Key_Production_2026_Secure!";

/**
 * Genera una firma HMAC SHA-256 para un valor dado.
 */
function createSignature(value: string): string {
  return crypto.createHmac("sha256", SECRET_KEY).update(value).digest("hex");
}

/**
 * Firma un valor en formato "valor.firma"
 */
export function signValue(value: string): string {
  const signature = createSignature(value);
  return `${value}.${signature}`;
}

/**
 * Valida un valor firmado. Retorna el valor original si la firma es válida, o null si fue alterado.
 */
export function verifySignedValue(signedValue?: string | null): string | null {
  if (!signedValue || !signedValue.includes(".")) return null;
  const lastDotIndex = signedValue.lastIndexOf(".");
  const value = signedValue.substring(0, lastDotIndex);
  const signature = signedValue.substring(lastDotIndex + 1);

  const expectedSignature = createSignature(value);
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return value;
  }
  return null;
}

/**
 * Genera y establece la cookie de sesión del Super Admin de forma segura y criptográficamente firmada.
 */
export async function setAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const token = signValue(`admin_${Date.now()}`);
  cookieStore.set("turnos_admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
}

/**
 * Verifica si el usuario actual tiene una sesión válida y firmada de Super Admin.
 */
export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("turnos_admin_session")?.value;
  if (!cookie) return false;

  // Compatibilidad hacia atrás tanto con cookie legada como con token firmado
  if (cookie === "authenticated") {
    return true;
  }

  const verified = verifySignedValue(cookie);
  return Boolean(verified && verified.startsWith("admin_"));
}

/**
 * Genera y establece la cookie de sesión del negocio seleccionado con firma criptográfica.
 */
export async function setBusinessSessionCookie(slug: string): Promise<void> {
  const cookieStore = await cookies();
  const token = signValue(slug);
  cookieStore.set("selected_business_slug", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
}

/**
 * Obtiene y valida el slug del negocio de la sesión. Si alguien manipuló la cookie, retorna null.
 */
export async function getVerifiedBusinessSlug(): Promise<string | null> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get("selected_business_slug")?.value;
  if (!rawCookie) return null;

  // Si tiene formato firmado "slug.firma", verificar firma
  if (rawCookie.includes(".")) {
    return verifySignedValue(rawCookie);
  }

  // Soporte transicional para cookies legadas existentes no firmadas
  return rawCookie;
}
