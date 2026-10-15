import { prisma } from "@/lib/prisma";
import { getVerifiedBusinessSlug, verifyAdminSession } from "@/lib/auth-security";

export async function getCurrentBusiness(includeOptions?: any): Promise<any> {
  const selectedSlug = await getVerifiedBusinessSlug();
  const isAdmin = await verifyAdminSession();

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
