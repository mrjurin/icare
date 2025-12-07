"use client";

import Link from "next/link";
import { AidsProgram } from "@/lib/actions/aidsPrograms";

type AidsProgramsListProps = {
  programs: AidsProgram[];
};

export default function AidsProgramsList({ programs }: AidsProgramsListProps) {
  if (programs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No active programs available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {programs.map((program) => {
        const progress =
          program.total_households && program.total_households > 0
            ? Math.round(
                ((program.distributed_households || 0) / program.total_households) * 100
              )
            : 0;

        return (
          <Link
            key={program.id}
            href={`/staff/aids-programs/${program.id}`}
            className="block bg-white dark:bg-background-dark rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{program.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{program.aid_type}</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded text-xs font-medium">
                Active
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="font-medium">
                  {program.distributed_households || 0}/{program.total_households || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
