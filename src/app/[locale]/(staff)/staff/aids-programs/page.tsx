import { getAidsPrograms } from "@/lib/actions/aidsPrograms";
import AidsProgramsList from "./AidsProgramsList";

export default async function StaffAidsProgramsPage() {
  const result = await getAidsPrograms({ status: "active" });

  const programs = result.success ? result.data || [] : [];

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">AIDS Distribution Programs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
          Select a program to mark household distribution
        </p>
      </div>

      <AidsProgramsList programs={programs} />
    </div>
  );
}
