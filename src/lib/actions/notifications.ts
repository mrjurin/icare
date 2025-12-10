"use server";

import { getSupabaseReadOnlyClient, getSupabaseServerClient } from "@/lib/supabase/server";
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
