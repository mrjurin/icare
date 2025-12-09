import { getMembershipApplications } from "@/lib/actions/memberships";
import MembershipApplicationsTable from "./MembershipApplicationsTable";
import { getCurrentUserAccess } from "@/lib/utils/access-control";
import { redirect } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default async function MembershipsPage() {
  const access = await getCurrentUserAccess();

  // Only admin and zone leaders can access
  if (!access.isSuperAdmin && !access.isAdun && !access.isZoneLeader) {
    redirect("/admin");
  }

  const applicationsResult = await getMembershipApplications();
  const applications = applicationsResult.success ? applicationsResult.data || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Membership Applications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage party membership applications
          </p>
        </div>
        <Link href="/admin/memberships/view">
          <Button variant="outline">View Approved Memberships</Button>
        </Link>
      </div>

      <MembershipApplicationsTable applications={applications} />
    </div>
  );
}
