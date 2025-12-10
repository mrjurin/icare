import { getAidsProgramById, getProgramAssignments, getProgramZones, getProgramZoneProgress, getProgramAssignedStaffIds } from "@/lib/actions/aidsPrograms";
import { notFound } from "next/navigation";
import ProgramDetails from "./ProgramDetails";
import AssignKetuaCawanganSection from "./AssignKetuaCawanganSection";
import AssignStaffSection from "./AssignStaffSection";
import { getTranslations } from "next-intl/server";

export default async function AidsProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("aidsPrograms.detail");
  const { id } = await params;
  const programId = parseInt(id, 10);

  if (isNaN(programId)) {
    notFound();
  }

  const programResult = await getAidsProgramById(programId);
  if (!programResult.success || !programResult.data) {
    notFound();
  }

  const program = programResult.data;

  const [zonesResult, assignmentsResult, zoneProgressResult, assignedStaffResult] = await Promise.all([
    getProgramZones(programId),
    getProgramAssignments(programId),
    getProgramZoneProgress(programId),
    getProgramAssignedStaffIds(programId),
  ]);

  const zones = zonesResult.success ? zonesResult.data || [] : [];
  const assignments = assignmentsResult.success ? assignmentsResult.data || [] : [];
  const zoneProgress = zoneProgressResult.success ? zoneProgressResult.data || [] : [];
  const assignedStaffIds = assignedStaffResult.success ? assignedStaffResult.data || [] : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{program.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{program.description || t("title")}</p>
      </div>

      <ProgramDetails program={program} zones={zones} assignments={assignments} zoneProgress={zoneProgress} />
      <AssignStaffSection program={program} assignedStaffIds={assignedStaffIds} />
      <AssignKetuaCawanganSection programId={programId} zones={zones} />
    </div>
  );
}
