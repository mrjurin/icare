import { redirect } from "next/navigation";
import { getSupabaseReadOnlyClient } from "@/lib/supabase/server";

export default async function CommunityIndexPage() {
  const supabase = await getSupabaseReadOnlyClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/community/login");
  }

  redirect("/community/dashboard");
}
