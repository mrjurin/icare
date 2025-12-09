import { redirect } from "next/navigation";
import { getCurrentUserAccessReadOnly } from "@/lib/utils/access-control";

export default async function StaffPage() {
  // Check authentication and staff status
  const access = await getCurrentUserAccessReadOnly();

  // Redirect to login if not authenticated or not a staff member
  if (!access.isAuthenticated || !access.staffId) {
    redirect("/staff/login");
  }

  // If authenticated, redirect to dashboard
  redirect("/staff/dashboard");
}
