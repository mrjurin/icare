"use server";

import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/utils/access-control";
import { revalidatePath } from "next/cache";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type IssueType = {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CreateIssueTypeInput = {
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
};

export type UpdateIssueTypeInput = {
  id: number;
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
};

/**
 * Get all active issue types (public - for community users)
 */
export async function getActiveIssueTypes(): Promise<ActionResult<IssueType[]>> {
  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("issue_types")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as IssueType[] };
}

/**
 * Get all issue types (admin - includes inactive)
 */
export async function getAllIssueTypes(): Promise<ActionResult<IssueType[]>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can view issue types",
    };
  }

  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("issue_types")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as IssueType[] };
}

/**
 * Get a single issue type by ID
 */
export async function getIssueType(id: number): Promise<ActionResult<IssueType>> {
  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("issue_types")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as IssueType };
}

/**
 * Create a new issue type
 */
export async function createIssueType(
  input: CreateIssueTypeInput
): Promise<ActionResult<IssueType>> {
  if (!input.name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can manage issue types",
    };
  }

  const supabase = await getSupabaseServerClient();

  // Check for duplicate name
  const { data: existingByName } = await supabase
    .from("issue_types")
    .select("id")
    .eq("name", input.name.trim())
    .single();

  if (existingByName) {
    return { success: false, error: "An issue type with this name already exists" };
  }

  // Check for duplicate code if provided
  if (input.code?.trim()) {
    const { data: existingByCode } = await supabase
      .from("issue_types")
      .select("id")
      .eq("code", input.code.trim())
      .single();

    if (existingByCode) {
      return { success: false, error: "An issue type with this code already exists" };
    }
  }

  const insertData: Record<string, unknown> = {
    name: input.name.trim(),
    code: input.code?.trim() || null,
    description: input.description?.trim() || null,
    is_active: input.isActive ?? true,
    display_order: input.displayOrder ?? 0,
  };

  const { data, error } = await supabase
    .from("issue_types")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/issue-types");
  return { success: true, data: data as IssueType };
}

/**
 * Update an issue type
 */
export async function updateIssueType(
  input: UpdateIssueTypeInput
): Promise<ActionResult<IssueType>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid ID" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can manage issue types",
    };
  }

  const supabase = await getSupabaseServerClient();

  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      return { success: false, error: "Name cannot be empty" };
    }

    // Check for duplicate name (excluding current record)
    const { data: existingByName } = await supabase
      .from("issue_types")
      .select("id")
      .eq("name", input.name.trim())
      .neq("id", input.id)
      .single();

    if (existingByName) {
      return { success: false, error: "An issue type with this name already exists" };
    }

    updates.name = input.name.trim();
  }

  if (input.code !== undefined) {
    if (input.code?.trim()) {
      // Check for duplicate code (excluding current record)
      const { data: existingByCode } = await supabase
        .from("issue_types")
        .select("id")
        .eq("code", input.code.trim())
        .neq("id", input.id)
        .single();

      if (existingByCode) {
        return { success: false, error: "An issue type with this code already exists" };
      }
    }
    updates.code = input.code?.trim() || null;
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }

  if (input.isActive !== undefined) {
    updates.is_active = input.isActive;
  }

  if (input.displayOrder !== undefined) {
    updates.display_order = input.displayOrder;
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("issue_types")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/issue-types");
  return { success: true, data: data as IssueType };
}

/**
 * Delete an issue type
 */
export async function deleteIssueType(id: number): Promise<ActionResult> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid ID" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can manage issue types",
    };
  }

  const supabase = await getSupabaseServerClient();

  // Check if any issues are using this type
  const { data: issuesUsingType, error: checkError } = await supabase
    .from("issues")
    .select("id")
    .eq("issue_type_id", id)
    .limit(1);

  if (checkError) {
    return { success: false, error: checkError.message };
  }

  if (issuesUsingType && issuesUsingType.length > 0) {
    return {
      success: false,
      error: "Cannot delete issue type: There are issues using this type. Please deactivate it instead.",
    };
  }

  const { error } = await supabase.from("issue_types").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/issue-types");
  return { success: true };
}
