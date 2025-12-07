"use server";

import { randomUUID } from "crypto";
import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/utils/accessControl";
import { revalidatePath } from "next/cache";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type AppSetting = {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
};

/**
 * Get a setting value by key
 */
export async function getSetting(key: string): Promise<ActionResult<string | null>> {
  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error) {
    // If setting doesn't exist, return null (not an error)
    if (error.code === "PGRST116") {
      return { success: true, data: null };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: data?.value || null };
}

/**
 * Get all settings (admin only)
 */
export async function getAllSettings(): Promise<ActionResult<AppSetting[]>> {
  const access = await getCurrentUserAccess();
  
  // Only super admin and ADUN can view all settings
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can view settings" };
  }

  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as AppSetting[] };
}

/**
 * Update a setting value
 */
export async function updateSetting(
  key: string,
  value: string,
  description?: string
): Promise<ActionResult<AppSetting>> {
  const access = await getCurrentUserAccess();
  
  // Only super admin and ADUN can update settings
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can update settings" };
  }

  if (!access.staffId) {
    return { success: false, error: "Staff ID not found" };
  }

  const supabase = await getSupabaseServerClient();

  // Check if setting exists
  const { data: existing } = await supabase
    .from("app_settings")
    .select("id")
    .eq("key", key)
    .single();

  let result;
  if (existing) {
    // Update existing setting
    const updateData: { value: string; updated_by: number; updated_at: string; description?: string } = {
      value,
      updated_by: access.staffId,
      updated_at: new Date().toISOString(),
    };
    
    if (description !== undefined) {
      updateData.description = description;
    }

    const { data, error } = await supabase
      .from("app_settings")
      .update(updateData)
      .eq("key", key)
      .select("*")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    result = data;
  } else {
    // Create new setting
    const insertData: { key: string; value: string; updated_by: number; description?: string } = {
      key,
      value,
      updated_by: access.staffId,
    };
    
    if (description !== undefined) {
      insertData.description = description;
    }

    const { data, error } = await supabase
      .from("app_settings")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    result = data;
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  
  // Revalidate login pages if login image is updated
  if (key === "staff_login_image_url") {
    revalidatePath("/staff/login");
  } else if (key === "admin_login_image_url") {
    revalidatePath("/admin/login");
  } else if (key === "community_login_image_url") {
    revalidatePath("/community/login");
  }
  
  return { success: true, data: result as AppSetting };
}

/**
 * Upload an image file to Supabase storage
 * Accepts FormData with a 'file' field
 */
export async function uploadImage(
  formData: FormData,
  folder: string = "settings"
): Promise<ActionResult<string>> {
  const access = await getCurrentUserAccess();
  
  // Only super admin and ADUN can upload images
  if (!access.isSuperAdmin && !access.isAdun) {
    return { success: false, error: "Access denied: Only super admin and ADUN can upload images" };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "File must be an image" };
  }

  // Validate file size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return { success: false, error: "Image size must be less than 5MB" };
  }

  const supabase = await getSupabaseServerClient();

  try {
    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${randomUUID()}.${fileExt}`;
    
    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });
    
    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from("adun_inanam")
      .upload(fileName, blob, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data } = supabase.storage.from("adun_inanam").getPublicUrl(fileName);
    
    return { success: true, data: data.publicUrl };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to upload image" 
    };
  }
}
