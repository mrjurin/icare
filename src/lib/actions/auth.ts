"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

export type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Register a new community user
 * Creates Supabase auth user and profile automatically
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

  const supabase = await getSupabaseServerClient();

  // Check if user already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", input.email.toLowerCase().trim())
    .single();

  if (existingProfile) {
    return { success: false, error: "An account with this email already exists" };
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

  // Create profile in profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      full_name: input.fullName.trim(),
      email: input.email.toLowerCase().trim(),
    });

  if (profileError) {
    // If profile creation fails but auth succeeded, we still return success
    // The profile can be created later when user logs in
    console.error("Failed to create profile:", profileError);
    // Don't fail the registration, profile can be created on first login
  }

  revalidatePath("/community");
  return { success: true };
}
