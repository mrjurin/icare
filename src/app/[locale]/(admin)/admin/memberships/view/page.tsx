import { getMemberships } from "@/lib/actions/memberships";
import MembershipsTable from "./MembershipsTable";
import { getCurrentUserAccess } from "@/lib/utils/access-control";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import Button from "@/components/ui/Button";

export default async function ViewMembershipsPage() {
  const access = await getCurrentUserAccess();

  // Only admin and zone leaders can access
  if (!access.isSuperAdmin && !access.isAdun && !access.isZoneLeader) {
    redirect("/admin");
  }

  const membershipsResult = await getMemberships();
  const memberships = membershipsResult.success ? membershipsResult.data || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Approved Memberships</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage approved party memberships
          </p>
        </div>
        <Link href="/admin/memberships">
          <Button variant="outline">View Applications</Button>
        </Link>
      </div>

      <MembershipsTable memberships={memberships} />
    </div>
  );
}
