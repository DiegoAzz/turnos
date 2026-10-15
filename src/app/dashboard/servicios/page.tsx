import { getCurrentBusiness } from "@/lib/current-business";
import { redirect } from "next/navigation";
import ServiciosManager from "./ServiciosManager";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  const business = await getCurrentBusiness({
    services: {
      orderBy: { createdAt: "desc" },
    },
  });

  if (!business) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Servicios</h1>
          <p className="text-sm text-gray-500">
            Define la duración y el precio de cada servicio que ofreces a tus clientes.
          </p>
        </div>
      </div>

      <ServiciosManager initialServices={business.services || []} business={business} />
    </div>
  );
}
