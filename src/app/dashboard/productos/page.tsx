import { getCurrentBusiness } from "@/lib/current-business";
import { redirect } from "next/navigation";
import ProductsManager from "@/components/ProductsManager";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const business = await getCurrentBusiness();

  if (!business) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Productos & Tienda</h1>
        <p className="text-sm text-gray-500">
          Controla tu inventario, precios y registra ventas rápidas en mostrador que suman a tu caja contable.
        </p>
      </div>

      <ProductsManager business={business} />
    </div>
  );
}
