import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StationKioskManager from "@/components/StationKioskManager";

export const dynamic = "force-dynamic";

export default async function PublicKioskPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).trim();

  const business = await prisma.business.findFirst({
    where: {
      OR: [
        { slug: decodedSlug },
        { slug: decodedSlug.toLowerCase() },
        { slug: { equals: decodedSlug, mode: "insensitive" } },
      ],
    },
  });

  if (!business) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <StationKioskManager business={business} />
      </div>
    </div>
  );
}
