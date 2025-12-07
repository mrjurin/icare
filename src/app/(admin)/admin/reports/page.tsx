"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Users, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  FileCheck, 
  Package,
  Download,
  MapPin,
  Home
} from "lucide-react";
import VoterAnalysisReport from "./VoterAnalysisReport";
import SupportLevelReport from "./SupportLevelReport";
import ZonePerformanceReport from "./ZonePerformanceReport";
import DemographicReport from "./DemographicReport";
import IssueResolutionReport from "./IssueResolutionReport";
import AidDistributionReport from "./AidDistributionReport";
import ZoneLevelReport from "./ZoneLevelReport";
import VillageLevelReport from "./VillageLevelReport";
import Button from "@/components/ui/Button";

type ReportType = 
  | "voter-analysis"
  | "support-level"
  | "zone-performance"
  | "demographic"
  | "issue-resolution"
  | "aid-distribution"
  | "zone-level"
  | "village-level";

const reportMenuItems: Array<{
  id: ReportType;
  label: string;
  icon: typeof Users;
  description: string;
}> = [
  {
    id: "voter-analysis",
    label: "Voter Analysis",
    icon: Users,
    description: "Eligible voters breakdown by zone, locality, and age",
  },
  {
    id: "support-level",
    label: "Support Level",
    icon: TrendingUp,
    description: "Support scores based on aid and issue resolution",
  },
  {
    id: "zone-performance",
    label: "Zone Performance",
    icon: BarChart3,
    description: "Performance metrics for each zone",
  },
  {
    id: "demographic",
    label: "Demographics",
    icon: PieChart,
    description: "Age, income, and dependency status distribution",
  },
  {
    id: "issue-resolution",
    label: "Issue Resolution",
    icon: FileCheck,
    description: "Issue resolution rates and response times",
  },
  {
    id: "aid-distribution",
    label: "Aid Distribution",
    icon: Package,
    description: "Aid distribution trends and coverage",
  },
  {
    id: "zone-level",
    label: "Zone Level",
    icon: MapPin,
    description: "Detailed statistics and performance for each zone",
  },
  {
    id: "village-level",
    label: "Village Level",
    icon: Home,
    description: "Detailed statistics and support levels for each village",
  },
];

function ReportsContent() {
  const searchParams = useSearchParams();
  const [activeReport, setActiveReport] = useState<ReportType>("voter-analysis");

  useEffect(() => {
    const report = searchParams.get("report") as ReportType;
    if (report && reportMenuItems.some(item => item.id === report)) {
      setActiveReport(report);
    }
  }, [searchParams]);

  const activeReportData = reportMenuItems.find(item => item.id === activeReport);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">
            Election Reports
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Analyze your winning possibility for the next election
          </p>
        </div>
        <Button className="gap-2">
          <Download className="size-4" />
          <span>Export Report</span>
        </Button>
      </div>

      {/* Submenu Navigation */}
      <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-gray-800 p-2">
        <div className="flex flex-wrap gap-2">
          {reportMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeReport === item.id;
            return (
              <Link
                key={item.id}
                href={`/admin/reports?report=${item.id}`}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                `}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active Report Description */}
      {activeReportData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <activeReportData.icon className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                {activeReportData.label}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {activeReportData.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {activeReport === "voter-analysis" && <VoterAnalysisReport />}
        {activeReport === "support-level" && <SupportLevelReport />}
        {activeReport === "zone-performance" && <ZonePerformanceReport />}
        {activeReport === "demographic" && <DemographicReport />}
        {activeReport === "issue-resolution" && <IssueResolutionReport />}
        {activeReport === "aid-distribution" && <AidDistributionReport />}
        {activeReport === "zone-level" && <ZoneLevelReport />}
        {activeReport === "village-level" && <VillageLevelReport />}
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
