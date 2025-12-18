"use client";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { z } from "zod";
import LocationCapture from "./LocationCapture";
import MediaUploader from "./MediaUploader";
import { AlertCircle } from "lucide-react";
import { getActiveIssueTypes, type IssueType } from "@/lib/actions/issue-types";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { getReferenceDataList, type ReferenceData } from "@/lib/actions/reference-data";
import { getDunName } from "@/lib/actions/settings";
import { useTranslations } from "next-intl";

export default function CommunityReportIssuePage() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("issues.form");
  const tCommon = useTranslations("common");
  
  // Extract locale from pathname
  const locale = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];
    return firstSegment === 'en' || firstSegment === 'ms' ? firstSegment : 'en';
  }, [pathname]);
  
  // Create schema with translated messages
  const issueSchema = useMemo(() => z.object({
    title: z.string().min(1, t("titleRequired")).trim(),
    category: z.string().min(1, t("selectIssueType")),
    description: z.string().min(1, t("descriptionRequired")).trim(),
    address: z.string().min(1, t("addressRequired")).trim(),
    lat: z.string().optional(),
    lng: z.string().optional(),
    localityId: z.string().optional(),
    mediaJson: z.string().optional(),
  }), [t, locale]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [localities, setLocalities] = useState<ReferenceData[]>([]);
  const [selectedLocalityId, setSelectedLocalityId] = useState<string | number>("");
  const [dunName, setDunName] = useState<string>("N.18 Inanam");

  // Load issue types and localities on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingTypes(true);
      const [typesResult, localitiesResult, dunNameResult] = await Promise.all([
        getActiveIssueTypes(),
        getReferenceDataList("localities"),
        getDunName(),
      ]);
      if (typesResult.success && typesResult.data) {
        setIssueTypes(typesResult.data);
      }
      if (localitiesResult.success && localitiesResult.data) {
        setLocalities(localitiesResult.data.filter((loc) => loc.is_active));
      }
      if (dunNameResult) {
        setDunName(dunNameResult);
      }
      setIsLoadingTypes(false);
    };
    loadData();
  }, []);

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
      router.push(`/${locale}/community/dashboard`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("errors.failedToSubmit"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const createIssue = async (formData: FormData, issueTypes: IssueType[]) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get authenticated user from session to set reporter_id
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error(t("errors.mustBeLoggedIn"));
    }

    // Get user's profile ID to set as reporter_id
    let reporterId: number | null = null;
    if (user.email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", user.email.toLowerCase().trim())
        .maybeSingle();
      reporterId = profile?.id ?? null;
    }

    if (!reporterId) {
      throw new Error(t("errors.profileNotFound"));
    }

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
      throw new Error(t("errors.invalidFormData"));
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

    // Build insert object conditionally
    const insertData: Record<string, unknown> = {
      title, 
      description, 
      category: categoryCode, // Keep for backward compatibility
      issue_type_id: issueTypeId,
      address, 
      lat: latNum, 
      lng: lngNum,
      reporter_id: reporterId, // Set the reporter_id from authenticated user's profile
    };
    
    // Only include locality_id if it has a value (to avoid errors if column doesn't exist)
    if (localityIdNum !== undefined && localityIdNum !== null) {
      insertData.locality_id = localityIdNum;
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("issues")
      .insert(insertData)
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0 max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between gap-3 pb-2">
        <div className="flex flex-col gap-2 w-full sm:min-w-72">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">{t("title")}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <section className="lg:col-span-1 flex flex-col gap-4 order-2 lg:order-1">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{dunName.toUpperCase()}</h2>
            <p className="text-sm sm:text-base text-primary font-semibold mt-1">{t("communityIssueReporting")}</p>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">
              {t("description", { dunName })}
            </p>
            <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{t("carelineContact")}</p>
              <div className="mt-3 space-y-2.5 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg" aria-hidden="true">📞</span>
                  <a href="tel:01161818718" className="hover:text-primary transition-colors">011-618 18718</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg" aria-hidden="true">💬</span>
                  <a className="text-primary hover:underline" href="#" target="_blank" rel="noopener noreferrer">{t("whatsappUs")}</a>
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4">{t("motto")}</p>
          </div>
        </section>

        <section className="lg:col-span-2 order-1 lg:order-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4 sm:p-6">
            <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit} noValidate>
              {submitError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 p-3 sm:p-4 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="size-4 sm:size-5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="flex-1 break-words">{submitError}</span>
                </div>
              )}

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">{t("step1")}</h3>
                <div className="mt-3 space-y-4 sm:space-y-5">
                  <div>
                    <label htmlFor="title" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("titleLabel")} <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <Input 
                      id="title"
                      name="title" 
                      placeholder={t("titlePlaceholder")} 
                      className={`w-full ${errors.title ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                      required
                      aria-invalid={errors.title ? "true" : "false"}
                      aria-describedby={errors.title ? "title-error" : undefined}
                    />
                    {errors.title && (
                      <p id="title-error" className="mt-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5">
                        <AlertCircle className="size-3 sm:size-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{errors.title}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("typeOfIssue")} <span className="text-red-500" aria-label={tCommon("required")}>*</span>
                    </label>
                    <select 
                      id="category"
                      name="category" 
                      className={`mt-0 min-h-[44px] h-12 w-full rounded-lg border bg-white dark:bg-gray-800 px-3 sm:px-4 text-base sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:outline-none touch-manipulation appearance-none bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")] bg-[length:1.5em_1.5em] bg-[right_0.75rem_center] bg-no-repeat pr-10 ${
                        errors.category 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                          : "border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                      }`}
                      required
                      disabled={isLoadingTypes}
                      aria-invalid={errors.category ? "true" : "false"}
                      aria-describedby={errors.category ? "category-error" : undefined}
                    >
                      <option value="">{isLoadingTypes ? t("loadingIssueTypes") : t("selectIssueTypePlaceholder")}</option>
                      {issueTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p id="category-error" className="mt-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5">
                        <AlertCircle className="size-3 sm:size-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{errors.category}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("descriptionLabel")} <span className="text-red-500" aria-label={tCommon("required")}>*</span>
                    </label>
                    <textarea 
                      id="description"
                      name="description" 
                      rows={6}
                      placeholder={t("descriptionPlaceholder")} 
                      className={`w-full rounded-lg border bg-white dark:bg-gray-800 px-3 sm:px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:outline-none resize-y min-h-[120px] sm:min-h-[100px] ${
                        errors.description 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                          : "border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                      }`}
                      required
                      aria-invalid={errors.description ? "true" : "false"}
                      aria-describedby={errors.description ? "description-error" : undefined}
                    />
                    {errors.description && (
                      <p id="description-error" className="mt-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5">
                        <AlertCircle className="size-3 sm:size-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{errors.description}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">{t("step2")}</h3>
                <div className="mt-3 space-y-4 sm:space-y-5">
                  <div>
                    <label htmlFor="locality" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("localityOptional")}
                    </label>
                    <input
                      type="hidden"
                      name="localityId"
                      value={selectedLocalityId || ""}
                    />
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
                      placeholder={t("selectLocalityPlaceholder")}
                      disabled={isLoadingTypes}
                    />
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("addressOrLandmark")} <span className="text-red-500" aria-label={tCommon("required")}>*</span>
                    </label>
                    <Input 
                      id="address"
                      name="address" 
                      placeholder={t("addressPlaceholder")} 
                      className={`w-full ${errors.address ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                      required
                      aria-invalid={errors.address ? "true" : "false"}
                      aria-describedby={errors.address ? "address-error" : undefined}
                    />
                    {errors.address && (
                      <p id="address-error" className="mt-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5">
                        <AlertCircle className="size-3 sm:size-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{errors.address}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("pinpointOnMap")}</label>
                    <LocationCapture />
                    <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t("pinpointDescription")}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">{t("step3")}</h3>
                <MediaUploader />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto min-h-[48px] h-12 px-6 sm:px-8 text-base sm:text-sm font-semibold"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      {t("submitting")}
                    </>
                  ) : (
                    t("submitReport")
                  )}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}