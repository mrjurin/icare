import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function CommunityIndexPage() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect("/community/login");
  }
  
  redirect("/community/dashboard");
}
