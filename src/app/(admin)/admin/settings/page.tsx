"use client";

import { useState, useEffect } from "react";
import * as Switch from "@radix-ui/react-switch";
import * as Select from "@radix-ui/react-select";
import { UploadCloud, Save, Image as ImageIcon, X, Loader2, UserCheck, Shield, Users } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { getSetting, updateSetting, uploadImage } from "@/lib/actions/settings";
import { useRouter } from "next/navigation";

type LoginPageType = "staff" | "admin" | "community";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LoginPageType>("staff");
  const [adminHeaderTitle, setAdminHeaderTitle] = useState("");
  const [appName, setAppName] = useState("");
  
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

  useEffect(() => {
    async function loadSettings() {
      const [titleResult, appNameResult, staffImageResult, adminImageResult, communityImageResult] = await Promise.all([
        getSetting("admin_header_title"),
        getSetting("app_name"),
        getSetting("staff_login_image_url"),
        getSetting("admin_login_image_url"),
        getSetting("community_login_image_url"),
      ]);
      if (titleResult.success) {
        setAdminHeaderTitle(titleResult.data || "N.18 Inanam Community Watch");
      }
      if (appNameResult.success) {
        setAppName(appNameResult.data || "Community Watch");
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
      
      setLoading(false);
    }
    loadSettings();
  }, []);

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

    const [titleResult, appNameResult, staffImageResult, adminImageResult, communityImageResult] = await Promise.all([
      updateSetting(
        "admin_header_title",
        adminHeaderTitle || "N.18 Inanam Community Watch",
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
    ]);

    if (titleResult.success && appNameResult.success && staffImageResult.success && adminImageResult.success && communityImageResult.success) {
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
      setError(titleResult.error || appNameResult.error || staffImageResult.error || adminImageResult.error || communityImageResult.error || "Failed to save settings");
    }

    setSaving(false);
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">Platform Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage global application settings for the Community Watch platform.</p>
      </div>

      <form onSubmit={handleSave}>
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
                  placeholder="N.18 Inanam Community Watch"
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
            
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4">
                <p className="text-sm text-green-600 dark:text-green-400">Settings saved successfully!</p>
              </div>
            )}
            
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" type="button" onClick={() => router.refresh()}>
                <span>Cancel</span>
              </Button>
              <Button type="submit" disabled={loading || saving}>
                <Save className="size-5" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </Button>
            </div>
          </div>
        </div>
      </form>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">General Information</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update general contact and support information.</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="careline-number">CARELINE Phone Number</label>
            <Input id="careline-number" type="tel" placeholder="+60 12-345 6789" defaultValue="+60 18-181 8181" className="mt-1 w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="whatsapp-link">WhatsApp Link</label>
            <Input id="whatsapp-link" type="url" placeholder="https://wa.me/..." defaultValue="https://wa.me/60181818181" className="mt-1 w-full" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Issue Management</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Set default settings for new issue reports.</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="default-status">Default Status for New Issues</label>
            <Select.Root defaultValue="Open">
              <Select.Trigger id="default-status" className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white">
                <Select.Value />
                <span className="ml-2 text-gray-500">▾</span>
              </Select.Trigger>
              <Select.Content className="z-50 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
                <Select.Viewport className="p-1">
                  <Select.Item value="Open" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Open</Select.Item>
                  <Select.Item value="Under Review" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Under Review</Select.Item>
                  <Select.Item value="Pending" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Pending</Select.Item>
                </Select.Viewport>
              </Select.Content>
            </Select.Root>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="default-priority">Default Priority for New Issues</label>
            <Select.Root defaultValue="Medium">
              <Select.Trigger id="default-priority" className="mt-1 inline-flex items-center justify-between w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-white">
                <Select.Value />
                <span className="ml-2 text-gray-500">▾</span>
              </Select.Trigger>
              <Select.Content className="z-50 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
                <Select.Viewport className="p-1">
                  <Select.Item value="Low" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Low</Select.Item>
                  <Select.Item value="Medium" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Medium</Select.Item>
                  <Select.Item value="High" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">High</Select.Item>
                  <Select.Item value="Critical" className="px-3 py-2 rounded text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Critical</Select.Item>
                </Select.Viewport>
              </Select.Content>
            </Select.Root>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
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
            <Switch.Root defaultChecked className="relative inline-flex h-6 w-11 cursor-pointer rounded-full bg-primary data-[state=unchecked]:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary">
              <Switch.Thumb className="block h-5 w-5 translate-x-5 data-[state=unchecked]:translate-x-0 rounded-full bg-white shadow transition-transform" />
            </Switch.Root>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Issue Status Changed</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Notify when an issue&#39;s status is updated.</p>
            </div>
            <Switch.Root defaultChecked className="relative inline-flex h-6 w-11 cursor-pointer rounded-full bg-primary data-[state=unchecked]:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary">
              <Switch.Thumb className="block h-5 w-5 translate-x-5 data-[state=unchecked]:translate-x-0 rounded-full bg-white shadow transition-transform" />
            </Switch.Root>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">New User Registered</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Notify when a new resident registers on the platform.</p>
            </div>
            <Switch.Root className="relative inline-flex h-6 w-11 cursor-pointer rounded-full bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary">
              <Switch.Thumb className="block h-5 w-5 translate-x-0 data-[state=checked]:translate-x-5 rounded-full bg-white shadow transition-transform" />
            </Switch.Root>
          </div>
        </div>
      </div>
    </div>
  );
}
