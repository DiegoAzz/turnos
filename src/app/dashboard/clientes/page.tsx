import { getCurrentBusiness } from "@/lib/current-business";
import { redirect } from "next/navigation";
import CustomersManager from "@/components/CustomersManager";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  return <CustomersManager business={business} />;
}
