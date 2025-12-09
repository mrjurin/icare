import { Plus, Search } from "lucide-react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import IssueFormModal from "./IssueFormModal";

type DbIssue = {
  id: number;
  title: string;
  category: string;
  status: string;
  created_at: string;
};

export default async function AdminIssuesPage() {
  const t = await getTranslations("issues.list");
  
  const counters = [
    { label: t("counters.totalOpenIssues"), value: "142" },
    { label: t("counters.pendingReview"), value: "31" },
    { label: t("counters.resolvedThisWeek"), value: "58" },
  ];

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("issues")
    .select("id,title,category,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const rows: DbIssue[] = Array.isArray(data) ? data : [];

  const statusLabels: Record<string, string> = {
    pending: t("status.pending"),
    in_progress: t("status.inProgress"),
    resolved: t("status.resolved"),
    closed: t("status.closed"),
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{t("title")}</h1>

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
              <Input placeholder={t("searchPlaceholder")} className="pl-9 w-full" />
            </div>
            <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
              <option>{t("filters.status.label")}</option>
              <option>{t("filters.status.new")}</option>
              <option>{t("filters.status.inProgress")}</option>
              <option>{t("filters.status.resolved")}</option>
              <option>{t("filters.status.closed")}</option>
            </select>
            <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
              <option>{t("filters.type.label")}</option>
              <option>{t("filters.type.infrastructure")}</option>
              <option>{t("filters.type.utilities")}</option>
              <option>{t("filters.type.sanitation")}</option>
              <option>{t("filters.type.publicSafety")}</option>
            </select>
            <select className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900">
              <option>{t("filters.assigned.label")}</option>
              <option>{t("filters.assigned.unassigned")}</option>
              <option>{t("filters.assigned.teamA")}</option>
              <option>{t("filters.assigned.sanitationDept")}</option>
            </select>
            <Input asChild className="w-44">
              <input placeholder={t("filters.dateRange")} />
            </Input>
            <button className="h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white">{t("filters.resetFilters")}</button>
            <IssueFormModal
              trigger={
                <button className="flex items-center justify-center gap-2 rounded-lg h-10 bg-primary px-4 text-white text-sm font-bold">
                  <Plus className="size-5" />
                  <span>{t("newIssue")}</span>
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
              <th className="px-4 py-3"><input type="checkbox" aria-label={t("table.selectAll")} className="size-4" /></th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.issueId")}</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.title")}</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.dateSubmitted")}</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.category")}</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.status")}</th>
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
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status==="pending"?"bg-blue-100 text-blue-800":r.status==="in_progress"?"bg-yellow-100 text-yellow-800":r.status==="resolved"?"bg-green-100 text-green-800":"bg-gray-100 text-gray-800"}`}>{statusLabels[r.status] || r.status.replace(/_/g, " ")}</span>
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
