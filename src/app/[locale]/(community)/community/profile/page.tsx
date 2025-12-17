"use client";

import Image from "next/image";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Pencil } from "lucide-react";
import { useState, useEffect, FormEvent } from "react";
import { getCurrentUserProfile, updateProfile, type ProfileData } from "@/lib/actions/profile";
import { createClient } from "@supabase/supabase-js";
import { getDunName } from "@/lib/actions/settings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CommunityProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [dunName, setDunName] = useState<string>("N.18 Inanam");

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        setUserAvatar(user.user_metadata?.avatar_url || null);
      }

      // Get profile data
      const profileData = await getCurrentUserProfile();
      
      if (profileData) {
        setProfile(profileData);
        setFormData({
          fullName: profileData.fullName || "",
          email: profileData.email || user?.email || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
        });
      } else if (user) {
        // No profile yet, initialize with user data
        setFormData({
          fullName: user.user_metadata?.full_name || "",
          email: user.email || "",
          phone: "",
          address: "",
        });
      }
    } catch (err) {
      setError("Failed to load profile. Please try again.");
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
    
    // Load DUN name
    const loadDunName = async () => {
      try {
        const name = await getDunName();
        setDunName(name);
      } catch (err) {
        console.error("Failed to load DUN name:", err);
      }
    };
    loadDunName();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const result = await updateProfile({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
      });

      if (result.success) {
        setSuccess(true);
        // Reload profile to get updated data
        await loadProfile();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original profile data
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    } else if (userEmail) {
      setFormData({
        fullName: "",
        email: userEmail,
        phone: "",
        address: "",
      });
    }
    setErrors({});
    setError(null);
    setSuccess(false);
  };

  const displayName = profile?.fullName || formData.fullName || "User";
  const displayEmail = profile?.email || userEmail || "";
  const avatarUrl = profile?.avatarUrl || userAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuAb-eIawPtC5Og3JJtMbEPozMMIsQbzzTkpZPcTAURowGnT1ihVAtAPL_lXehKSq4WyL1KC1F9KhA_nXirCUXXqJUZjO0tXCuk1tXnRK8S2hKaDPTuqZQSbXl81XWEnz-O1zhB2gz4GQiMtqkkDul_7qJJnla5fPvQNtFRnHh0DHB2mQw8gHIpke51RfMwfLVZb6uhlCXczgR6MDmf7bereyrXm4pD56hRvslv8HmoXEixJd9EhePN1clVLqUD_TX6y9CaeZl3Zetg";

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap justify-between gap-3 pb-2">
          <div className="flex min-w-72 flex-col gap-2">
            <p className="text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">My Profile</p>
            <p className="text-base text-gray-600 dark:text-gray-400">Manage your personal information and track your activity.</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between gap-3 pb-2">
        <div className="flex min-w-72 flex-col gap-2">
          <p className="text-4xl font-black tracking-[-0.033em] text-gray-900 dark:text-white">My Profile</p>
          <p className="text-base text-gray-600 dark:text-gray-400">Manage your personal information and track your activity.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-600 dark:text-green-400">Profile updated successfully!</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800 pb-8">
            <div className="relative">
              <Image className="rounded-full" alt="User avatar" src={avatarUrl} width={96} height={96} />
              <button 
                className="absolute bottom-0 right-0 flex items-center justify-center size-8 bg-gray-100 dark:bg-gray-700 rounded-full border-2 border-white dark:border-gray-900 hover:bg-gray-200 dark:hover:bg-gray-600" 
                aria-label="Edit avatar"
                disabled
                title="Avatar editing coming soon"
              >
                <Pencil className="size-4 text-gray-900 dark:text-white" />
              </button>
            </div>
            <div className="flex flex-col">
              <p className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-gray-900 dark:text-white">{displayName}</p>
              <p className="text-base text-gray-600 dark:text-gray-400">{dunName} Resident</p>
            </div>
          </div>

          <h2 className="text-[22px] font-bold tracking-[-0.015em] text-gray-900 dark:text-white px-4">Personal Information</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (errors.fullName) setErrors({ ...errors, fullName: "" });
                  }}
                  className="h-14"
                  required
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                />
                {errors.fullName && (
                  <p id="fullName-error" className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.fullName}</p>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  className="h-14"
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2">Contact Number</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: "" });
                  }}
                  placeholder="e.g., +60 12-345 6789"
                  className="h-14"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.phone}</p>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pb-2">Address (Optional)</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g., 123 Jalan Inanam"
                  className="h-14"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 px-4 mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

