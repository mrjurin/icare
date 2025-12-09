"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, FileText, AlertCircle, CheckCircle, Link2, MapPin, Pause, Play } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import Button from "@/components/ui/Button";
import {
  importVotersFromCSV,
  importVotersFromCSVChunk,
  exportVotersToCSV,
  matchVotersWithHouseholds,
  startGeocodingJob,
  getLatestGeocodingJob,
  pauseGeocodingJob,
  resumeGeocodingJob,
  type ActionResult,
} from "@/lib/actions/spr-voters";

type ImportExportSectionProps = {
  versionId: number;
};

export default function ImportExportSection({ versionId }: ImportExportSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    matched: number;
    unmatched: number;
    total: number;
  } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeJob, setGeocodeJob] = useState<{
    id: number;
    status: "pending" | "running" | "paused" | "completed" | "failed";
    totalVoters: number;
    processedVoters: number;
    geocodedCount: number;
    failedCount: number;
    skippedCount: number;
    errorMessage: string | null;
  } | null>(null);
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [showGeocodeConfirm, setShowGeocodeConfirm] = useState(false);

  // Poll for geocoding job status
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let shouldPoll = true;

    const checkJobStatus = async () => {
      if (!shouldPoll) return;
      
      const result = await getLatestGeocodingJob(versionId);
      if (result.success && result.data) {
        const jobStatus = result.data.status;
        setGeocodeJob(result.data);
        setIsGeocoding(jobStatus === "pending" || jobStatus === "running");
        // Stop polling if job is completed or failed
        if (jobStatus === "completed" || jobStatus === "failed") {
          shouldPoll = false;
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          router.refresh();
        }
        // Stop polling if paused
        if (jobStatus === "paused") {
          shouldPoll = false;
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } else if (result.success && !result.data) {
        // No job found, stop polling
        shouldPoll = false;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        setGeocodeJob(null);
        setIsGeocoding(false);
      }
    };

    // Check immediately
    checkJobStatus();

    // Poll every 2 seconds
    intervalId = setInterval(checkJobStatus, 2000);

    return () => {
      shouldPoll = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId]);

  // Load latest job on mount
  useEffect(() => {
    const loadLatestJob = async () => {
      const result = await getLatestGeocodingJob(versionId);
      if (result.success && result.data) {
        setGeocodeJob(result.data);
        if (result.data.status === "pending" || result.data.status === "running") {
          setIsGeocoding(true);
        } else if (result.data.status === "paused") {
          setIsGeocoding(false);
        }
      }
    };
    loadLatestJob();
  }, [versionId]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }

    // Show file info
    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);
    setImportResult(null);
    setUploadProgress(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvContent = event.target?.result as string;
      if (!csvContent) {
        alert("Failed to read file");
        return;
      }

      // Parse CSV to get total rows and header
      const lines = csvContent.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        alert("CSV file must have at least a header and one data row");
        return;
      }

      // Parse header
      const header = lines[0].split(",").map((h) => h.trim());
      const headerMap: Record<string, number> = {};
      header.forEach((h, i) => {
        headerMap[h] = i;
      });

      // Check required columns
      if (!("Nama" in headerMap)) {
        alert("Missing required column: Nama");
        return;
      }

      const dataRows = lines.slice(1); // Skip header
      const totalRows = dataRows.length;
      
      // Use smaller chunks to avoid timeouts and network issues
      // 250 rows ≈ 50-125KB per chunk (very safe, prevents timeouts)
      const CHUNK_SIZE = 250; // Process 250 rows per chunk for progress updates

      // Initialize progress
      setUploadProgress({
        current: 0,
        total: totalRows,
        percentage: 0,
      });

      startTransition(async () => {
        const allErrors: string[] = [];
        let totalImported = 0;

        // Retry function with exponential backoff
        const retryWithBackoff = async (
          fn: () => Promise<ActionResult<{ imported: number; errors: string[] }>>,
          maxRetries = 3,
          delay = 1000
        ): Promise<ActionResult<{ imported: number; errors: string[] }>> => {
          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              const result = await fn();
              if (result.success || attempt === maxRetries - 1) {
                return result;
              }
            } catch (error) {
              if (attempt === maxRetries - 1) {
                return {
                  success: false,
                  error: `Network error after ${maxRetries} attempts: ${error instanceof Error ? error.message : "Unknown error"}`,
                };
              }
            }
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)));
          }
          return { success: false, error: "Failed after all retry attempts" };
        };

        try {
          // Process in chunks
          for (let i = 0; i < dataRows.length; i += CHUNK_SIZE) {
            const chunk = dataRows.slice(i, i + CHUNK_SIZE);
            const startRowIndex = i;
            const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;

            // Retry logic for each chunk (skip version check after first chunk for performance)
            const result = await retryWithBackoff(
              () => importVotersFromCSVChunk(versionId, headerMap, chunk, startRowIndex, chunkNumber > 1),
              3, // Max 3 retries
              1000 // Initial delay 1 second
            );

            if (!result.success) {
              allErrors.push(`Chunk ${chunkNumber} (rows ${startRowIndex + 1}-${startRowIndex + chunk.length}): ${result.error || "Failed to import chunk"}`);
            } else if (result.data) {
              totalImported += result.data.imported;
              if (result.data.errors.length > 0) {
                allErrors.push(...result.data.errors);
              }
            }

            // Update progress after processing each chunk
            const processedRows = Math.min(i + CHUNK_SIZE, totalRows);
            setUploadProgress({
              current: processedRows,
              total: totalRows,
              percentage: Math.round((processedRows / totalRows) * 100),
            });

            // Small delay between chunks to avoid overwhelming the server
            if (i + CHUNK_SIZE < dataRows.length) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }

          setImportResult({
            imported: totalImported,
            errors: allErrors.slice(0, 100), // Limit to first 100 errors
          });

          // Clear progress after a short delay to show completion
          setTimeout(() => {
            setUploadProgress(null);
          }, 1000);

          router.refresh();
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message.includes("Failed to fetch")
                ? "Network error: Please check your connection and try again. The server may be processing a large file."
                : error.message
              : "Unknown error occurred";
          alert(`Failed to import voters: ${errorMessage}`);
          setUploadProgress(null);
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
      const result = await exportVotersToCSV(versionId);
      if (!result.success) {
        alert(result.error || "Failed to export voters");
        return;
      }

      if (result.data) {
        // Create download link
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `spr_voters_${versionId}_${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      alert("Failed to export voters");
    } finally {
      setIsExporting(false);
    }
  };

  const handleMatch = async () => {
    setIsMatching(true);
    setMatchResult(null);
    try {
      const result = await matchVotersWithHouseholds(versionId);
      if (!result.success) {
        alert(result.error || "Failed to match voters");
        return;
      }

      if (result.data) {
        setMatchResult(result.data);
        router.refresh();
      }
    } catch (error) {
      alert("Failed to match voters");
    } finally {
      setIsMatching(false);
    }
  };

  const handleGeocode = async () => {
    setIsGeocoding(true);
    setShowGeocodeConfirm(false);
    try {
      const result = await startGeocodingJob(versionId);
      if (!result.success) {
        alert(result.error || "Failed to start geocoding job");
        setIsGeocoding(false);
        return;
      }

      if (result.data) {
        // Fetch the job details to show initial status
        const jobResult = await getLatestGeocodingJob(versionId);
        if (jobResult.success && jobResult.data) {
          setGeocodeJob(jobResult.data);
        }
      }
    } catch (error) {
      alert("Failed to start geocoding job");
      setIsGeocoding(false);
    }
  };

  const handlePause = async () => {
    if (!geocodeJob) return;
    setIsPausing(true);
    try {
      const result = await pauseGeocodingJob(geocodeJob.id);
      if (!result.success) {
        alert(result.error || "Failed to pause geocoding");
        return;
      }
      // Refresh job status
      const jobResult = await getLatestGeocodingJob(versionId);
      if (jobResult.success && jobResult.data) {
        setGeocodeJob(jobResult.data);
        setIsGeocoding(false);
      }
    } catch (error) {
      alert("Failed to pause geocoding");
    } finally {
      setIsPausing(false);
    }
  };

  const handleResume = async () => {
    if (!geocodeJob) return;
    setIsResuming(true);
    try {
      const result = await resumeGeocodingJob(geocodeJob.id);
      if (!result.success) {
        alert(result.error || "Failed to resume geocoding");
        return;
      }
      setIsGeocoding(true);
      // Refresh job status and restart polling
      const jobResult = await getLatestGeocodingJob(versionId);
      if (jobResult.success && jobResult.data) {
        setGeocodeJob(jobResult.data);
        router.refresh();
      }
    } catch (error) {
      alert("Failed to resume geocoding");
    } finally {
      setIsResuming(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
      <h3 className="text-lg font-semibold mb-4">Import, Export & Matching</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Import Section */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Import Voters from CSV
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Upload a CSV file with SPR voter data. The file should match the SPR Malaysia format.
              Large files are supported (up to 50MB).
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
              {selectedFileName && selectedFileSize !== null && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <p className="font-medium">Selected: {selectedFileName}</p>
                  <p>Size: {formatFileSize(selectedFileSize)}</p>
                </div>
              )}
              {uploadProgress && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Processing rows...</span>
                    <span>
                      {uploadProgress.current.toLocaleString()} / {uploadProgress.total.toLocaleString()} ({uploadProgress.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
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
                    Imported {importResult.imported} voters
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
              Export Voters to CSV
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Download all voters in the selected version as a CSV file.
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
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  The exported CSV will include all voter fields in the SPR Malaysia format.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Matching Section */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Match with Households
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Automatically match SPR voters with household members by IC number.
            </p>
            <Button
              onClick={handleMatch}
              disabled={isMatching}
              className="w-full gap-2"
              variant="outline"
            >
              <Link2 className="size-4" />
              {isMatching ? "Matching..." : "Match Voters"}
            </Button>
          </div>

          {matchResult && (
            <div
              className={`p-3 rounded-lg ${
                matchResult.unmatched > 0
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                  : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              }`}
            >
              <div className="flex items-start gap-2">
                {matchResult.unmatched > 0 ? (
                  <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="size-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Matched {matchResult.matched} of {matchResult.total} voters
                  </p>
                  {matchResult.unmatched > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {matchResult.unmatched} voters could not be matched. Use the filter to view unmatched voters.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Geocoding Section */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Geocode Addresses
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Retrieve latitude and longitude for all voter addresses. This process may take some time.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowGeocodeConfirm(true)}
                disabled={isGeocoding || (geocodeJob?.status === "pending" || geocodeJob?.status === "running" || geocodeJob?.status === "paused")}
                className="flex-1 gap-2"
                variant="outline"
              >
                <MapPin className="size-4" />
                {isGeocoding || geocodeJob?.status === "running" || geocodeJob?.status === "pending"
                  ? "Geocoding..."
                  : geocodeJob?.status === "paused"
                  ? "Resume"
                  : "Geocode Addresses"}
              </Button>
              {geocodeJob?.status === "running" && (
                <Button
                  onClick={handlePause}
                  disabled={isPausing}
                  className="gap-2"
                  variant="outline"
                >
                  <Pause className="size-4" />
                  {isPausing ? "Pausing..." : "Pause"}
                </Button>
              )}
              {geocodeJob?.status === "paused" && (
                <Button
                  onClick={handleResume}
                  disabled={isResuming}
                  className="gap-2"
                  variant="outline"
                >
                  <Play className="size-4" />
                  {isResuming ? "Resuming..." : "Resume"}
                </Button>
              )}
            </div>
          </div>

          {geocodeJob && (
            <div
              className={`p-3 rounded-lg ${
                geocodeJob.status === "failed"
                  ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  : geocodeJob.status === "paused"
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                  : geocodeJob.status === "completed" && geocodeJob.failedCount > 0
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                  : geocodeJob.status === "completed"
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
              }`}
            >
              <div className="flex items-start gap-2">
                {geocodeJob.status === "failed" ? (
                  <AlertCircle className="size-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                ) : geocodeJob.status === "paused" ? (
                  <Pause className="size-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                ) : geocodeJob.status === "completed" && geocodeJob.failedCount > 0 ? (
                  <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                ) : geocodeJob.status === "completed" ? (
                  <CheckCircle className="size-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="size-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <div className="size-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {geocodeJob.status === "paused"
                      ? `Paused: ${geocodeJob.processedVoters} of ${geocodeJob.totalVoters} addresses processed`
                      : geocodeJob.status === "running" || geocodeJob.status === "pending"
                      ? `Processing ${geocodeJob.processedVoters} of ${geocodeJob.totalVoters} addresses...`
                      : geocodeJob.status === "completed"
                      ? `Geocoded ${geocodeJob.geocodedCount} of ${geocodeJob.totalVoters} addresses`
                      : "Geocoding failed"}
                  </p>
                  {(geocodeJob.status === "running" || geocodeJob.status === "pending" || geocodeJob.status === "paused") && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (geocodeJob.processedVoters / geocodeJob.totalVoters) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {Math.round((geocodeJob.processedVoters / geocodeJob.totalVoters) * 100)}% complete
                      </p>
                    </div>
                  )}
                  {geocodeJob.status === "completed" && geocodeJob.failedCount > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {geocodeJob.failedCount} addresses failed to geocode
                    </p>
                  )}
                  {geocodeJob.status === "completed" && geocodeJob.skippedCount > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {geocodeJob.skippedCount} addresses skipped (no address data)
                    </p>
                  )}
                  {geocodeJob.status === "failed" && geocodeJob.errorMessage && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{geocodeJob.errorMessage}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Geocoding Confirmation Dialog */}
      <AlertDialog.Root open={showGeocodeConfirm} onOpenChange={setShowGeocodeConfirm}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-md">
            <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              Confirm Geocoding
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              This will geocode all voter addresses that don't have location data yet. The process will run in the background and may take several minutes depending on the number of voters. You can navigate away and check progress later. Continue?
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button variant="outline">Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button onClick={handleGeocode} disabled={isGeocoding} className="gap-2">
                  <MapPin className="size-4" />
                  Start Geocoding
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
