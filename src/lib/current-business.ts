import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getCurrentBusiness(includeOptions?: any): Promise<any> {
  const cookieStore = await cookies();
  const selectedSlug = cookieStore.get("selected_business_slug")?.value;
  const adminSession = cookieStore.get("turnos_admin_session")?.value;
  const isAdmin = adminSession === "authenticated";

  let business: any = null;
  if (selectedSlug) {
    business = await prisma.business.findUnique({
      where: { slug: selectedSlug },
      ...(includeOptions ? { include: includeOptions } : {}),
    });
  }

  // Solo el Super Admin autenticado tiene fallback al primer negocio si no ha seleccionado ninguno
  if (!business && isAdmin) {
    business = await prisma.business.findFirst({
      orderBy: { createdAt: "asc" },
      ...(includeOptions ? { include: includeOptions } : {}),
    });
  }

  return business;
}
