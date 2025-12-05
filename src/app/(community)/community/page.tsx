import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CommunityIndexPage() {
  const h = await headers();
  const cookieHeader = h.get("cookie") ?? "";
  const isAuth = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .some((kv) => kv.startsWith("community_auth="));
  if (!isAuth) redirect("/community/login");
  redirect("/community/dashboard");
}
