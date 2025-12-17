import { getAidsProgramById, getProgramAssignments } from "@/lib/actions/aidsPrograms";
import { getCurrentUserAccess } from "@/lib/utils/access-control";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";
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

  const supabase = await getSupabaseReadOnlyClient();
  let zoneIds: number[] = [];
  let hasAccess = false;

  // Zone leaders can access programs assigned to their zone
  if (access.isZoneLeader && access.zoneId) {
    // Check if there are any assignments for this zone in this program
    const { data: zoneAssignments } = await supabase
      .from("aids_program_assignments")
      .select("zone_id")
      .eq("program_id", programId)
      .eq("zone_id", access.zoneId);

    if (zoneAssignments && zoneAssignments.length > 0) {
      hasAccess = true;
      zoneIds = [access.zoneId];
    }
  } else {
    // Regular staff: check for direct assignments
    const assignmentsResult = await getProgramAssignments(programId);
    const assignments = assignmentsResult.success ? assignmentsResult.data || [] : [];

    // Check for any assignment (assigned_staff, ketua_cawangan, or zone_leader)
    // Ensure both values are compared as numbers to handle potential type mismatches
    const userAssignments = assignments.filter(
      (a) => Number(a.assigned_to) === Number(access.staffId) &&
        (a.assignment_type === "ketua_cawangan" ||
          a.assignment_type === "assigned_staff" ||
          a.assignment_type === "zone_leader")
    );

    if (userAssignments.length > 0) {
      hasAccess = true;
      zoneIds = [...new Set(userAssignments.map((a) => a.zone_id))];
    }
  }

  if (!hasAccess) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            You are not assigned to this program. Please contact your administrator.
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

      {/* Show households for each zone the staff is assigned to */}
      {zoneIds.map((zoneId) => (
        <HouseholdDistributionList key={zoneId} programId={programId} zoneId={zoneId} />
      ))}
    </div>
  );
}
