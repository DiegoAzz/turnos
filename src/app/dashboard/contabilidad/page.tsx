import { getCurrentBusiness } from "@/lib/current-business";
import { redirect } from "next/navigation";
import ContabilidadManager from "@/components/ContabilidadManager";

export const dynamic = "force-dynamic";

export default async function ContabilidadPage() {
  const business = await getCurrentBusiness();

  if (!business) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Módulo Contable & Finanzas</h1>
          <p className="text-sm text-gray-500">
            Control de ingresos por citas atendidas, registro de gastos y ganancia neta.
          </p>
        </div>
      </div>

      <ContabilidadManager business={business} />
    </div>
  );
}
