"use client";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { z } from "zod";
import LocationCapture from "./LocationCapture";
import MediaUploader from "./MediaUploader";
import { AlertCircle } from "lucide-react";
import { getActiveIssueTypes, type IssueType } from "@/lib/actions/issue-types";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { getReferenceDataList, type ReferenceData } from "@/lib/actions/reference-data";

const issueSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  category: z.string().min(1, "Please select an issue type"),
  description: z.string().min(1, "Description is required").trim(),
  address: z.string().min(1, "Address is required").trim(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  localityId: z.string().optional(),
  mediaJson: z.string().optional(),
});

export default function CommunityReportIssuePage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [localities, setLocalities] = useState<ReferenceData[]>([]);
  const [selectedLocalityId, setSelectedLocalityId] = useState<string | number>("");

  // Load issue types and localities on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingTypes(true);
      const [typesResult, localitiesResult] = await Promise.all([
        getActiveIssueTypes(),
        getReferenceDataList("localities"),
      ]);
      if (typesResult.success && typesResult.data) {
        setIssueTypes(typesResult.data);
      }
      if (localitiesResult.success && localitiesResult.data) {
        setLocalities(localitiesResult.data.filter((loc) => loc.is_active));
      }
      setIsLoadingTypes(false);
    };
    loadData();
  }, []);

  const createIssue = async (formData: FormData, issueTypes: IssueType[]) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Extract and validate form data with Zod
    const formValues = {
      title: String(formData.get("title") || ""),
      category: String(formData.get("category") || ""),
      description: String(formData.get("description") || ""),
      address: String(formData.get("address") || ""),
      lat: String(formData.get("lat") || ""),
      lng: String(formData.get("lng") || ""),
      localityId: String(formData.get("localityId") || ""),
      mediaJson: String(formData.get("mediaJson") || ""),
    };

    const result = issueSchema.safeParse(formValues);
    
    if (!result.success) {
      throw new Error("Invalid form data. Please check all required fields.");
    }

    const { title, description, category, address, lat, lng, localityId, mediaJson } = result.data;
    const latNum = lat ? Number(lat) : undefined;
    const lngNum = lng ? Number(lng) : undefined;
    const localityIdNum = localityId ? Number(localityId) : undefined;

    // Find the issue type ID from the category (which is now the issue type ID)
    let issueTypeId: number | undefined;
    const categoryNum = parseInt(category);
    if (!isNaN(categoryNum)) {
      // If category is a number, treat it as issue_type_id
      issueTypeId = categoryNum;
    } else {
      // If category is a string (code), find the matching issue type
      const issueType = issueTypes.find((it) => it.code === category || it.id.toString() === category);
      if (issueType) {
        issueTypeId = issueType.id;
      }
    }

    // Get the category code for backward compatibility
    const issueType = issueTypes.find((it) => it.id === issueTypeId);
    const categoryCode = issueType?.code || "other";

    const { data: inserted, error: insertErr } = await supabase
      .from("issues")
      .insert({ 
        title, 
        description, 
        category: categoryCode, // Keep for backward compatibility
        issue_type_id: issueTypeId,
        address, 
        lat: latNum, 
        lng: lngNum,
        locality_id: localityIdNum || null,
      })
      .select("id")
      .single();

    if (insertErr) {
      throw new Error(insertErr.message);
    }

    try {
      const items: Array<{ url: string; type?: string; size_bytes?: number }> = mediaJson ? JSON.parse(mediaJson) : [];
      if (inserted?.id && items.length > 0) {
        await supabase
          .from("issue_media")
          .insert(
            items.map((m) => ({
              issue_id: inserted.id,
              url: m.url,
              type: (m.type ?? "image").slice(0, 16),
              size_bytes: m.size_bytes ?? null,
            }))
          );
      }
    } catch {
      // ignore media insert errors for now
    }

    return { success: true };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    
    // Extract form values
    const formValues = {
      title: String(formData.get("title") || ""),
      category: String(formData.get("category") || ""),
      description: String(formData.get("description") || ""),
      address: String(formData.get("address") || ""),
      lat: String(formData.get("lat") || ""),
      lng: String(formData.get("lng") || ""),
      localityId: String(formData.get("localityId") || ""),
      mediaJson: String(formData.get("mediaJson") || ""),
    };

    // Validate with Zod
    const result = issueSchema.safeParse(formValues);
    
    if (!result.success) {
      // Format Zod errors into a simple object
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !formattedErrors[field]) {
          formattedErrors[field] = issue.message;
        }
      });
      
      setErrors(formattedErrors);
      
      // Scroll to first error
      const firstErrorField = Object.keys(formattedErrors)[0];
      if (firstErrorField) {
        setTimeout(() => {
          const element = document.querySelector(`[name="${firstErrorField}"]`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
          (element as HTMLElement)?.focus();
        }, 100);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await createIssue(formData, issueTypes);
      router.push("/community/dashboard");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
      <div className="flex flex-wrap justify-between gap-3 pb-2">
        <div className="flex flex-col gap-2 w-full sm:min-w-72">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">Report an Issue</p>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Provide details so community moderators can act quickly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <section className="lg:col-span-1 flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">N.18 INANAM</h2>
            <p className="text-sm text-primary font-semibold mt-1">Community Issue Reporting</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Facing issues like potholes, clogged drains, or faulty streetlights? Let us know.
              We are committed to monitoring every report from the residents of N.18 Inanam.
            </p>
            <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">CARELINE Contact</p>
              <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2"><span>📞</span><span>011-618 18718</span></div>
                <div className="flex items-center gap-2"><span>💬</span><a className="text-primary hover:underline" href="#">WhatsApp Us</a></div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">In God We Trust, Unite We Must.</p>
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4 sm:p-6">
            <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
              {submitError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span className="flex-1">{submitError}</span>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Step 1: Issue Details</h3>
                <div className="mt-3 space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      name="title" 
                      placeholder="Short title, e.g., Pothole near school" 
                      className={`mt-1 w-full ${errors.title ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {errors.title}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Type of Issue <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="category" 
                      className={`mt-1 min-h-[44px] h-10 w-full rounded-lg border bg-white dark:bg-gray-800 px-3 text-base sm:text-sm text-gray-900 dark:text-white focus:ring-1 touch-manipulation ${
                        errors.category 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                          : "border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                      }`}
                      required
                      disabled={isLoadingTypes}
                    >
                      <option value="">{isLoadingTypes ? "Loading issue types..." : "Select an issue type"}</option>
                      {issueTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {errors.category}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description of Issue <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      name="description" 
                      rows={5} 
                      placeholder="Please provide as much detail as possible. What happened? When? What is the impact?" 
                      className={`mt-1 w-full rounded-lg border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-1 resize-y min-h-[100px] ${
                        errors.description 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                          : "border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                      }`}
                      required
                    />
                    {errors.description && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Step 2: Location</h3>
                <div className="mt-3 space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Locality (optional)
                    </label>
                    <input
                      type="hidden"
                      name="localityId"
                      value={selectedLocalityId || ""}
                    />
                    <div className="mt-1">
                      <SearchableSelect
                        options={localities.map((loc) => ({ value: loc.id, label: loc.name }))}
                        value={selectedLocalityId}
                        onChange={(value) => {
                          setSelectedLocalityId(value);
                          // Update hidden input for form submission
                          const form = document.querySelector('form');
                          if (form) {
                            const hiddenInput = form.querySelector('input[name="localityId"]') as HTMLInputElement;
                            if (hiddenInput) {
                              hiddenInput.value = String(value || "");
                            }
                          }
                        }}
                        placeholder="Select locality..."
                        disabled={isLoadingTypes}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Address or Landmark <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      name="address" 
                      placeholder="e.g., Jalan Inanam, near the community hall" 
                      className={`mt-1 w-full ${errors.address ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                      required
                    />
                    {errors.address && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {errors.address}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pinpoint on Map</label>
                    <LocationCapture />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Drag the pin to the exact location of the issue for fastest response.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Step 3: Attach Media</h3>
                <MediaUploader />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto h-12 px-6 text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
