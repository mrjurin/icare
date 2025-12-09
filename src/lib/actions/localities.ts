"use server";

import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/utils/access-control";
import { revalidatePath } from "next/cache";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Start geocoding locality locations (fire and forget)
 * Creates a job and processes asynchronously
 */
export async function startLocalityGeocodingJob(): Promise<ActionResult<{ jobId: number }>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can geocode localities",
    };
  }

  const supabase = await getSupabaseServerClient();

  // Check if there's already a running or paused job
  const { data: existingJob } = await supabase
    .from("locality_geocoding_jobs")
    .select("id, status")
    .in("status", ["pending", "running", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingJob) {
    return {
      success: true,
      data: { jobId: existingJob.id },
    };
  }

  // Count localities that need geocoding (have name but no lat/lng)
  const { count: totalLocalities, error: countError } = await supabase
    .from("localities")
    .select("id", { count: "exact", head: true })
    .not("name", "is", null)
    .neq("name", "")
    .is("lat", null);

  if (countError) {
    return { success: false, error: `Failed to count localities: ${countError.message}` };
  }

  if (!totalLocalities || totalLocalities === 0) {
    return {
      success: false,
      error: "No localities found that need geocoding",
    };
  }

  // Create job record
  const { data: job, error: jobError } = await supabase
    .from("locality_geocoding_jobs")
    .insert({
      status: "pending",
      total_localities: totalLocalities,
      created_by: access.staffId || null,
    })
    .select()
    .single();

  if (jobError || !job) {
    return { success: false, error: `Failed to create job: ${jobError?.message || "Unknown error"}` };
  }

  // Start geocoding process asynchronously (fire and forget)
  processLocalityGeocodingJob(job.id).catch((error) => {
    console.error(`Locality geocoding job ${job.id} failed:`, error);
  });

  revalidatePath("/admin/reference-data/localities");
  revalidatePath("/[locale]/(admin)/admin/reference-data/localities");
  return {
    success: true,
    data: { jobId: job.id },
  };
}

/**
 * Process locality geocoding job asynchronously
 * This function runs in the background and updates job progress
 */
async function processLocalityGeocodingJob(jobId: number): Promise<void> {
  const supabase = await getSupabaseServerClient();

  try {
    // Get current job status to check if resuming
    const { data: currentJob } = await supabase
      .from("locality_geocoding_jobs")
      .select("status, processed_localities, geocoded_count, failed_count, skipped_count")
      .eq("id", jobId)
      .single();

    const isResuming = currentJob?.status === "paused";
    const alreadyProcessed = currentJob?.processed_localities || 0;
    let geocoded = currentJob?.geocoded_count || 0;
    let failed = currentJob?.failed_count || 0;
    let skipped = currentJob?.skipped_count || 0;
    let processed = alreadyProcessed;

    // Update job status to running (or keep running if already running)
    await supabase
      .from("locality_geocoding_jobs")
      .update({
        status: "running",
        started_at: isResuming ? undefined : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // Get all localities that don't have lat/lng yet and have a name
    const { data: localities, error: fetchError } = await supabase
      .from("localities")
      .select("id, name, code, description")
      .not("name", "is", null)
      .neq("name", "")
      .is("lat", null);

    if (fetchError || !localities) {
      throw new Error(`Failed to fetch localities: ${fetchError?.message || "Unknown error"}`);
    }

    // If resuming, skip already processed localities
    const localitiesToProcess = isResuming ? localities.slice(alreadyProcessed) : localities;

    // Process localities one by one with rate limiting
    for (const locality of localitiesToProcess) {
      // Check if job has been paused before processing each locality
      const { data: jobCheck } = await supabase
        .from("locality_geocoding_jobs")
        .select("status")
        .eq("id", jobId)
        .single();

      if (jobCheck?.status === "paused") {
        // Job was paused, exit the loop
        await supabase
          .from("locality_geocoding_jobs")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);
        return; // Exit function but don't mark as failed
      }

      if (jobCheck?.status !== "running") {
        // Job status changed to something else (completed, failed, etc.), exit
        return;
      }

      // Build address string from available fields
      const addressParts: string[] = [];
      if (locality.name) addressParts.push(locality.name);
      if (locality.code) addressParts.push(locality.code);
      // Add "Malaysia" or "Sabah" to improve geocoding accuracy
      addressParts.push("Sabah, Malaysia");

      const address = addressParts.join(", ").trim();

      if (!address || !locality.name) {
        skipped++;
        processed++;
        // Update progress
        await supabase
          .from("locality_geocoding_jobs")
          .update({
            processed_localities: processed,
            skipped_count: skipped,
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);
        continue;
      }

      try {
        // Geocode using Nominatim API
        // Rate limit: 1 request per second (Nominatim usage policy)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
          {
            headers: {
              "User-Agent": "iCare-Locality-Management/1.0", // Required by Nominatim usage policy
            },
          }
        );

        if (!response.ok) {
          failed++;
          processed++;
          // Update progress
          await supabase
            .from("locality_geocoding_jobs")
            .update({
              processed_localities: processed,
              failed_count: failed,
              updated_at: new Date().toISOString(),
            })
            .eq("id", jobId);
          // Wait before next request
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        const results: Array<{ lat: string; lon: string }> = await response.json();

        if (results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);

          if (!isNaN(lat) && !isNaN(lon)) {
            // Update locality with lat/lng
            const { error: updateError } = await supabase
              .from("localities")
              .update({
                lat,
                lng: lon,
                updated_at: new Date().toISOString(),
              })
              .eq("id", locality.id);

            if (updateError) {
              failed++;
            } else {
              geocoded++;
            }
          } else {
            failed++;
          }
        } else {
          failed++;
        }

        processed++;

        // Update progress every 10 localities or at the end
        if (processed % 10 === 0 || processed === localities.length) {
          await supabase
            .from("locality_geocoding_jobs")
            .update({
              processed_localities: processed,
              geocoded_count: geocoded,
              failed_count: failed,
              skipped_count: skipped,
              updated_at: new Date().toISOString(),
            })
            .eq("id", jobId);
        }

        // Rate limiting: wait 1 second between requests (Nominatim requirement)
        if (processed < localities.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        failed++;
        processed++;
        // Update progress even on error
        await supabase
          .from("locality_geocoding_jobs")
          .update({
            processed_localities: processed,
            failed_count: failed,
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);
        // Wait before next request
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Mark job as completed
    await supabase
      .from("locality_geocoding_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        processed_localities: processed,
        geocoded_count: geocoded,
        failed_count: failed,
        skipped_count: skipped,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // Note: Don't call revalidatePath here as this is a background process
    // The UI polls for updates, so revalidation happens via the polling mechanism
  } catch (error) {
    // Mark job as failed
    await supabase
      .from("locality_geocoding_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}

/**
 * Pause a running locality geocoding job
 */
export async function pauseLocalityGeocodingJob(
  jobId: number
): Promise<ActionResult<{ jobId: number }>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can pause geocoding jobs",
    };
  }

  const supabase = await getSupabaseServerClient();

  // Check if job exists and is running
  const { data: job, error: fetchError } = await supabase
    .from("locality_geocoding_jobs")
    .select("id, status")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) {
    return { success: false, error: `Failed to find job: ${fetchError?.message || "Unknown error"}` };
  }

  if (job.status !== "running") {
    return {
      success: false,
      error: `Cannot pause job: Job is not running (current status: ${job.status})`,
    };
  }

  // Update job status to paused
  const { error: updateError } = await supabase
    .from("locality_geocoding_jobs")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (updateError) {
    return { success: false, error: `Failed to pause job: ${updateError.message}` };
  }

  revalidatePath("/admin/reference-data/localities");
  revalidatePath("/[locale]/(admin)/admin/reference-data/localities");
  return {
    success: true,
    data: { jobId },
  };
}

/**
 * Resume a paused locality geocoding job
 */
export async function resumeLocalityGeocodingJob(
  jobId: number
): Promise<ActionResult<{ jobId: number }>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can resume geocoding jobs",
    };
  }

  const supabase = await getSupabaseServerClient();

  // Check if job exists and is paused
  const { data: job, error: fetchError } = await supabase
    .from("locality_geocoding_jobs")
    .select("id, status")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) {
    return { success: false, error: `Failed to find job: ${fetchError?.message || "Unknown error"}` };
  }

  if (job.status !== "paused") {
    return {
      success: false,
      error: `Cannot resume job: Job is not paused (current status: ${job.status})`,
    };
  }

  // Update job status to running
  const { error: updateError } = await supabase
    .from("locality_geocoding_jobs")
    .update({
      status: "running",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (updateError) {
    return { success: false, error: `Failed to resume job: ${updateError.message}` };
  }

  // Restart the geocoding process (it will skip already processed localities)
  processLocalityGeocodingJob(jobId).catch((error) => {
    console.error(`Locality geocoding job ${jobId} failed after resume:`, error);
  });

  revalidatePath("/admin/reference-data/localities");
  revalidatePath("/[locale]/(admin)/admin/reference-data/localities");
  return {
    success: true,
    data: { jobId },
  };
}

/**
 * Get locality geocoding job status
 */
export async function getLocalityGeocodingJobStatus(
  jobId: number
): Promise<ActionResult<{
  id: number;
  status: "pending" | "running" | "paused" | "completed" | "failed";
  totalLocalities: number;
  processedLocalities: number;
  geocodedCount: number;
  failedCount: number;
  skippedCount: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
}>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await getSupabaseReadOnlyClient();

  const { data: job, error } = await supabase
    .from("locality_geocoding_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return { success: false, error: `Failed to fetch job: ${error?.message || "Unknown error"}` };
  }

  return {
    success: true,
    data: {
      id: job.id,
      status: job.status as "pending" | "running" | "paused" | "completed" | "failed",
      totalLocalities: job.total_localities,
      processedLocalities: job.processed_localities,
      geocodedCount: job.geocoded_count,
      failedCount: job.failed_count,
      skippedCount: job.skipped_count,
      errorMessage: job.error_message,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    },
  };
}

/**
 * Get the latest locality geocoding job
 */
export async function getLatestLocalityGeocodingJob(): Promise<ActionResult<{
  id: number;
  status: "pending" | "running" | "paused" | "completed" | "failed";
  totalLocalities: number;
  processedLocalities: number;
  geocodedCount: number;
  failedCount: number;
  skippedCount: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
}>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await getSupabaseReadOnlyClient();

  const { data: job, error } = await supabase
    .from("locality_geocoding_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // No job found is not an error
    if (error.code === "PGRST116") {
      return { success: true, data: null as any };
    }
    return { success: false, error: `Failed to fetch job: ${error.message}` };
  }

  if (!job) {
    return { success: true, data: null as any };
  }

  return {
    success: true,
    data: {
      id: job.id,
      status: job.status as "pending" | "running" | "paused" | "completed" | "failed",
      totalLocalities: job.total_localities,
      processedLocalities: job.processed_localities,
      geocodedCount: job.geocoded_count,
      failedCount: job.failed_count,
      skippedCount: job.skipped_count,
      errorMessage: job.error_message,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    },
  };
}
