import { redirect } from "next/navigation";
import { getCurrentUserAccessReadOnly, getWorkspaceAccess } from "@/lib/utils/access-control";

/**
 * Admin redirect page
 * - If authenticated and has admin access: redirects to /admin/dashboard
 * - If not authenticated: redirects to /admin/login
 */
export default async function MsAdminPage() {
  // Check workspace access
  const workspaceAccess = await getWorkspaceAccess();
  
  // Check authentication and staff status
  const access = await getCurrentUserAccessReadOnly();

  // If authenticated and has admin access, redirect to dashboard
  if (access.isAuthenticated && access.staffId && workspaceAccess.canAccessAdmin) {
    redirect("/admin/dashboard");
  }

  // Otherwise, redirect to login
  redirect("/admin/login");
}
