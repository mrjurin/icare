import { getSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

type DbIssue = {
  id: number;
  title: string;
  category: string;
  status: string;
  created_at: string;
};

function statusBadge(s: string) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: "bg-orange-100 text-orange-600", label: "Pending" },
    in_progress: { cls: "bg-blue-100 text-blue-600", label: "In Progress" },
    resolved: { cls: "bg-green-100 text-green-600", label: "Resolved" },
    closed: { cls: "bg-gray-100 text-gray-600", label: "Closed" },
  };
  const m = map[s] ?? map.pending;
  return <span className={`inline-flex items-center rounded-full h-7 px-3 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

export default async function CommunityDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await getSupabaseServerClient();
  const sp = await searchParams;
  const active = typeof sp.status === "string" ? sp.status : undefined;
  const allowed = new Set(["pending", "in_progress", "resolved"]);
  const filter = allowed.has(active ?? "") ? active : undefined;
  let builder = supabase
    .from("issues")
    .select("id,title,category,status,created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (filter) {
    builder = builder.eq("status", filter);
  }
  const { data } = await builder;
  const issues: DbIssue[] = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-8">
      

      <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-primary">📣</span>
            <h3 className="text-lg font-bold">Recent Announcements</h3>
          </div>
          <button className="text-primary text-sm font-bold">View All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold">Community Hall Maintenance</h4>
            <p className="text-sm text-gray-600">The community hall will be closed for maintenance from August 1st to August 5th. We apologize for any inconvenience caused.</p>
            <button className="text-sm font-semibold text-primary mt-1">Read more</button>
          </div>
          <div>
            <h4 className="font-semibold">Upcoming Town Hall Meeting</h4>
            <p className="text-sm text-gray-600">Join us for the quarterly town hall meeting on July 28th at 7 PM to discuss upcoming community projects and address resident concerns.</p>
            <button className="text-sm font-semibold text-primary mt-1">Read more</button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-4xl font-black tracking-[-0.033em]">My Reported Issues</p>
      </div>
      <div className="border-b border-gray-300 px-1">
        <Link href="/community/dashboard" className={`px-3 py-3 text-sm font-bold ${!filter?"text-primary border-b-2 border-primary":"text-gray-500 hover:text-primary"}`}>All</Link>
        <Link href="/community/dashboard?status=pending" className={`px-3 py-3 text-sm font-bold ${filter==="pending"?"text-primary border-b-2 border-primary":"text-gray-500 hover:text-primary"}`}>Pending</Link>
        <Link href="/community/dashboard?status=in_progress" className={`px-3 py-3 text-sm font-bold ${filter==="in_progress"?"text-primary border-b-2 border-primary":"text-gray-500 hover:text-primary"}`}>In Progress</Link>
        <Link href="/community/dashboard?status=resolved" className={`px-3 py-3 text-sm font-bold ${filter==="resolved"?"text-primary border-b-2 border-primary":"text-gray-500 hover:text-primary"}`}>Resolved</Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="hidden sm:table-header-group">
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left w-[40%]">Issue</th>
              <th className="px-4 py-3 text-left w-[20%]">Category</th>
              <th className="px-4 py-3 text-left w-[15%]">Date Submitted</th>
              <th className="px-4 py-3 text-left w-[15%]">Status</th>
              <th className="px-4 py-3 text-left w-auto"></th>
            </tr>
          </thead>
          <tbody>
            {issues.map((it) => (
              <tr key={it.id} className="border-t block sm:table-row p-4 sm:p-0">
                <td className="px-4 py-2 block sm:table-cell">
                  <Link href={`/community/issues/${it.id}`} className="text-primary font-semibold hover:underline">
                    {it.title} (#{it.id})
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-600 block sm:table-cell">{it.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                <td className="px-4 py-2 text-gray-600 block sm:table-cell">{new Date(it.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2 block sm:table-cell">{statusBadge(it.status)}</td>
                <td className="px-4 py-2 block sm:table-cell sm:text-right">
                  <Link href={`/community/issues/${it.id}`} className="text-primary font-bold hover:underline">View Details</Link>
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={5}>No issues yet. Submit a new report to see it here.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
