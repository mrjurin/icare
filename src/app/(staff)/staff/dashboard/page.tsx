import { getCurrentUserAccessReadOnly } from "@/lib/utils/accessControl";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";

export default async function StaffDashboardPage() {
  const access = await getCurrentUserAccessReadOnly();
  const supabase = await getSupabaseReadOnlyClient();

  // Get staff details
  const { data: staffData } = await supabase
    .from("staff")
    .select("name, role, position, zone_id")
    .eq("id", access.staffId)
    .single();

  // Get assigned issues count
  const { count: issuesCount } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .eq("assigned_staff_id", access.staffId);

  // Get zone info if zone_leader
  let zoneInfo = null;
  if (access.zoneId && staffData?.zone_id) {
    const { data: zone } = await supabase
      .from("zones")
      .select("name, code")
      .eq("id", access.zoneId)
      .single();
    zoneInfo = zone;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">
          Welcome back, {staffData?.name || "Staff"}!
        </h1>
        <p className="text-gray-600 mt-1">
          {staffData?.position || "Staff Member"} • {staffData?.role?.replace("_", " ").toUpperCase() || "STAFF"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned Issues</p>
              <p className="text-3xl font-bold mt-2">{issuesCount || 0}</p>
            </div>
            <div className="size-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="size-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {zoneInfo && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Zone</p>
                <p className="text-lg font-semibold mt-2">{zoneInfo.name}</p>
                <p className="text-sm text-gray-500">{zoneInfo.code}</p>
              </div>
              <div className="size-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="size-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="text-lg font-semibold mt-2">
                {staffData?.role?.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Staff"}
              </p>
            </div>
            <div className="size-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="size-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/staff/issues"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="size-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">View My Issues</p>
              <p className="text-sm text-gray-600">Check assigned issues and tasks</p>
            </div>
          </a>

          {zoneInfo && (
            <a
              href="/staff/zone"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="size-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="size-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">My Zone</p>
                <p className="text-sm text-gray-600">View zone details and statistics</p>
              </div>
            </a>
          )}

          <a
            href="/staff/notifications"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
          >
            <div className="size-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <svg className="size-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-gray-600">View recent updates and alerts</p>
            </div>
          </a>

          <a
            href="/staff/profile"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <div className="size-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="size-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">My Profile</p>
              <p className="text-sm text-gray-600">Update your profile information</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
