"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import IssueActionsButtonWrapper from "./IssueActionsButtonWrapper";

type DbIssue = {
  id: number;
  title: string;
  category: string;
  status: string;
  created_at: string;
  reporter_id: number | null;
  reporter_name: string | null;
};

type IssuesTableProps = {
  issues: DbIssue[];
};

export default function IssuesTable({ issues }: IssuesTableProps) {
  const t = useTranslations("issues.list");
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const statusLabels: Record<string, string> = {
    pending: t("status.pending"),
    in_progress: t("status.inProgress"),
    resolved: t("status.resolved"),
    closed: t("status.closed"),
  };

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) {
      return issues;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return issues.filter((issue) => {
      // Search by ID (e.g., "123" or "#123")
      const issueId = issue.id.toString();
      const issueIdWithHash = `#${issueId}`;
      if (issueId.includes(query) || issueIdWithHash.includes(query)) {
        return true;
      }

      // Search by title
      if (issue.title.toLowerCase().includes(query)) {
        return true;
      }

      // Search by reporter name
      if (issue.reporter_name?.toLowerCase().includes(query)) {
        return true;
      }

      // Search by category
      const category = issue.category.replace(/_/g, " ").toLowerCase();
      if (category.includes(query)) {
        return true;
      }

      return false;
    });
  }, [issues, searchQuery]);

  if (filteredRows.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        <p>{t("table.noIssues")}</p>
      </div>
    );
  }

  return (
    <table className="min-w-full text-sm">
      <thead className="text-left">
        <tr className="border-b border-gray-200">
          <th className="px-4 py-3">
            <input type="checkbox" aria-label={t("table.selectAll")} className="size-4" />
          </th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.issueId")}</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.title")}</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.dateSubmitted")}</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.category")}</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.reporter")}</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">{t("table.status")}</th>
          <th className="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody>
        {filteredRows.map((r) => (
          <tr key={r.id} className="border-t border-gray-200">
            <td className="px-4 py-3">
              <input type="checkbox" aria-label={`Select #${r.id}`} className="size-4" />
            </td>
            <td className="px-4 py-3 text-primary font-medium">
              <Link href={`/admin/issues/${r.id}`}>#{r.id}</Link>
            </td>
            <td className="px-4 py-3">
              <Link href={`/admin/issues/${r.id}`} className="hover:text-primary">
                {r.title}
              </Link>
            </td>
            <td className="px-4 py-3">
              {new Date(r.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </td>
            <td className="px-4 py-3">
              {r.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </td>
            <td className="px-4 py-3">{r.reporter_name || "—"}</td>
            <td className="px-4 py-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  r.status === "pending"
                    ? "bg-blue-100 text-blue-800"
                    : r.status === "in_progress"
                      ? "bg-yellow-100 text-yellow-800"
                      : r.status === "resolved"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {statusLabels[r.status] || r.status.replace(/_/g, " ")}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <IssueActionsButtonWrapper issueId={r.id} reporterId={r.reporter_id} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
