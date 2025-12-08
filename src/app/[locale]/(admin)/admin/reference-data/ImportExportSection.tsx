"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, FileText, AlertCircle, CheckCircle, Database } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("referenceData");
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
  const displayName = getTableDisplayName(table, t);

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
      alert(t("importExport.import.pleaseSelectCsv"));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvContent = event.target?.result as string;
      if (!csvContent) {
        alert(t("importExport.import.failedToRead"));
        return;
      }

      startTransition(async () => {
        const result = await importReferenceDataFromCSV(table, csvContent);
        if (!result.success) {
          alert(result.error || t("importExport.import.failedToImport"));
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
        alert(result.error || t("importExport.export.failedToExport"));
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
      alert(t("importExport.export.failedToExport"));
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
        alert(result.error || t("importExport.populate.failedToPopulate"));
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
    const baseColumns = `${t("table.name")}, ${t("table.code")}, ${t("form.description")}, ${t("form.active")}`;
    if (table === "localities") {
      return `${baseColumns}, ${t("form.parliament")}, ${t("form.dun")}, ${t("form.district")}`;
    } else if (table === "polling_stations") {
      return `${baseColumns}, ${t("form.locality")}, ${t("form.address")}`;
    }
    return baseColumns;
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">{t("importExport.title")}</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Import Section */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("importExport.import.title", { displayName })}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {t("importExport.import.description", { displayName: displayName.toLowerCase(), format: getExpectedFormat() })}
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
                {isPending ? t("importExport.import.importing") : t("importExport.import.chooseFile")}
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
                    {importResult.imported === 1
                      ? t("importExport.import.imported", { count: importResult.imported, displayName: displayName.toLowerCase() })
                      : t("importExport.import.importedPlural", { count: importResult.imported, displayName: displayName.toLowerCase() })}
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {t("importExport.import.errorsOccurred", { count: importResult.errors.length })}
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>{t("importExport.import.andMoreErrors", { count: importResult.errors.length - 10 })}</li>
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
              {t("importExport.export.title", { displayName })}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {t("importExport.export.description", { displayName: displayName.toLowerCase() })}
            </p>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full gap-2"
              variant="outline"
            >
              <Download className="size-4" />
              {isExporting ? t("importExport.export.exporting") : t("importExport.export.exportToCsv")}
            </Button>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <FileText className="size-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                  {t("importExport.export.expectedFormat")}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {getExpectedFormat()}
                </p>
                {table === "localities" && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {t("importExport.export.noteParliamentDun")}
                  </p>
                )}
                {table === "polling_stations" && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {t("importExport.export.noteLocality")}
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
              {t("importExport.populate.title")}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {t("importExport.populate.description", { displayName: displayName.toLowerCase() })}
            </p>
            {versions.length > 0 && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("importExport.populate.sprVersion")}
                </label>
                <select
                  value={selectedVersionId || ""}
                  onChange={(e) =>
                    setSelectedVersionId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  disabled={isPopulating}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t("importExport.populate.allVersions")}</option>
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.name} {version.is_active ? t("importExport.populate.active") : ""}
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
              {isPopulating ? t("importExport.populate.populating") : t("importExport.populate.populateFromSpr")}
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
                    {populateResult.added === 1
                      ? t("importExport.populate.added", { count: populateResult.added, displayName: displayName.toLowerCase() })
                      : t("importExport.populate.addedPlural", { count: populateResult.added, displayName: displayName.toLowerCase() })}
                    {populateResult.skipped > 0 && (
                      <span className="text-gray-600 dark:text-gray-400">
                        {" "}
                        {t("importExport.populate.skipped", { count: populateResult.skipped })}
                      </span>
                    )}
                  </p>
                  {populateResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {t("importExport.populate.errorsOccurred", { count: populateResult.errors.length })}
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                        {populateResult.errors.slice(0, 10).map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                        {populateResult.errors.length > 10 && (
                          <li>{t("importExport.populate.andMoreErrors", { count: populateResult.errors.length - 10 })}</li>
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
