import { getCurrentUserAccessReadOnly } from "@/lib/utils/accessControl";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";

export default async function StaffZonePage() {
  const access = await getCurrentUserAccessReadOnly();
  const supabase = await getSupabaseReadOnlyClient();

  if (!access.zoneId) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">My Zone</h1>
          <p className="text-gray-600 mt-1">Zone information and statistics</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">You are not assigned to any zone.</p>
        </div>
      </div>
    );
  }

  // Get zone details
  const { data: zone } = await supabase
    .from("zones")
    .select("*")
    .eq("id", access.zoneId)
    .single();

  // Get zone statistics
  const { count: householdsCount } = await supabase
    .from("households")
    .select("*", { count: "exact", head: true })
    .eq("zone_id", access.zoneId);

  const { count: issuesCount } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .eq("zone_id", access.zoneId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">My Zone</h1>
        <p className="text-gray-600 mt-1">{zone?.name || "Zone Information"}</p>
      </div>

      {zone && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Zone Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Zone Name</p>
                <p className="font-semibold mt-1">{zone.name}</p>
              </div>
              {zone.code && (
                <div>
                  <p className="text-sm text-gray-600">Zone Code</p>
                  <p className="font-semibold mt-1">{zone.code}</p>
                </div>
              )}
              {zone.description && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="mt-1">{zone.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600">Households</p>
              <p className="text-3xl font-bold mt-2">{householdsCount || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600">Issues</p>
              <p className="text-3xl font-bold mt-2">{issuesCount || 0}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
