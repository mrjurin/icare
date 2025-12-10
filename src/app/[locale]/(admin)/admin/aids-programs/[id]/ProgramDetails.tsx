"use client";

import { AidsProgram, AidsProgramZone, AidsProgramAssignment, ZoneProgressStats } from "@/lib/actions/aidsPrograms";
import { useTranslations } from "next-intl";

type ProgramDetailsProps = {
  program: AidsProgram;
  zones: AidsProgramZone[];
  assignments: AidsProgramAssignment[];
  zoneProgress: ZoneProgressStats[];
};

export default function ProgramDetails({ program, zones, assignments, zoneProgress }: ProgramDetailsProps) {
  const t = useTranslations("aidsPrograms.detail");
  const tTable = useTranslations("aidsPrograms.table");
  
  // Calculate overall progress
  const totalHouseholds = zoneProgress.reduce((sum, zp) => sum + zp.total_households, 0);
  const totalDistributed = zoneProgress.reduce((sum, zp) => sum + zp.distributed_households, 0);
  const overallProgress =
    totalHouseholds > 0
      ? Math.round((totalDistributed / totalHouseholds) * 100)
      : 0;

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: tTable("statuses.draft"),
      active: tTable("statuses.active"),
      completed: tTable("statuses.completed"),
      cancelled: tTable("statuses.cancelled"),
    };
    return statusMap[status] || status;
  };

  return (
    <div className="bg-white dark:bg-background-dark rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("aidType")}</h3>
          <p className="text-lg font-semibold">{program.aid_type}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("status")}</h3>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              program.status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                : program.status === "completed"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {getStatusLabel(program.status)}
          </span>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("progress")}</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {totalDistributed}/{totalHouseholds}
            </span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("createdBy")}</h3>
          <p className="text-lg">{program.creator_name || t("unknown")}</p>
        </div>
      </div>

      {zoneProgress.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t("assignedZonesVillages")}</h3>
          <div className="space-y-3">
            {zoneProgress.map((zp, index) => {
              const zoneProgressPercent =
                zp.total_households > 0
                  ? Math.round((zp.distributed_households / zp.total_households) * 100)
                  : 0;

              return (
                <div
                  key={`${zp.zone_id}-${zp.village_id || index}`}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      {zp.zone_name && <span className="font-medium">{zp.zone_name}</span>}
                      {zp.village_name && (
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                          - {zp.village_name}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {zp.distributed_households}/{zp.total_households}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${zoneProgressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
                      {zoneProgressPercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {assignments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t("assignments")}</h3>
          <div className="space-y-2">
            {assignments.map((assignment) => {
              const getAssignmentTypeLabel = () => {
                switch (assignment.assignment_type) {
                  case "zone_leader":
                    return t("zoneLeader");
                  case "ketua_cawangan":
                    return t("branchChief");
                  case "assigned_staff":
                    return t("assignedStaff") || "Assigned Staff";
                  default:
                    return assignment.assignment_type;
                }
              };

              return (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{assignment.assigned_to_name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({getAssignmentTypeLabel()})
                      </span>
                    </div>
                    {assignment.zone_name && (
                      <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
                        Zone: {assignment.zone_name}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      assignment.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {assignment.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
