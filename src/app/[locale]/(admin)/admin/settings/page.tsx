"use client";

import { useState, useEffect, use } from "react";
import * as Switch from "@radix-ui/react-switch";
import * as Select from "@radix-ui/react-select";
import { UploadCloud, Save, Image as ImageIcon, X, Loader2, UserCheck, Shield, Users } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { getSetting, updateSetting, uploadImage, getDunName } from "@/lib/actions/settings";
import { getReferenceDataList } from "@/lib/actions/reference-data";
import { useRouter } from "next/navigation";

type LoginPageType = "staff" | "admin" | "community";

export default function AdminSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Unwrap params and searchParams to prevent Next.js 16 async params errors
  use(params);
  use(searchParams);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LoginPageType>("staff");
  const [adminHeaderTitle, setAdminHeaderTitle] = useState("");
  const [appName, setAppName] = useState("");
  const [dunName, setDunName] = useState<string>("N.18 Inanam");
  
  // Login image states for each page type
  const [loginImages, setLoginImages] = useState<Record<LoginPageType, {
    url: string;
    input: string;
    preview: string | null;
  }>>({
    staff: { url: "", input: "", preview: null },
    admin: { url: "", input: "", preview: null },
    community: { url: "", input: "", preview: null },
  });
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Parliament, DUN, and Zone selection states
  const [selectedParliamentId, setSelectedParliamentId] = useState<string>("");
  const [selectedDunId, setSelectedDunId] = useState<string>("");
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  
  // Lists for dropdowns
  const [parliaments, setParliaments] = useState<Array<{ id: number; name: string }>>([]);
  const [duns, setDuns] = useState<Array<{ id: number; name: string; parliament_id: number | null }>>([]);
  const [zones, setZones] = useState<Array<{ id: number; name: string; dun_id: number | null }>>([]);
  
  // General Information states
  const [carelinePhone, setCarelinePhone] = useState<string>("");
  const [whatsappLink, setWhatsappLink] = useState<string>("");
  
  // Issue Management states
  const [defaultIssueStatus, setDefaultIssueStatus] = useState<string>("Open");
  const [defaultIssuePriority, setDefaultIssuePriority] = useState<string>("Medium");
  
  // Notification Preferences states
  const [notifyNewIssue, setNotifyNewIssue] = useState<boolean>(true);
  const [notifyStatusChanged, setNotifyStatusChanged] = useState<boolean>(true);
  const [notifyNewUser, setNotifyNewUser] = useState<boolean>(false);
  
  // Filtered lists based on selections
  const filteredDuns = selectedParliamentId 
    ? duns.filter(dun => dun.parliament_id === parseInt(selectedParliamentId))
    : duns;
  const filteredZones = selectedDunId
    ? zones.filter(zone => zone.dun_id !== null && zone.dun_id === parseInt(selectedDunId))
    : zones;

  useEffect(() => {
    async function loadSettings() {
      const [
        titleResult, 
        appNameResult, 
        staffImageResult, 
        adminImageResult, 
        communityImageResult,
        parliamentResult,
        dunResult,
        zoneResult,
        carelineResult,
        whatsappResult,
        defaultStatusResult,
        defaultPriorityResult,
        notifyNewIssueResult,
        notifyStatusChangedResult,
        notifyNewUserResult,
        dunNameResult
      ] = await Promise.all([
        getSetting("admin_header_title"),
        getSetting("app_name"),
        getSetting("staff_login_image_url"),
        getSetting("admin_login_image_url"),
        getSetting("community_login_image_url"),
        getSetting("system_parliament_id"),
        getSetting("system_dun_id"),
        getSetting("system_zone_id"),
        getSetting("careline_phone"),
        getSetting("whatsapp_link"),
        getSetting("default_issue_status"),
        getSetting("default_issue_priority"),
        getSetting("notify_new_issue"),
        getSetting("notify_status_changed"),
        getSetting("notify_new_user"),
        getDunName(),
      ]);
      
      const defaultDunName = dunNameResult || "N.18 Inanam";
      setDunName(defaultDunName);
      
      if (titleResult.success) {
        setAdminHeaderTitle(titleResult.data || `${defaultDunName} Community Watch`);
      }
      if (appNameResult.success) {
        setAppName(appNameResult.data || "Community Watch");
      }
      
      // Load parliament, DUN, and zone settings
      if (parliamentResult.success && parliamentResult.data) {
        setSelectedParliamentId(parliamentResult.data);
      }
      if (dunResult.success && dunResult.data) {
        setSelectedDunId(dunResult.data);
      }
      if (zoneResult.success && zoneResult.data) {
        setSelectedZoneId(zoneResult.data);
      }
      
      // Load General Information settings
      if (carelineResult.success && carelineResult.data) {
        setCarelinePhone(carelineResult.data);
      } else {
        setCarelinePhone("+60 18-181 8181"); // Default value
      }
      if (whatsappResult.success && whatsappResult.data) {
        setWhatsappLink(whatsappResult.data);
      } else {
        setWhatsappLink("https://wa.me/60181818181"); // Default value
      }
      
      // Load Issue Management settings
      if (defaultStatusResult.success && defaultStatusResult.data) {
        setDefaultIssueStatus(defaultStatusResult.data);
      }
      if (defaultPriorityResult.success && defaultPriorityResult.data) {
        setDefaultIssuePriority(defaultPriorityResult.data);
      }
      
      // Load Notification Preferences settings
      if (notifyNewIssueResult.success && notifyNewIssueResult.data) {
        setNotifyNewIssue(notifyNewIssueResult.data === "true");
      }
      if (notifyStatusChangedResult.success && notifyStatusChangedResult.data) {
        setNotifyStatusChanged(notifyStatusChangedResult.data === "true");
      }
      if (notifyNewUserResult.success && notifyNewUserResult.data) {
        setNotifyNewUser(notifyNewUserResult.data === "true");
      }
      
      // Load login images
      setLoginImages({
        staff: {
          url: staffImageResult.success && staffImageResult.data ? staffImageResult.data : "",
          input: staffImageResult.success && staffImageResult.data ? staffImageResult.data : "",
          preview: staffImageResult.success && staffImageResult.data ? staffImageResult.data : null,
        },
        admin: {
          url: adminImageResult.success && adminImageResult.data ? adminImageResult.data : "",
          input: adminImageResult.success && adminImageResult.data ? adminImageResult.data : "",
          preview: adminImageResult.success && adminImageResult.data ? adminImageResult.data : null,
        },
        community: {
          url: communityImageResult.success && communityImageResult.data ? communityImageResult.data : "",
          input: communityImageResult.success && communityImageResult.data ? communityImageResult.data : "",
          preview: communityImageResult.success && communityImageResult.data ? communityImageResult.data : null,
        },
      });
      
      // Load parliaments, DUNs, and zones lists
      const [parliamentsResult, dunsResult, zonesResult] = await Promise.all([
        getReferenceDataList("parliaments"),
        getReferenceDataList("duns"),
        getReferenceDataList("zones"),
      ]);
      
      if (parliamentsResult.success && parliamentsResult.data) {
        // Filter out inactive parliaments (if is_active is explicitly false)
        const parliamentList = parliamentsResult.data
          .filter(p => p.is_active !== false)
          .map(p => ({ id: p.id, name: p.name }));
        setParliaments(parliamentList);
      }
      
      if (dunsResult.success && dunsResult.data) {
        const dunsList = dunsResult.data.map(d => {
          const item = d as any;
          // parliament_id should be preserved in the transformed data
          // The getReferenceDataList function spreads {...item} which should preserve all fields
          const parliamentId = item.parliament_id ?? item.parliamentId ?? null;
          return { 
            id: d.id, 
            name: d.name, 
            parliament_id: parliamentId
          };
        });
        setDuns(dunsList);
      }
      
      if (zonesResult.success && zonesResult.data) {
        const zonesList = zonesResult.data.map(z => {
          const item = z as any;
          // dun_id should be preserved in the transformed data
          const dunId = item.dun_id ?? item.dunId ?? null;
          return { 
            id: z.id, 
            name: z.name, 
            dun_id: dunId
          };
        });
        setZones(zonesList);
      }
      
      setLoading(false);
    }
    loadSettings();
  }, []);
  
  // Update DUN and Zone selections when Parliament changes
  useEffect(() => {
    if (selectedParliamentId) {
      // Reset DUN if it doesn't belong to selected parliament
      const selectedDun = duns.find(d => d.id === parseInt(selectedDunId));
      if (selectedDun && selectedDun.parliament_id !== parseInt(selectedParliamentId)) {
        setSelectedDunId("");
        setSelectedZoneId("");
      }
    } else {
      setSelectedDunId("");
      setSelectedZoneId("");
    }
  }, [selectedParliamentId, duns]);
  
  // Update Zone selection when DUN changes
  useEffect(() => {
    if (selectedDunId) {
      // Reset Zone if it doesn't belong to selected DUN
      const selectedZone = zones.find(z => z.id === parseInt(selectedZoneId));
      if (selectedZone && selectedZone.dun_id !== parseInt(selectedDunId)) {
        setSelectedZoneId("");
      }
    } else {
      setSelectedZoneId("");
    }
  }, [selectedDunId, zones, selectedZoneId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, pageType: LoginPageType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      setUploadingImage(false);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      setUploadingImage(false);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLoginImages(prev => ({
        ...prev,
        [pageType]: {
          ...prev[pageType],
          preview: reader.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);

    // Upload image
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadImage(formData, "login-images");
    
    if (result.success && result.data) {
      setLoginImages(prev => ({
        ...prev,
        [pageType]: {
          url: result.data!,
          input: result.data!,
          preview: result.data!,
        },
      }));
    } else {
      setError(result.error || "Failed to upload image");
    }

    setUploadingImage(false);
    // Reset input
    e.target.value = "";
  };

  const handleImageUrlChange = (url: string, pageType: LoginPageType) => {
    setLoginImages(prev => ({
      ...prev,
      [pageType]: {
        ...prev[pageType],
        input: url,
      },
    }));
    
    // Validate URL format
    try {
      new URL(url);
      setLoginImages(prev => ({
        ...prev,
        [pageType]: {
          ...prev[pageType],
          preview: url,
        },
      }));
      setError(null);
    } catch {
      // Invalid URL, but allow user to continue typing
      if (url === "") {
        setLoginImages(prev => ({
          ...prev,
          [pageType]: {
            ...prev[pageType],
            preview: null,
          },
        }));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Validate login image URLs if provided
    for (const [pageType, imageData] of Object.entries(loginImages)) {
      if (imageData.input && imageData.input.trim() !== "") {
        try {
          new URL(imageData.input);
        } catch {
          setError(`Please enter a valid image URL for ${pageType} login page`);
          setSaving(false);
          return;
        }
      }
    }

    const [
      titleResult, 
      appNameResult, 
      staffImageResult, 
      adminImageResult, 
      communityImageResult, 
      parliamentResult, 
      dunResult, 
      zoneResult,
      carelineResult,
      whatsappResult,
      defaultStatusResult,
      defaultPriorityResult,
      notifyNewIssueResult,
      notifyStatusChangedResult,
      notifyNewUserResult
    ] = await Promise.all([
      updateSetting(
        "admin_header_title",
        adminHeaderTitle || `${dunName} Community Watch`,
        "The title displayed in the admin header"
      ),
      updateSetting(
        "app_name",
        appName || "Community Watch",
        "The application name displayed in the sidebar"
      ),
      updateSetting(
        "staff_login_image_url",
        loginImages.staff.input.trim() || "",
        "The image URL displayed on the staff login page"
      ),
      updateSetting(
        "admin_login_image_url",
        loginImages.admin.input.trim() || "",
        "The image URL displayed on the admin login page"
      ),
      updateSetting(
        "community_login_image_url",
        loginImages.community.input.trim() || "",
        "The image URL displayed on the community login page"
      ),
      updateSetting(
        "system_parliament_id",
        selectedParliamentId || "",
        "The parliament ID this system is configured for"
      ),
      updateSetting(
        "system_dun_id",
        selectedDunId || "",
        "The DUN ID this system is configured for"
      ),
      updateSetting(
        "system_zone_id",
        selectedZoneId || "",
        "The zone ID this system is configured for"
      ),
      updateSetting(
        "careline_phone",
        carelinePhone || "+60 18-181 8181",
        "CARELINE phone number for contact"
      ),
      updateSetting(
        "whatsapp_link",
        whatsappLink || "https://wa.me/60181818181",
        "WhatsApp link for contact"
      ),
      updateSetting(
        "default_issue_status",
        defaultIssueStatus || "Open",
        "Default status for new issues"
      ),
      updateSetting(
        "default_issue_priority",
        defaultIssuePriority || "Medium",
        "Default priority for new issues"
      ),
      updateSetting(
        "notify_new_issue",
        notifyNewIssue.toString(),
        "Notify when a new issue is submitted"
      ),
      updateSetting(
        "notify_status_changed",
        notifyStatusChanged.toString(),
        "Notify when an issue status is changed"
      ),
      updateSetting(
        "notify_new_user",
        notifyNewUser.toString(),
        "Notify when a new user registers"
      ),
    ]);

    if (
      titleResult.success && 
      appNameResult.success && 
      staffImageResult.success && 
      adminImageResult.success && 
      communityImageResult.success && 
      parliamentResult.success && 
      dunResult.success && 
      zoneResult.success &&
      carelineResult.success &&
      whatsappResult.success &&
      defaultStatusResult.success &&
      defaultPriorityResult.success &&
      notifyNewIssueResult.success &&
      notifyStatusChangedResult.success &&
      notifyNewUserResult.success
    ) {
      // Update local state
      setLoginImages(prev => ({
        staff: { ...prev.staff, url: prev.staff.input.trim() },
        admin: { ...prev.admin, url: prev.admin.input.trim() },
        community: { ...prev.community, url: prev.community.input.trim() },
      }));
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.refresh();
      }, 2000);
    } else {
      const errorMessages = [
        titleResult.error,
        appNameResult.error,
        staffImageResult.error,
        adminImageResult.error,
        communityImageResult.error,
        parliamentResult.error,
        dunResult.error,
        zoneResult.error,
        carelineResult.error,
        whatsappResult.error,
        defaultStatusResult.error,
        defaultPriorityResult.error,
        notifyNewIssueResult.error,
        notifyStatusChangedResult.error,
        notifyNewUserResult.error
      ].filter(Boolean);
      
      setError(errorMessages[0] || "Failed to save settings");
    }

    setSaving(false);
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Platform Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage global application settings for the Community Watch platform.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold">Branding</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Customize the look and feel of the application.</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="app-name">
                App Name
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                The application name displayed in the sidebar.
              </p>
              {loading ? (
                <Input id="app-name" disabled value="" className="mt-1 w-full" placeholder="Loading..." />
              ) : (
                <Input
                  id="app-name"
                  value={appName || ""}
                  onChange={(e) => setAppName(e.target.value)}
                  className="mt-1 w-full"
                  placeholder="Community Watch"
                />
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="admin-header-title">
                Admin Header Title
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                The title displayed in the admin header at the top of the page.
              </p>
              {loading ? (
                <Input id="admin-header-title" disabled value="" className="mt-1 w-full" placeholder="Loading..." />
              ) : (
                <Input
                  id="admin-header-title"
                  value={adminHeaderTitle || ""}
                  onChange={(e) => setAdminHeaderTitle(e.target.value)}
                  className="mt-1 w-full"
                  placeholder={`${dunName} Community Watch`}
                />
              )}
            </div>
            {/* Login Page Images Section */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 block">
                Login Page Images
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Manage images for different login pages. You can upload an image or use an image URL.
              </p>
              
              {/* Tabs */}
              <div className="mb-6">
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab("staff")}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === "staff"
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="size-4" />
                      <span>Staff</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("admin")}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === "admin"
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="size-4" />
                      <span>Admin</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("community")}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === "community"
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="size-4" />
                      <span>Community</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex flex-col gap-4">
                {/* Image Preview */}
                {loginImages[activeTab].preview && (
                  <div className="relative w-full max-w-md">
                    <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50 aspect-video">
                      <img
                        src={loginImages[activeTab].preview!}
                        alt={`${activeTab} login image preview`}
                        className="w-full h-full object-cover"
                        onError={() => {
                          setLoginImages(prev => ({
                            ...prev,
                            [activeTab]: {
                              ...prev[activeTab],
                              preview: null,
                            },
                          }));
                          setError("Failed to load image. Please check the URL.");
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginImages(prev => ({
                          ...prev,
                          [activeTab]: {
                            url: "",
                            input: "",
                            preview: null,
                          },
                        }));
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}

                {/* Upload Section */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center hover:border-primary dark:hover:border-primary transition-colors">
                      {uploadingImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="size-8 text-primary animate-spin" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="mx-auto size-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF or WebP (max. 5MB)</p>
                        </>
                      )}
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, activeTab)}
                        disabled={uploadingImage || loading}
                      />
                    </label>
                  </div>
                </div>

                {/* URL Input */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                    Or enter image URL:
                  </label>
                  <Input
                    id={`${activeTab}-login-image-url`}
                    type="url"
                    value={loginImages[activeTab].input || ""}
                    onChange={(e) => handleImageUrlChange(e.target.value, activeTab)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full"
                    disabled={loading || uploadingImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Configuration Section */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark mt-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold">System Configuration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure which parliament, DUN, and zone this system is for.</p>
          </div>
          <div className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="parliament-select">
                    Parliament
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                    Select the parliament this system is configured for.
                  </p>
                  {loading ? (
                    <Select.Root disabled>
                      <Select.Trigger id="parliament-select" className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white">
                        <Select.Value placeholder="Loading..." />
                        <span className="ml-2 text-gray-500">▾</span>
                      </Select.Trigger>
                    </Select.Root>
                  ) : (
                    <Select.Root 
                      value={selectedParliamentId || undefined} 
                      onValueChange={(value) => setSelectedParliamentId(value || "")}
                    >
                      <Select.Trigger id="parliament-select" className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white">
                        <Select.Value placeholder="Select a parliament" />
                        <span className="ml-2 text-gray-500">▾</span>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content 
                          className="z-[100] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg min-w-[var(--radix-select-trigger-width)]"
                          position="popper"
                          sideOffset={4}
                        >
                          <Select.Viewport className="p-1">
                            {parliaments.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                No parliaments available
                              </div>
                            ) : (
                              parliaments.map((parliament) => (
                                <Select.Item 
                                  key={parliament.id} 
                                  value={parliament.id.toString()} 
                                  className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700"
                                >
                                  <Select.ItemText>{parliament.name}</Select.ItemText>
                                </Select.Item>
                              ))
                            )}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="dun-select">
                    DUN (Dewan Undangan Negeri)
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                    Select the DUN this system is configured for. Only DUNs belonging to the selected parliament will be shown.
                  </p>
                  {loading ? (
                    <Select.Root disabled>
                      <Select.Trigger id="dun-select" className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white">
                        <Select.Value placeholder="Loading..." />
                        <span className="ml-2 text-gray-500">▾</span>
                      </Select.Trigger>
                    </Select.Root>
                  ) : (
                    <Select.Root 
                      value={selectedDunId || undefined} 
                      onValueChange={(value) => setSelectedDunId(value || "")}
                      disabled={!selectedParliamentId}
                    >
                      <Select.Trigger 
                        id="dun-select" 
                        className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Select.Value placeholder={selectedParliamentId ? "Select a DUN" : "Select a parliament first"} />
                        <span className="ml-2 text-gray-500">▾</span>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content 
                          className="z-[100] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg min-w-[var(--radix-select-trigger-width)]"
                          position="popper"
                          sideOffset={4}
                        >
                          <Select.Viewport className="p-1">
                            {filteredDuns.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {selectedParliamentId ? "No DUNs available for this parliament" : "Select a parliament first"}
                              </div>
                            ) : (
                              filteredDuns.map((dun) => (
                                <Select.Item 
                                  key={dun.id} 
                                  value={dun.id.toString()} 
                                  className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700"
                                >
                                  <Select.ItemText>{dun.name}</Select.ItemText>
                                </Select.Item>
                              ))
                            )}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="zone-select">
                    Zone
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                    Select the zone this system is configured for. Only zones belonging to the selected DUN will be shown.
                  </p>
                  {loading ? (
                    <Select.Root disabled>
                      <Select.Trigger id="zone-select" className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white">
                        <Select.Value placeholder="Loading..." />
                        <span className="ml-2 text-gray-500">▾</span>
                      </Select.Trigger>
                    </Select.Root>
                  ) : (
                    <Select.Root 
                      value={selectedZoneId || undefined} 
                      onValueChange={(value) => setSelectedZoneId(value || "")}
                      disabled={!selectedDunId}
                    >
                      <Select.Trigger 
                        id="zone-select" 
                        className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Select.Value placeholder={selectedDunId ? "Select a zone" : "Select a DUN first"} />
                        <span className="ml-2 text-gray-500">▾</span>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content 
                          className="z-[100] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg min-w-[var(--radix-select-trigger-width)]"
                          position="popper"
                          sideOffset={4}
                        >
                          <Select.Viewport className="p-1">
                            {filteredZones.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {selectedDunId ? "No zones available for this DUN" : "Select a DUN first"}
                              </div>
                            ) : (
                              filteredZones.map((zone) => (
                                <Select.Item 
                                  key={zone.id} 
                                  value={zone.id.toString()} 
                                  className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700"
                                >
                                  <Select.ItemText>{zone.name}</Select.ItemText>
                                </Select.Item>
                              ))
                            )}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  )}
                </div>
          </div>
        </div>

        {/* General Information Section */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark mt-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold">General Information</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update general contact and support information.</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="careline-number">CARELINE Phone Number</label>
              {loading ? (
                <Input id="careline-number" type="tel" disabled value="" className="mt-1 w-full" placeholder="Loading..." />
              ) : (
                <Input 
                  id="careline-number" 
                  type="tel" 
                  placeholder="+60 12-345 6789" 
                  value={carelinePhone}
                  onChange={(e) => setCarelinePhone(e.target.value)}
                  className="mt-1 w-full" 
                />
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="whatsapp-link">WhatsApp Link</label>
              {loading ? (
                <Input id="whatsapp-link" type="url" disabled value="" className="mt-1 w-full" placeholder="Loading..." />
              ) : (
                <Input 
                  id="whatsapp-link" 
                  type="url" 
                  placeholder="https://wa.me/..." 
                  value={whatsappLink}
                  onChange={(e) => setWhatsappLink(e.target.value)}
                  className="mt-1 w-full" 
                />
              )}
            </div>
          </div>
        </div>

        {/* Issue Management Section */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark mt-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold">Issue Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Set default settings for new issue reports.</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="default-status">Default Status for New Issues</label>
              {loading ? (
                <Select.Root disabled>
                  <Select.Trigger id="default-status" className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white">
                    <Select.Value placeholder="Loading..." />
                    <span className="ml-2 text-gray-500">▾</span>
                  </Select.Trigger>
                </Select.Root>
              ) : (
                <Select.Root value={defaultIssueStatus} onValueChange={setDefaultIssueStatus}>
                  <Select.Trigger id="default-status" className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white">
                    <Select.Value />
                    <span className="ml-2 text-gray-500">▾</span>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-[100] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg min-w-[var(--radix-select-trigger-width)]" position="popper" sideOffset={4}>
                      <Select.Viewport className="p-1">
                        <Select.Item value="Open" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700">
                          <Select.ItemText>Open</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="Under Review" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700">
                          <Select.ItemText>Under Review</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="Pending" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700">
                          <Select.ItemText>Pending</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="default-priority">Default Priority for New Issues</label>
              {loading ? (
                <Select.Root disabled>
                  <Select.Trigger id="default-priority" className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white">
                    <Select.Value placeholder="Loading..." />
                    <span className="ml-2 text-gray-500">▾</span>
                  </Select.Trigger>
                </Select.Root>
              ) : (
                <Select.Root value={defaultIssuePriority} onValueChange={setDefaultIssuePriority}>
                  <Select.Trigger id="default-priority" className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white">
                    <Select.Value />
                    <span className="ml-2 text-gray-500">▾</span>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-[100] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg min-w-[var(--radix-select-trigger-width)]" position="popper" sideOffset={4}>
                      <Select.Viewport className="p-1">
                        <Select.Item value="Low" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700">
                          <Select.ItemText>Low</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="Medium" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700">
                          <Select.ItemText>Medium</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="High" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700">
                          <Select.ItemText>High</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="Critical" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700">
                          <Select.ItemText>Critical</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              )}
            </div>
          </div>
        </div>

        {/* Notification Preferences Section */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark mt-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold">Notification Preferences</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure when administrators receive notifications.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">New Issue Submitted</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Notify when a resident submits a new issue report.</p>
              </div>
              <Switch.Root 
                checked={notifyNewIssue} 
                onCheckedChange={setNotifyNewIssue}
                className="relative inline-flex h-6 w-11 cursor-pointer rounded-full bg-primary data-[state=unchecked]:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Switch.Thumb className="block h-5 w-5 translate-x-5 data-[state=unchecked]:translate-x-0 rounded-full bg-white shadow transition-transform" />
              </Switch.Root>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Issue Status Changed</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Notify when an issue&#39;s status is updated.</p>
              </div>
              <Switch.Root 
                checked={notifyStatusChanged} 
                onCheckedChange={setNotifyStatusChanged}
                className="relative inline-flex h-6 w-11 cursor-pointer rounded-full bg-primary data-[state=unchecked]:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Switch.Thumb className="block h-5 w-5 translate-x-5 data-[state=unchecked]:translate-x-0 rounded-full bg-white shadow transition-transform" />
              </Switch.Root>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">New User Registered</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Notify when a new resident registers on the platform.</p>
              </div>
              <Switch.Root 
                checked={notifyNewUser} 
                onCheckedChange={setNotifyNewUser}
                className="relative inline-flex h-6 w-11 cursor-pointer rounded-full bg-gray-300 data-[state=checked]:bg-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Switch.Thumb className="block h-5 w-5 translate-x-0 data-[state=checked]:translate-x-5 rounded-full bg-white shadow transition-transform" />
              </Switch.Root>
            </div>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 mt-8">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4 mt-8">
            <p className="text-sm text-green-600 dark:text-green-400">Settings saved successfully!</p>
          </div>
        )}
        
        {/* Save and Cancel Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button variant="outline" type="button" onClick={() => router.refresh()}>
            <span>Cancel</span>
          </Button>
          <Button type="submit" disabled={loading || saving}>
            <Save className="size-5" />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
