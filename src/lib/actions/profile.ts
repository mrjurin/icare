"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProfileData = {
  id: number;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
};

export type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile(): Promise<ProfileData | null> {
  const supabase = await getSupabaseServerClient();
  
  // Get current user from Supabase auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return null;
  }

  // Try to find profile by email first (if profiles table has email)
  // Otherwise, we'll need to link profiles to auth.users via a user_id field
  // For now, let's check if there's a way to get profile ID from auth metadata
  // or we can use email to match
  
  // Get profile - we'll need to match by email or have a user_id field
  // Since the schema doesn't have user_id, let's use email for now
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, address, avatar_url")
    .eq("email", user.email)
    .single();

  if (error || !profile) {
    // Profile doesn't exist yet, return null
    return null;
  }

  return {
    id: profile.id,
    fullName: profile.full_name || null,
    email: profile.email || user.email || null,
    phone: profile.phone || null,
    address: profile.address || null,
    avatarUrl: profile.avatar_url || null,
  };
}

/**
 * Create or update user profile
 */
export async function updateProfile(
  data: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    avatarUrl?: string;
  }
): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate email format if provided
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { success: false, error: "Invalid email format" };
  }

  // Validate phone format if provided (basic validation)
  if (data.phone && data.phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(data.phone)) {
    return { success: false, error: "Invalid phone number format" };
  }

  // Validate full name if provided
  if (data.fullName !== undefined && data.fullName.trim().length < 2) {
    return { success: false, error: "Full name must be at least 2 characters" };
  }

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email || data.email)
    .single();

  const profileData: {
    full_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar_url?: string;
    updated_at?: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (data.fullName !== undefined) {
    const trimmed = data.fullName.trim();
    profileData.full_name = trimmed || undefined;
  }
  if (data.email !== undefined) {
    const trimmed = data.email.trim();
    profileData.email = trimmed || undefined;
  }
  if (data.phone !== undefined) {
    const trimmed = data.phone.trim();
    profileData.phone = trimmed || undefined;
  }
  if (data.address !== undefined) {
    const trimmed = data.address.trim();
    profileData.address = trimmed || undefined;
  }
  if (data.avatarUrl !== undefined) {
    const trimmed = data.avatarUrl.trim();
    profileData.avatar_url = trimmed || undefined;
  }

  if (existingProfile) {
    // Update existing profile
    const { error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", existingProfile.id);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    // Create new profile
    const insertData: {
      full_name?: string;
      email?: string;
      phone?: string;
      address?: string;
      avatar_url?: string;
      updated_at?: string;
    } = {
      ...profileData,
    };
    
    if (!insertData.email && user.email) {
      insertData.email = user.email;
    }
    if (!insertData.full_name && user.user_metadata?.full_name) {
      insertData.full_name = user.user_metadata.full_name;
    }
    
    const { error } = await supabase.from("profiles").insert(insertData);

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/community/profile");
  return { success: true };
}
