import { getCurrentBusiness } from "@/lib/current-business";
import { redirect } from "next/navigation";
import BusinessReportsManager from "@/components/BusinessReportsManager";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  return <BusinessReportsManager business={business} />;
}
