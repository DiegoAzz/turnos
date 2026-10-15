import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getCurrentBusiness(includeOptions?: any): Promise<any> {
  const cookieStore = await cookies();
  const selectedSlug = cookieStore.get("selected_business_slug")?.value;

  let business: any = null;
  if (selectedSlug) {
    business = await prisma.business.findUnique({
      where: { slug: selectedSlug },
      ...(includeOptions ? { include: includeOptions } : {}),
    });
  }

  if (!business) {
    business = await prisma.business.findFirst({
      orderBy: { createdAt: "asc" },
      ...(includeOptions ? { include: includeOptions } : {}),
    });
  }

  return business;
}
