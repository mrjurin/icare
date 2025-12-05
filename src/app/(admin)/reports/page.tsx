import { Download, ArrowUp, ArrowDown } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Button from "@/components/ui/Button";

export default function AdminReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Analytics & Reports</h1>
        <div className="flex items-center gap-2">
          <DateRangePicker defaultRange={{ start: "2023-01-01", end: "2023-12-31" }} />
          <Button className="gap-2">
            <Download className="size-5" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Issues</h3>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">1,254</p>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
              <ArrowUp className="size-4" />
              <span>12% vs last month</span>
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved Issues</h3>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">982</p>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
              <ArrowUp className="size-4" />
              <span>8.5% vs last month</span>
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Issues</h3>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">272</p>
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
              <ArrowDown className="size-4" />
              <span>-3% vs last month</span>
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Resolution Time</h3>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">3.2 Days</p>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
              <ArrowUp className="size-4" />
              <span>-0.5 days vs last month</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Issues Over Time</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total reported issues per month</p>
          <div className="mt-4">
            <svg viewBox="0 0 420 220" className="w-full h-64">
              <rect x="0" y="0" width="420" height="220" fill="none" />
              <g stroke="#e5e7eb">
                <line x1="40" y1="180" x2="400" y2="180" />
                <line x1="40" y1="140" x2="400" y2="140" />
                <line x1="40" y1="100" x2="400" y2="100" />
                <line x1="40" y1="60" x2="400" y2="60" />
              </g>
              <polyline
                fill="none"
                stroke="#137fec"
                strokeWidth="3"
                points="40,160 80,170 120,130 160,130 200,170 240,190 280,140 320,100 360,110 400,90"
              />
              <g fill="#137fec">
                <circle cx="40" cy="160" r="3" />
                <circle cx="80" cy="170" r="3" />
                <circle cx="120" cy="130" r="3" />
                <circle cx="160" cy="130" r="3" />
                <circle cx="200" cy="170" r="3" />
                <circle cx="240" cy="190" r="3" />
                <circle cx="280" cy="140" r="3" />
                <circle cx="320" cy="100" r="3" />
                <circle cx="360" cy="110" r="3" />
                <circle cx="400" cy="90" r="3" />
              </g>
            </svg>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Common Issue Categories</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Distribution of issues by category</p>
          <div className="mt-4 flex items-center justify-center">
            <svg viewBox="0 0 220 220" className="w-56 h-56">
              <circle cx="110" cy="110" r="90" fill="#e5e7eb" />
              <circle cx="110" cy="110" r="60" fill="white" />
              <path d="M110 20 A90 90 0 0 1 200 110 L110 110 Z" fill="#137fec" />
              <path d="M200 110 A90 90 0 0 1 110 200 L110 110 Z" fill="#38bdf8" />
              <path d="M110 200 A90 90 0 0 1 20 110 L110 110 Z" fill="#6366f1" />
              <path d="M20 110 A90 90 0 0 1 80 40 L110 110 Z" fill="#8b5cf6" />
              <path d="M80 40 A90 90 0 0 1 110 20 L110 110 Z" fill="#a855f7" />
              <path d="M110 20 A90 90 0 0 1 140 30 L110 110 Z" fill="#d946ef" />
            </svg>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
            {[
              { label: "Waste Management", color: "#137fec" },
              { label: "Road Maintenance", color: "#38bdf8" },
              { label: "Public Lighting", color: "#6366f1" },
              { label: "Water Supply", color: "#8b5cf6" },
              { label: "Noise Complaint", color: "#a855f7" },
              { label: "Other", color: "#d946ef" },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ backgroundColor: l.color }} className="inline-block size-3 rounded-sm" />
                <span className="text-gray-700 dark:text-gray-300">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
