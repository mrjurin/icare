import { getCurrentUserAccessReadOnly } from "@/lib/utils/access-control";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";

export default async function StaffIssuesPage() {
  const access = await getCurrentUserAccessReadOnly();
  const supabase = await getSupabaseReadOnlyClient();

  // Get issues assigned to this staff member
  const { data: issues } = await supabase
    .from("issues")
    .select("*")
    .eq("assigned_staff_id", access.staffId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">My Issues</h1>
        <p className="text-gray-600 mt-1">Issues assigned to you</p>
      </div>

      {issues && issues.length > 0 ? (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{issue.title}</h3>
                  <p className="text-gray-600 mt-1">{issue.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>Status: {issue.status}</span>
                    <span>Priority: {issue.priority || "Normal"}</span>
                    <span>Created: {new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No issues assigned to you yet.</p>
        </div>
      )}
    </div>
  );
}
