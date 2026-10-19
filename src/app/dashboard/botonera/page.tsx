import { getCurrentBusiness } from "@/lib/current-business";
import { redirect } from "next/navigation";
import StationKioskManager from "@/components/StationKioskManager";

export const dynamic = "force-dynamic";

export default async function BotoneraPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  return <StationKioskManager business={business} />;
}
