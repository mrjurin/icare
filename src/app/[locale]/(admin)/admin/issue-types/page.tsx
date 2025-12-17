import { getAllIssueTypes } from "@/lib/actions/issue-types";
import IssueTypesTable from "./IssueTypesTable";

export default async function AdminIssueTypesPage() {
  const result = await getAllIssueTypes();
  const issueTypes = result.success ? result.data || [] : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">
            Issue Types Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage issue types that community users can select when reporting issues
          </p>
        </div>
      </div>

      <IssueTypesTable data={issueTypes} />
    </div>
  );
}















