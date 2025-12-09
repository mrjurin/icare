"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizeIcNumber } from "@/lib/utils/ic-number";

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  icNumber: string;
  villageId: number;
  zoneId: number;
};

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: {
    linkedToHousehold?: boolean;
    householdMemberId?: number;
  };
};

/**
 * Register a new community user
 * Creates Supabase auth user and profile automatically
 * Auto-links to household member if IC number matches
 */
export async function registerCommunityUser(
  input: RegisterInput
): Promise<ActionResult> {
  // Validation
  if (!input.fullName?.trim()) {
    return { success: false, error: "Full name is required" };
  }
  if (!input.email?.trim()) {
    return { success: false, error: "Email is required" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email.trim())) {
    return { success: false, error: "Invalid email format" };
  }
  if (!input.password) {
    return { success: false, error: "Password is required" };
  }
  if (input.password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }
  if (!input.icNumber?.trim()) {
    return { success: false, error: "IC number is required" };
  }
  if (!input.villageId || Number.isNaN(input.villageId)) {
    return { success: false, error: "Village is required" };
  }
  if (!input.zoneId || Number.isNaN(input.zoneId)) {
    return { success: false, error: "Zone is required" };
  }

  const supabase = await getSupabaseServerClient();

  // Check if user already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", input.email.toLowerCase().trim())
    .maybeSingle();

  if (existingProfile) {
    return { success: false, error: "An account with this email already exists" };
  }

  // Normalize IC number for matching
  const normalizedIc = normalizeIcNumber(input.icNumber.trim());

  // Check if IC number already exists in profiles
  const { data: existingIcProfile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("ic_number", normalizedIc)
    .maybeSingle();

  if (existingIcProfile) {
    return { success: false, error: "An account with this IC number already exists" };
  }

  // Try to find matching household member by IC number
  let householdMemberId: number | null = null;
  const { data: householdMember } = await supabase
    .from("household_members")
    .select("id, name, household_id")
    .eq("ic_number", normalizedIc)
    .maybeSingle();

  if (householdMember) {
    householdMemberId = householdMember.id;
  }

  // Create auth user with Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email.toLowerCase().trim(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        role: "community", // Set role in user metadata
      },
    },
  });

  if (authError) {
    // Provide user-friendly error messages
    if (authError.message.includes("already registered")) {
      return { success: false, error: "An account with this email already exists" };
    }
    if (authError.message.includes("password")) {
      return { success: false, error: "Password does not meet requirements" };
    }
    return { success: false, error: authError.message || "Failed to create account" };
  }

  if (!authData.user) {
    return { success: false, error: "Failed to create account" };
  }

  // Create profile in profiles table with all required fields
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .insert({
      full_name: input.fullName.trim(),
      email: input.email.toLowerCase().trim(),
      ic_number: normalizedIc,
      village_id: input.villageId,
      zone_id: input.zoneId,
      household_member_id: householdMemberId,
      verification_status: "pending", // Default to pending, zone leader will verify
    })
    .select()
    .single();

  if (profileError) {
    console.error("Failed to create profile:", profileError);
    // If profile creation fails, we should ideally clean up the auth user
    // But for now, we'll just return an error
    return { success: false, error: profileError.message || "Failed to create profile" };
  }

  revalidatePath("/community");
  return { 
    success: true,
    data: {
      linkedToHousehold: !!householdMemberId,
      householdMemberId: householdMemberId || undefined,
    }
  };
}
