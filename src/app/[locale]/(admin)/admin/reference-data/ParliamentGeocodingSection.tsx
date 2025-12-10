"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pause, Play, AlertCircle, CheckCircle } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import {
  startParliamentGeocodingJob,
  getLatestParliamentGeocodingJob,
  pauseParliamentGeocodingJob,
  resumeParliamentGeocodingJob,
} from "@/lib/actions/parliaments";

export default function ParliamentGeocodingSection() {
  const t = useTranslations("referenceData.parliamentGeocoding");
  const router = useRouter();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeJob, setGeocodeJob] = useState<{
    id: number;
    status: "pending" | "running" | "paused" | "completed" | "failed";
    totalParliaments: number;
    processedParliaments: number;
    geocodedCount: number;
    failedCount: number;
    skippedCount: number;
    errorMessage: string | null;
  } | null>(null);
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [showGeocodeConfirm, setShowGeocodeConfirm] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Poll for geocoding job status
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkJobStatus = async () => {
      const result = await getLatestParliamentGeocodingJob();
      if (result.success && result.data) {
        const jobStatus = result.data.status;
        setGeocodeJob(result.data);
        setIsGeocoding(jobStatus === "pending" || jobStatus === "running");
        // Stop polling if job is completed or failed
        if (jobStatus === "completed" || jobStatus === "failed") {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          router.refresh();
        }
        // Stop polling if paused
        if (jobStatus === "paused") {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } else if (result.success && !result.data) {
        // No job found, stop polling
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

    // Poll every 2 seconds if there's an active job
    if (geocodeJob && (geocodeJob.status === "pending" || geocodeJob.status === "running")) {
      intervalId = setInterval(checkJobStatus, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [geocodeJob?.status, router]);

  // Check for existing job on mount
  useEffect(() => {
    const checkExistingJob = async () => {
      const result = await getLatestParliamentGeocodingJob();
      if (result.success && result.data) {
        const jobStatus = result.data.status;
        setGeocodeJob(result.data);
        setIsGeocoding(jobStatus === "pending" || jobStatus === "running");
      }
    };
    checkExistingJob();
  }, []);

  const handleGeocode = async () => {
    setIsGeocoding(true);
    setShowGeocodeConfirm(false);
    setGeocodeError(null);
    try {
      const result = await startParliamentGeocodingJob();
      if (!result.success) {
        setGeocodeError(result.error || t("geocodeError"));
        setIsGeocoding(false);
        return;
      }

      if (result.data) {
        // Fetch the job details to show initial status
        const jobResult = await getLatestParliamentGeocodingJob();
        if (jobResult.success && jobResult.data) {
          setGeocodeJob(jobResult.data);
        }
      }
    } catch (error) {
      setGeocodeError(t("geocodeError"));
      setIsGeocoding(false);
    }
  };

  const handlePause = async () => {
    if (!geocodeJob) return;
    setIsPausing(true);
    setGeocodeError(null);
    try {
      const result = await pauseParliamentGeocodingJob(geocodeJob.id);
      if (!result.success) {
        setGeocodeError(result.error || t("pauseError"));
        return;
      }
      // Refresh job status
      const jobResult = await getLatestParliamentGeocodingJob();
      if (jobResult.success && jobResult.data) {
        setGeocodeJob(jobResult.data);
        setIsGeocoding(false);
        setGeocodeError(null); // Clear any previous errors on success
      }
    } catch (error) {
      setGeocodeError(t("pauseError"));
    } finally {
      setIsPausing(false);
    }
  };

  const handleResume = async () => {
    if (!geocodeJob) return;
    setIsResuming(true);
    setGeocodeError(null);
    try {
      const result = await resumeParliamentGeocodingJob(geocodeJob.id);
      if (!result.success) {
        setGeocodeError(result.error || t("resumeError"));
        return;
      }
      setIsGeocoding(true);
      // Refresh job status and restart polling
      const jobResult = await getLatestParliamentGeocodingJob();
      if (jobResult.success && jobResult.data) {
        setGeocodeJob(jobResult.data);
        setGeocodeError(null); // Clear any previous errors on success
        router.refresh();
      }
    } catch (error) {
      setGeocodeError(t("resumeError"));
    } finally {
      setIsResuming(false);
    }
  };

  return (
    <>
      {/* Geocoding Section */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{t("title")}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("description")}
            </p>
          </div>
          <Button
            onClick={() => setShowGeocodeConfirm(true)}
            disabled={isGeocoding || (geocodeJob?.status === "pending" || geocodeJob?.status === "running" || geocodeJob?.status === "paused")}
            className="gap-2"
          >
            <MapPin className="size-4" />
            {isGeocoding || geocodeJob?.status === "running" || geocodeJob?.status === "pending"
              ? t("geocoding")
              : geocodeJob?.status === "paused"
              ? t("resume")
              : t("geocodeAddresses")}
          </Button>
        </div>

        {geocodeJob && (
          <div
            className={`p-4 rounded-lg border ${
              geocodeJob.status === "failed"
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : geocodeJob.status === "paused"
                ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                : geocodeJob.status === "completed" && geocodeJob.failedCount > 0
                ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                : geocodeJob.status === "completed"
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {geocodeJob.status === "failed" ? (
                <AlertCircle className="size-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              ) : geocodeJob.status === "paused" ? (
                <div className="flex items-center gap-2 flex-1">
                  <Pause className="size-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <Button
                    variant="outline"
                    onClick={handleResume}
                    disabled={isResuming}
                    className="gap-2 h-9 min-h-[36px] text-xs"
                    title={isResuming ? t("resuming") : t("resume")}
                    aria-label={t("resume")}
                  >
                    {isResuming ? (
                      <>
                        <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        {t("resuming")}
                      </>
                    ) : (
                      <>
                        <Play className="size-4" />
                        {t("resume")}
                      </>
                    )}
                  </Button>
                </div>
              ) : geocodeJob.status === "running" ? (
                <div className="flex items-center gap-2 flex-1">
                  <div className="size-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                  <Button
                    variant="outline"
                    onClick={handlePause}
                    disabled={isPausing}
                    className="gap-2 h-9 min-h-[36px] text-xs"
                    title={isPausing ? t("pausing") : t("pause")}
                    aria-label={t("pause")}
                  >
                    {isPausing ? (
                      <>
                        <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        {t("pausing")}
                      </>
                    ) : (
                      <>
                        <Pause className="size-4" />
                        {t("pause")}
                      </>
                    )}
                  </Button>
                </div>
              ) : geocodeJob.status === "completed" && geocodeJob.failedCount > 0 ? (
                <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              ) : geocodeJob.status === "completed" ? (
                <CheckCircle className="size-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : null}

              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {geocodeJob.status === "paused"
                    ? t("paused", {
                        processed: geocodeJob.processedParliaments,
                        total: geocodeJob.totalParliaments,
                      })
                    : geocodeJob.status === "running" || geocodeJob.status === "pending"
                    ? t("processing", {
                        processed: geocodeJob.processedParliaments,
                        total: geocodeJob.totalParliaments,
                      })
                    : geocodeJob.status === "completed"
                    ? t("geocoded", {
                        count: geocodeJob.geocodedCount,
                        total: geocodeJob.totalParliaments,
                      })
                    : t("failedStatus")}
                </p>

                {(geocodeJob.status === "running" || geocodeJob.status === "pending" || geocodeJob.status === "paused") && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (geocodeJob.processedParliaments / geocodeJob.totalParliaments) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {Math.round((geocodeJob.processedParliaments / geocodeJob.totalParliaments) * 100)}%{" "}
                      {t("complete")}
                    </p>
                  </div>
                )}

                {geocodeJob.status === "completed" && geocodeJob.failedCount > 0 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    {t("failed", { count: geocodeJob.failedCount })}
                  </p>
                )}

                {geocodeJob.status === "completed" && geocodeJob.skippedCount > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {t("skipped", { count: geocodeJob.skippedCount })}
                  </p>
                )}

                {geocodeJob.status === "failed" && geocodeJob.errorMessage && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{geocodeJob.errorMessage}</p>
                )}

                {geocodeError && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center justify-between">
                    <p className="text-xs text-red-600 dark:text-red-400 flex-1">{geocodeError}</p>
                    <button
                      onClick={() => setGeocodeError(null)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      aria-label="Dismiss error"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Geocoding Confirmation Dialog */}
      <AlertDialog.Root open={showGeocodeConfirm} onOpenChange={setShowGeocodeConfirm}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl z-50 w-full max-w-md">
            <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
              {t("confirmTitle")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t("confirmDescription")}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button variant="outline">{t("cancel")}</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button onClick={handleGeocode} disabled={isGeocoding} className="gap-2">
                  <MapPin className="size-4" />
                  {t("confirm")}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
