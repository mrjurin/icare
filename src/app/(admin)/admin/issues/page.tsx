import { Plus, Search } from "lucide-react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import IssueFormModal from "./IssueFormModal";

type DbIssue = {
  id: number;
  title: string;
  category: string;
  status: string;
  created_at: string;
};

export default async function AdminIssuesPage() {
  const counters = [
    { label: "Total Open Issues", value: "142" },
    { label: "Pending Review", value: "31" },
    { label: "Resolved This Week", value: "58" },
  ];

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("issues")
    .select("id,title,category,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const rows: DbIssue[] = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Issues Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {counters.map((k, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-600">{k.label}</p>
            <p className="mt-2 text-5xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="p-3 md:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden />
              <Input placeholder="Search by keyword, ID, or reporter..." className="pl-9 w-full" />
            </div>
            <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
              <option>Status: All</option>
              <option>New</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
            <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
              <option>Type: All</option>
              <option>Infrastructure</option>
              <option>Utilities</option>
              <option>Sanitation</option>
              <option>Public Safety</option>
            </select>
            <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
              <option>Assigned: All</option>
              <option>Unassigned</option>
              <option>Team A</option>
              <option>Sanitation Dept.</option>
            </select>
            <Input asChild className="w-44">
              <input placeholder="Select date range" />
            </Input>
            <button className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white">Reset Filters</button>
            <IssueFormModal
              trigger={
                <button className="flex items-center justify-center gap-2 rounded-lg h-10 bg-primary px-4 text-white text-sm font-bold">
                  <Plus className="size-5" />
                  <span>New Issue</span>
                </button>
              }
            />
          </div>
        </div>
        <div className="h-px bg-gray-200" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="text-left">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3"><input type="checkbox" aria-label="Select all" className="size-4" /></th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Issue ID</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Title</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Date Submitted</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Category</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-200">
                <td className="px-4 py-3"><input type="checkbox" aria-label={`Select #${r.id}`} className="size-4" /></td>
                <td className="px-4 py-3 text-primary font-medium"><Link href={`/issues/${r.id}`}>#{r.id}</Link></td>
                <td className="px-4 py-3"><Link href={`/issues/${r.id}`} className="hover:text-primary">{r.title}</Link></td>
                <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">{r.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status==="pending"?"bg-blue-100 text-blue-800":r.status==="in_progress"?"bg-yellow-100 text-yellow-800":r.status==="resolved"?"bg-green-100 text-green-800":"bg-gray-100 text-gray-800"}`}>{r.status.replace(/_/g, " ")}</span>
                </td>
                <td className="px-4 py-3 text-right">⋯</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
