import { getAidsProgramById, getProgramAssignments, getProgramZones } from "@/lib/actions/aidsPrograms";
import { notFound } from "next/navigation";
import ProgramDetails from "./ProgramDetails";
import AssignKetuaCawanganSection from "./AssignKetuaCawanganSection";

export default async function AidsProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const [zonesResult, assignmentsResult] = await Promise.all([
    getProgramZones(programId),
    getProgramAssignments(programId),
  ]);

  const zones = zonesResult.success ? zonesResult.data || [] : [];
  const assignments = assignmentsResult.success ? assignmentsResult.data || [] : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">{program.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{program.description || "AIDS Distribution Program"}</p>
      </div>

      <ProgramDetails program={program} zones={zones} assignments={assignments} />
      <AssignKetuaCawanganSection programId={programId} zones={zones} />
    </div>
  );
}
