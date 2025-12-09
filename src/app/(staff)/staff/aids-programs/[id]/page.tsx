import { getAidsProgramById, getProgramAssignments } from "@/lib/actions/aidsPrograms";
import { getCurrentUserAccess } from "@/lib/utils/access-control";
import { notFound, redirect } from "next/navigation";
import HouseholdDistributionList from "./HouseholdDistributionList";

export default async function StaffAidsProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const programId = parseInt(id, 10);

  if (isNaN(programId)) {
    notFound();
  }

  const access = await getCurrentUserAccess();
  if (!access.isAuthenticated || !access.staffId) {
    redirect("/staff/login");
  }

  // Get program assignments for this staff member
  const assignmentsResult = await getProgramAssignments(programId);
  const assignments = assignmentsResult.success ? assignmentsResult.data || [] : [];
  
  const userAssignment = assignments.find(
    (a) => a.assigned_to === access.staffId && a.assignment_type === "ketua_cawangan"
  );

  if (!userAssignment) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            You are not assigned to this program. Please contact your zone leader.
          </p>
        </div>
      </div>
    );
  }

  const programResult = await getAidsProgramById(programId);
  if (!programResult.success || !programResult.data) {
    notFound();
  }

  const program = programResult.data;

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">{program.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{program.aid_type}</p>
      </div>

      <HouseholdDistributionList programId={programId} zoneId={userAssignment.zone_id} />
    </div>
  );
}
