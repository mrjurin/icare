"use server";

import { getSupabaseReadOnlyClient, getSupabaseServerClient, getAuthenticatedUserReadOnly } from "@/lib/supabase/server";
import { getCurrentUserAccessReadOnly } from "@/lib/utils/access-control";
import { revalidatePath } from "next/cache";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type Notification = {
  id: number;
  profile_id: number;
  title: string;
  body: string;
  category: string;
  read: boolean;
  created_at: string;
};

/**
 * Get notifications for the current admin user
 * For admin, show all notifications in the system
 */
export async function getNotifications(options?: {
  limit?: number;
  category?: string;
  read?: boolean;
}): Promise<ActionResult<Notification[]>> {
  const access = await getCurrentUserAccessReadOnly();
  
  if (!access.isAuthenticated || !access.staffId) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await getSupabaseReadOnlyClient();
  const limit = options?.limit || 100;

  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.read !== undefined) {
    query = query.eq("read", options.read);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: (data || []) as Notification[],
  };
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: number): Promise<ActionResult> {
  const access = await getCurrentUserAccessReadOnly();
  
  if (!access.isAuthenticated || !access.staffId) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/notifications");
  return { success: true };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<ActionResult> {
  const access = await getCurrentUserAccessReadOnly();
  
  if (!access.isAuthenticated || !access.staffId) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/notifications");
  return { success: true };
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: number): Promise<ActionResult> {
  const access = await getCurrentUserAccessReadOnly();
  
  if (!access.isAuthenticated || !access.staffId) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/notifications");
  return { success: true };
}

/**
 * Get count of unread notifications
 */
export async function getUnreadNotificationCount(): Promise<ActionResult<number>> {
  const access = await getCurrentUserAccessReadOnly();
  
  if (!access.isAuthenticated || !access.staffId) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await getSupabaseReadOnlyClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("read", false);

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: count || 0,
  };
}

/**
 * Get notifications for a community user (filtered by profile_id)
 */
export async function getNotificationsForProfile(options?: {
  limit?: number;
  category?: string;
  read?: boolean;
}): Promise<ActionResult<Notification[]>> {
  const supabase = await getSupabaseReadOnlyClient();
  const user = await getAuthenticatedUserReadOnly();
  
  if (!user || !user.email) {
    return { success: false, error: "Unauthorized" };
  }

  // Get user's profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email.toLowerCase().trim())
    .maybeSingle();

  if (profileError || !profile) {
    return { success: false, error: "Profile not found" };
  }

  const limit = options?.limit || 100;

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.read !== undefined) {
    query = query.eq("read", options.read);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: (data || []) as Notification[],
  };
}

/**
 * Mark notification as read (for community users)
 */
export async function markNotificationAsReadForProfile(id: number): Promise<ActionResult> {
  const supabase = await getSupabaseReadOnlyClient();
  const user = await getAuthenticatedUserReadOnly();
  
  if (!user || !user.email) {
    return { success: false, error: "Unauthorized" };
  }

  // Get user's profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email.toLowerCase().trim())
    .maybeSingle();

  if (profileError || !profile) {
    return { success: false, error: "Profile not found" };
  }

  // Verify the notification belongs to this user
  const { data: notification, error: notifError } = await supabase
    .from("notifications")
    .select("profile_id")
    .eq("id", id)
    .single();

  if (notifError || !notification || notification.profile_id !== profile.id) {
    return { success: false, error: "Notification not found or unauthorized" };
  }

  const supabaseServer = await getSupabaseServerClient();
  const { error } = await supabaseServer
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("profile_id", profile.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/community/notifications");
  return { success: true };
}

/**
 * Mark all notifications as read (for community users)
 */
export async function markAllNotificationsAsReadForProfile(): Promise<ActionResult> {
  const supabase = await getSupabaseReadOnlyClient();
  const user = await getAuthenticatedUserReadOnly();
  
  if (!user || !user.email) {
    return { success: false, error: "Unauthorized" };
  }

  // Get user's profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email.toLowerCase().trim())
    .maybeSingle();

  if (profileError || !profile) {
    return { success: false, error: "Profile not found" };
  }

  const supabaseServer = await getSupabaseServerClient();
  const { error } = await supabaseServer
    .from("notifications")
    .update({ read: true })
    .eq("profile_id", profile.id)
    .eq("read", false);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/community/notifications");
  return { success: true };
}

/**
 * Delete a notification (for community users)
 */
export async function deleteNotificationForProfile(id: number): Promise<ActionResult> {
  const supabase = await getSupabaseReadOnlyClient();
  const user = await getAuthenticatedUserReadOnly();
  
  if (!user || !user.email) {
    return { success: false, error: "Unauthorized" };
  }

  // Get user's profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email.toLowerCase().trim())
    .maybeSingle();

  if (profileError || !profile) {
    return { success: false, error: "Profile not found" };
  }

  // Verify the notification belongs to this user
  const { data: notification, error: notifError } = await supabase
    .from("notifications")
    .select("profile_id")
    .eq("id", id)
    .single();

  if (notifError || !notification || notification.profile_id !== profile.id) {
    return { success: false, error: "Notification not found or unauthorized" };
  }

  const supabaseServer = await getSupabaseServerClient();
  const { error } = await supabaseServer
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("profile_id", profile.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/community/notifications");
  return { success: true };
}

/**
 * Get count of unread notifications (for community users)
 */
export async function getUnreadNotificationCountForProfile(): Promise<ActionResult<number>> {
  const supabase = await getSupabaseReadOnlyClient();
  const user = await getAuthenticatedUserReadOnly();
  
  if (!user || !user.email) {
    return { success: false, error: "Unauthorized" };
  }

  // Get user's profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email.toLowerCase().trim())
    .maybeSingle();

  if (profileError || !profile) {
    return { success: false, error: "Profile not found" };
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profile.id)
    .eq("read", false);

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: count || 0,
  };
}
