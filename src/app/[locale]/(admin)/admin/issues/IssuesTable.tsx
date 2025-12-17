"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import IssueActionsButtonWrapper from "./IssueActionsButtonWrapper";

type DbIssue = {
  id: number;
  title: string;
  category: string;
  status: string;
  created_at: string;
  reporter_id: number | null;
  reporter_name: string | null;
  issue_type_name?: string | null;
  issue_status_name?: string | null;
  issue_status_id?: number | null;
};

type IssuesTableProps = {
  issues: DbIssue[];
};

export default function IssuesTable({ issues }: IssuesTableProps) {
  const t = useTranslations("issues.list");

  const statusLabels: Record<string, string> = {
    pending: t("status.pending"),
    in_progress: t("status.inProgress"),
    resolved: t("status.resolved"),
    closed: t("status.closed"),
  };

  // Helper function to get status display name
  // Uses the 'name' field from issue_statuses table (user-friendly), not the 'code' field
  const getStatusDisplay = (issue: DbIssue): string => {
    if (issue.issue_status_name) {
      return issue.issue_status_name; // This is the 'name' field from issue_statuses table
    }
    // Fallback to enum status with translation
    return statusLabels[issue.status] || issue.status.replace(/_/g, " ");
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (issue: DbIssue): string => {
    const statusName = (issue.issue_status_name || issue.status).toLowerCase();
    if (statusName.includes("pending") || statusName === "pending") {
      return "bg-blue-100 text-blue-800";
    } else if (statusName.includes("in_progress") || statusName.includes("in progress") || statusName === "in_progress") {
      return "bg-yellow-100 text-yellow-800";
    } else if (statusName.includes("resolved") || statusName === "resolved") {
      return "bg-green-100 text-green-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  if (issues.length === 0) {
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
        {issues.map((r) => (
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
              {r.issue_type_name || (r.category ? r.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—")}
            </td>
            <td className="px-4 py-3">{r.reporter_name || "—"}</td>
            <td className="px-4 py-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(r)}`}
              >
                {getStatusDisplay(r)}
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