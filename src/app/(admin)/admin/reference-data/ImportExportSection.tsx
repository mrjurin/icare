"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, FileText, AlertCircle, CheckCircle, Database } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  importReferenceDataFromCSV,
  exportReferenceDataToCSV,
  populateReferenceDataFromSpr,
  type ReferenceTable,
} from "@/lib/actions/reference-data";
import { getVoterVersions, type SprVoterVersion } from "@/lib/actions/spr-voters";
import { getTableDisplayName } from "@/lib/utils/reference-data";

type ImportExportSectionProps = {
  table: ReferenceTable;
};

export default function ImportExportSection({ table }: ImportExportSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [populateResult, setPopulateResult] = useState<{
    added: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [versions, setVersions] = useState<SprVoterVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayName = getTableDisplayName(table);

  // Load SPR versions
  useEffect(() => {
    getVoterVersions().then((result) => {
      if (result.success && result.data) {
        setVersions(result.data);
        // Set default to active version if available
        const activeVersion = result.data.find((v) => v.is_active);
        if (activeVersion) {
          setSelectedVersionId(activeVersion.id);
        }
      }
    });
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvContent = event.target?.result as string;
      if (!csvContent) {
        alert("Failed to read file");
        return;
      }

      startTransition(async () => {
        const result = await importReferenceDataFromCSV(table, csvContent);
        if (!result.success) {
          alert(result.error || "Failed to import data");
          return;
        }

        if (result.data) {
          setImportResult(result.data);
          router.refresh();
        }
      });
    };

    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportReferenceDataToCSV(table);
      if (!result.success) {
        alert(result.error || "Failed to export data");
        return;
      }

      if (result.data) {
        // Create download link
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${table}_${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      alert("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePopulateFromSpr = async () => {
    setIsPopulating(true);
    setPopulateResult(null);

    startTransition(async () => {
      const result = await populateReferenceDataFromSpr(table, selectedVersionId);
      if (!result.success) {
        alert(result.error || "Failed to populate data from SPR");
        setIsPopulating(false);
        return;
      }

      if (result.data) {
        setPopulateResult(result.data);
        router.refresh();
      }
      setIsPopulating(false);
    });
  };

  // Get expected CSV format based on table type
  const getExpectedFormat = () => {
    const baseColumns = "Name, Code, Description, IsActive";
    if (table === "localities") {
      return `${baseColumns}, Parliament, DUN, District`;
    } else if (table === "polling_stations") {
      return `${baseColumns}, Locality, Address`;
    }
    return baseColumns;
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Import & Export</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Import Section */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Import {displayName} from CSV
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Upload a CSV file with {displayName.toLowerCase()} data. Required columns: {getExpectedFormat()}
            </p>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={isPending}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 cursor-pointer"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4" />
                {isPending ? "Importing..." : "Choose CSV File"}
              </Button>
            </div>
          </div>

          {importResult && (
            <div
              className={`p-3 rounded-lg ${
                importResult.errors.length > 0
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                  : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              }`}
            >
              <div className="flex items-start gap-2">
                {importResult.errors.length > 0 ? (
                  <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="size-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Imported {importResult.imported} {displayName.toLowerCase()}
                    {importResult.imported !== 1 ? "s" : ""}
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {importResult.errors.length} error(s) occurred:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>... and {importResult.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export {displayName} to CSV
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Download all {displayName.toLowerCase()} data as a CSV file.
            </p>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full gap-2"
              variant="outline"
            >
              <Download className="size-4" />
              {isExporting ? "Exporting..." : "Export to CSV"}
            </Button>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <FileText className="size-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                  Expected CSV Format:
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {getExpectedFormat()}
                </p>
                {table === "localities" && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Note: Parliament, DUN, and District should match existing records by name or code.
                  </p>
                )}
                {table === "polling_stations" && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Note: Locality should match an existing locality by name or code.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Populate from SPR Section */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Populate from SPR Data
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Extract unique {displayName.toLowerCase()} values from SPR voter data.
            </p>
            {versions.length > 0 && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SPR Version (optional)
                </label>
                <select
                  value={selectedVersionId || ""}
                  onChange={(e) =>
                    setSelectedVersionId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  disabled={isPopulating}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Versions</option>
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.name} {version.is_active ? "(Active)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button
              onClick={handlePopulateFromSpr}
              disabled={isPopulating}
              className="w-full gap-2"
              variant="outline"
            >
              <Database className="size-4" />
              {isPopulating ? "Populating..." : "Populate from SPR"}
            </Button>
          </div>

          {populateResult && (
            <div
              className={`p-3 rounded-lg ${
                populateResult.errors.length > 0
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                  : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              }`}
            >
              <div className="flex items-start gap-2">
                {populateResult.errors.length > 0 ? (
                  <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="size-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Added {populateResult.added} new {displayName.toLowerCase()}
                    {populateResult.added !== 1 ? "s" : ""}
                    {populateResult.skipped > 0 && (
                      <span className="text-gray-600 dark:text-gray-400">
                        {" "}
                        ({populateResult.skipped} skipped)
                      </span>
                    )}
                  </p>
                  {populateResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {populateResult.errors.length} error(s) occurred:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                        {populateResult.errors.slice(0, 10).map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                        {populateResult.errors.length > 10 && (
                          <li>... and {populateResult.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
