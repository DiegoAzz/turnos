import { getCurrentBusiness } from "@/lib/current-business";
import { redirect } from "next/navigation";
import AppMovilManager from "@/components/AppMovilManager";

export const dynamic = "force-dynamic";

export default async function AppMovilPage() {
  const business = await getCurrentBusiness();

  if (!business) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aplicación Móvil Android (APK)</h1>
        <p className="text-sm text-gray-500">
          Descarga la APK de tu negocio, instálala en tu celular o compártela con tus clientes.
        </p>
      </div>

      <AppMovilManager business={business} />
    </div>
  );
}
