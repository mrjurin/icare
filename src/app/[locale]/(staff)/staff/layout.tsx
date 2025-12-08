import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserAccessReadOnly, getWorkspaceAccess } from "@/lib/utils/accessControl";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import StaffLayoutWrapper from "./StaffLayoutWrapper";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  // Check workspace access
  const workspaceAccess = await getWorkspaceAccess();
  
  // Allow both staff and admin users to access staff workspace
  // Only redirect if user has no staff/admin access
  if (!workspaceAccess.canAccessStaff && !workspaceAccess.canAccessAdmin) {
    // Redirect based on user's actual workspace
    if (workspaceAccess.canAccessCommunity) {
      redirect("/community/dashboard");
    }
    // If no workspace access and not going to login, let the client component handle it
  }

  // Check authentication and staff status using read-only client
  const access = await getCurrentUserAccessReadOnly();

  // If not authenticated or not a staff member, let the client component handle redirect
  // This prevents the redirect loop since the client component can detect if we're on login page
  if (!access.isAuthenticated || !access.staffId) {
    // Use client component to check pathname and conditionally redirect
    return <StaffLayoutWrapper staffName="" staffPosition="">{children}</StaffLayoutWrapper>;
  }

  // Get staff details for display using read-only client
  const supabase = await getSupabaseReadOnlyClient();
  const { data: staffData } = await supabase
    .from("staff")
    .select("name, role, position")
    .eq("id", access.staffId)
    .single();

  const staffName = staffData?.name || "Staff";
  const staffRole = staffData?.role || "staff";
  const staffPosition = staffData?.position || "Staff Member";

  return (
    <StaffLayoutWrapper staffName={staffName} staffPosition={staffPosition}>
      {children}
    </StaffLayoutWrapper>
  );
}
