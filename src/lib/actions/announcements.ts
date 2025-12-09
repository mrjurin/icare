"use server";

import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/utils/access-control";
import { revalidatePath } from "next/cache";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type Announcement = {
  id: number;
  title: string;
  content: string;
  category: string;
  published_at: string;
  expires_at: string | null;
  created_at: string;
};

export type CreateAnnouncementInput = {
  title: string;
  content: string;
  category?: string;
  publishedAt?: string; // ISO date string
  expiresAt?: string | null; // ISO date string or null
};

export type UpdateAnnouncementInput = {
  id: number;
  title?: string;
  content?: string;
  category?: string;
  publishedAt?: string;
  expiresAt?: string | null;
};

export type PaginatedAnnouncements = {
  data: Announcement[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * Get list of announcements with pagination
 */
export async function getAnnouncementsList(options?: {
  page?: number;
  limit?: number;
  category?: string;
}): Promise<ActionResult<PaginatedAnnouncements>> {
  const supabase = await getSupabaseReadOnlyClient();
  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("announcements")
    .select("*", { count: "exact" })
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return { success: false, error: error.message };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data: {
      data: (data || []) as Announcement[],
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Get a single announcement by ID
 */
export async function getAnnouncement(id: number): Promise<ActionResult<Announcement>> {
  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Announcement };
}

/**
 * Create a new announcement
 * Only super admin and ADUN can create announcements
 */
export async function createAnnouncement(
  input: CreateAnnouncementInput
): Promise<ActionResult<Announcement>> {
  if (!input.title?.trim()) {
    return { success: false, error: "Title is required" };
  }

  if (!input.content?.trim()) {
    return { success: false, error: "Content is required" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can create announcements",
    };
  }

  const supabase = await getSupabaseServerClient();

  // Parse dates
  const publishedAt = input.publishedAt ? new Date(input.publishedAt).toISOString() : new Date().toISOString();
  const expiresAt = input.expiresAt ? new Date(input.expiresAt).toISOString() : null;

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category || "general",
      published_at: publishedAt,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/announcements");
  return { success: true, data: data as Announcement };
}

/**
 * Update an existing announcement
 * Only super admin and ADUN can update announcements
 */
export async function updateAnnouncement(
  input: UpdateAnnouncementInput
): Promise<ActionResult<Announcement>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid announcement ID" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can update announcements",
    };
  }

  const supabase = await getSupabaseServerClient();

  const updates: Record<string, unknown> = {};

  if (input.title !== undefined) {
    if (!input.title.trim()) {
      return { success: false, error: "Title cannot be empty" };
    }
    updates.title = input.title.trim();
  }

  if (input.content !== undefined) {
    if (!input.content.trim()) {
      return { success: false, error: "Content cannot be empty" };
    }
    updates.content = input.content.trim();
  }

  if (input.category !== undefined) {
    updates.category = input.category;
  }

  if (input.publishedAt !== undefined) {
    updates.published_at = new Date(input.publishedAt).toISOString();
  }

  if (input.expiresAt !== undefined) {
    updates.expires_at = input.expiresAt ? new Date(input.expiresAt).toISOString() : null;
  }

  const { data, error } = await supabase
    .from("announcements")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/announcements");
  return { success: true, data: data as Announcement };
}

/**
 * Delete an announcement
 * Only super admin and ADUN can delete announcements
 */
export async function deleteAnnouncement(id: number): Promise<ActionResult> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid announcement ID" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can delete announcements",
    };
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/announcements");
  return { success: true };
}
