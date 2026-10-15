import { getCurrentBusiness } from "@/lib/current-business";
import { redirect } from "next/navigation";
import DashboardClientActions from "../DashboardClientActions";

export const dynamic = "force-dynamic";

export default async function CitasPage() {
  const business = await getCurrentBusiness({
    appointments: {
      include: { service: true },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
    },
  });

  if (!business) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Citas y Turnos</h1>
          <p className="text-sm text-gray-500">
            Historial completo de clientes, reservas y estados.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <DashboardClientActions
          initialAppointments={business.appointments || []}
          business={business}
        />
      </div>
    </div>
  );
}
