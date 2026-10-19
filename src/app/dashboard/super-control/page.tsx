import { getCurrentBusiness } from "@/lib/current-business";
import { redirect } from "next/navigation";
import SuperAdminControlCenter from "@/components/SuperAdminControlCenter";

export const dynamic = "force-dynamic";

export default async function SuperControlPage() {
  const business = await getCurrentBusiness({
    services: true,
    staffMembers: true,
  });

  if (!business) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <SuperAdminControlCenter business={business} />
    </div>
  );
}
