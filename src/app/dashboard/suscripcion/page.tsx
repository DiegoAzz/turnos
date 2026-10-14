import { prisma } from "@/lib/prisma";
import SubscriptionManager from "./SubscriptionManager";


export default async function SuscripcionPage() {
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!business) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suscripción & Facturación</h1>
        <p className="text-sm text-gray-500">
          Gestiona tu plan activo de TurnoYa y accede a todas las funciones Pro.
        </p>
      </div>

      <SubscriptionManager business={business} />
    </div>
  );
}
