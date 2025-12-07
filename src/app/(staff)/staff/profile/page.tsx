import { getCurrentUserAccessReadOnly } from "@/lib/utils/accessControl";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";

export default async function StaffProfilePage() {
  const access = await getCurrentUserAccessReadOnly();
  const supabase = await getSupabaseReadOnlyClient();

  // Get staff details
  const { data: staffData } = await supabase
    .from("staff")
    .select("*")
    .eq("id", access.staffId)
    .single();

  // Get zone info if assigned
  let zoneInfo = null;
  if (staffData?.zone_id) {
    const { data: zone } = await supabase
      .from("zones")
      .select("name, code")
      .eq("id", staffData.zone_id)
      .single();
    zoneInfo = zone;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">My Profile</h1>
        <p className="text-gray-600 mt-1">View and manage your profile information</p>
      </div>

      {staffData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold mt-1">{staffData.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold mt-1">{staffData.email}</p>
            </div>
            {staffData.phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold mt-1">{staffData.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-semibold mt-1">
                {staffData.role?.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Staff"}
              </p>
            </div>
            {staffData.position && (
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="font-semibold mt-1">{staffData.position}</p>
              </div>
            )}
            {zoneInfo && (
              <div>
                <p className="text-sm text-gray-600">Assigned Zone</p>
                <p className="font-semibold mt-1">{zoneInfo.name} ({zoneInfo.code})</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold mt-1 capitalize">{staffData.status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
