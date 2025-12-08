"use client";

import { AidsProgram, AidsProgramZone, AidsProgramAssignment } from "@/lib/actions/aidsPrograms";

type ProgramDetailsProps = {
  program: AidsProgram;
  zones: AidsProgramZone[];
  assignments: AidsProgramAssignment[];
};

export default function ProgramDetails({ program, zones, assignments }: ProgramDetailsProps) {
  const progress =
    program.total_households && program.total_households > 0
      ? Math.round(((program.distributed_households || 0) / program.total_households) * 100)
      : 0;

  return (
    <div className="bg-white dark:bg-background-dark rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Aid Type</h3>
          <p className="text-lg font-semibold">{program.aid_type}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h3>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              program.status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                : program.status === "completed"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
          </span>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Progress</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {program.distributed_households || 0}/{program.total_households || 0}
            </span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created By</h3>
          <p className="text-lg">{program.creator_name || "Unknown"}</p>
        </div>
      </div>

      {zones.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Assigned Zones/Villages</h3>
          <div className="space-y-2">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                {zone.zone_name && <span className="font-medium">{zone.zone_name}</span>}
                {zone.village_name && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    - {zone.village_name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {assignments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Assignments</h3>
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <div>
                  <span className="font-medium">{assignment.assigned_to_name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    ({assignment.assignment_type === "zone_leader" ? "Zone Leader" : "Branch Chief"})
                  </span>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
