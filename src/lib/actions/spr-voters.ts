"use server";

import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/utils/access-control";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type SprVoterVersion = {
  id: number;
  name: string;
  description: string | null;
  election_date: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
};

export type SprVoter = {
  id: number;
  version_id: number;
  no_siri: number | null;
  no_kp: string | null;
  no_kp_lama: string | null;
  nama: string;
  no_hp: string | null;
  jantina: string | null;
  tarikh_lahir: string | null;
  bangsa: string | null;
  agama: string | null;
  kategori_kaum: string | null;
  no_rumah: string | null;
  alamat: string | null;
  poskod: string | null;
  daerah: string | null;
  kod_lokaliti: string | null;
  nama_parlimen: string | null;
  nama_dun: string | null;
  nama_pdm: string | null;
  nama_lokaliti: string | null;
  kategori_undi: string | null;
  nama_tm: string | null;
  masa_undi: string | null;
  saluran: number | null;
  household_member_id: number | null;
  voting_support_status: "white" | "black" | "red" | null;
  created_at: string;
  updated_at: string;
};

export type CreateVersionInput = {
  name: string;
  description?: string;
  electionDate?: string;
  isActive?: boolean;
};

export type UpdateVersionInput = {
  id: number;
  name?: string;
  description?: string;
  electionDate?: string;
  isActive?: boolean;
};

export type CreateVoterInput = {
  versionId: number;
  noSiri?: number;
  noKp?: string;
  noKpLama?: string;
  nama: string;
  noHp?: string;
  jantina?: string;
  tarikhLahir?: string;
  bangsa?: string;
  agama?: string;
  kategoriKaum?: string;
  noRumah?: string;
  alamat?: string;
  poskod?: string;
  daerah?: string;
  kodLokaliti?: string;
  namaParlimen?: string;
  namaDun?: string;
  namaPdm?: string;
  namaLokaliti?: string;
  kategoriUndi?: string;
  namaTm?: string;
  masaUndi?: string;
  saluran?: number;
  householdMemberId?: number;
  votingSupportStatus?: "white" | "black" | "red" | null;
};

export type UpdateVoterInput = {
  id: number;
  noSiri?: number;
  noKp?: string;
  noKpLama?: string;
  nama?: string;
  noHp?: string;
  jantina?: string;
  tarikhLahir?: string;
  bangsa?: string;
  agama?: string;
  kategoriKaum?: string;
  noRumah?: string;
  alamat?: string;
  poskod?: string;
  daerah?: string;
  kodLokaliti?: string;
  namaParlimen?: string;
  namaDun?: string;
  namaPdm?: string;
  namaLokaliti?: string;
  kategoriUndi?: string;
  namaTm?: string;
  masaUndi?: string;
  saluran?: number;
  householdMemberId?: number;
  votingSupportStatus?: "white" | "black" | "red" | null;
};

export type PaginatedVoters = {
  data: SprVoter[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * Get all voter versions
 */
export async function getVoterVersions(): Promise<ActionResult<SprVoterVersion[]>> {
  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("spr_voter_versions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as SprVoterVersion[] };
}

/**
 * Get a single voter version by ID
 */
export async function getVoterVersion(id: number): Promise<ActionResult<SprVoterVersion>> {
  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("spr_voter_versions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as SprVoterVersion };
}

/**
 * Helper function to ensure only one version is active at a time
 * Deactivates all versions except the one with the specified ID (if provided)
 * or the most recently updated active version
 */
async function ensureOnlyOneActiveVersion(
  supabase: SupabaseClient<any, "public", "public", any, any>,
  keepActiveId?: number
): Promise<{ success: boolean; error?: string }> {
  // Get all active versions
  const { data: activeVersions, error: fetchError } = await supabase
    .from("spr_voter_versions")
    .select("id, updated_at")
    .eq("is_active", true);

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!activeVersions || activeVersions.length <= 1) {
    // Already compliant or no active versions
    return { success: true };
  }

  // If we have a specific version to keep active, deactivate all others
  if (keepActiveId !== undefined) {
    const { error: deactivateError } = await supabase
      .from("spr_voter_versions")
      .update({ is_active: false })
      .neq("id", keepActiveId)
      .eq("is_active", true);

    if (deactivateError) {
      return { success: false, error: deactivateError.message };
    }
    return { success: true };
  }

  // Otherwise, keep the most recently updated one active
  const sortedVersions = activeVersions.sort(
    (a: { id: number; updated_at: string }, b: { id: number; updated_at: string }) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  const keepId = sortedVersions[0].id;

  const { error: deactivateError } = await supabase
    .from("spr_voter_versions")
    .update({ is_active: false })
    .neq("id", keepId)
    .eq("is_active", true);

  if (deactivateError) {
    return { success: false, error: deactivateError.message };
  }

  return { success: true };
}

/**
 * Create a new voter version
 * Only super admin and ADUN can create versions
 */
export async function createVoterVersion(
  input: CreateVersionInput
): Promise<ActionResult<SprVoterVersion>> {
  if (!input.name?.trim()) {
    return { success: false, error: "Version name is required" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can create voter versions",
    };
  }

  const supabase = await getSupabaseServerClient();

  // If setting as active, ensure only this version is active
  // This ensures only one version is active at a time
  if (input.isActive) {
    const { error: deactivateError } = await supabase
      .from("spr_voter_versions")
      .update({ is_active: false })
      .eq("is_active", true);
    
    if (deactivateError) {
      return { success: false, error: `Failed to deactivate other versions: ${deactivateError.message}` };
    }
  } else {
    // Even when creating as inactive, ensure data integrity
    await ensureOnlyOneActiveVersion(supabase);
  }

  const { data, error } = await supabase
    .from("spr_voter_versions")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      election_date: input.electionDate ? new Date(input.electionDate).toISOString() : null,
      is_active: input.isActive ?? false,
      created_by: access.staffId || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/spr-voters");
  return { success: true, data: data as SprVoterVersion };
}

/**
 * Update a voter version
 */
export async function updateVoterVersion(
  input: UpdateVersionInput
): Promise<ActionResult<SprVoterVersion>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid version ID" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can update voter versions",
    };
  }

  const supabase = await getSupabaseServerClient();

  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      return { success: false, error: "Version name cannot be empty" };
    }
    updates.name = input.name.trim();
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }

  if (input.electionDate !== undefined) {
    updates.election_date = input.electionDate ? new Date(input.electionDate).toISOString() : null;
  }

  if (input.isActive !== undefined) {
    updates.is_active = input.isActive;
    // If setting as active, deactivate all other versions first
    // This ensures only one version is active at a time
    if (input.isActive) {
      const { error: deactivateError } = await supabase
        .from("spr_voter_versions")
        .update({ is_active: false })
        .neq("id", input.id)
        .eq("is_active", true);
      
      if (deactivateError) {
        return { success: false, error: `Failed to deactivate other versions: ${deactivateError.message}` };
      }
    } else {
      // Even when deactivating, ensure data integrity (in case multiple were active)
      await ensureOnlyOneActiveVersion(supabase);
    }
  }

  const { data, error } = await supabase
    .from("spr_voter_versions")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/spr-voters");
  return { success: true, data: data as SprVoterVersion };
}

/**
 * Delete a voter version (and all its voters)
 */
export async function deleteVoterVersion(id: number): Promise<ActionResult> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid version ID" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can delete voter versions",
    };
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.from("spr_voter_versions").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/spr-voters");
  return { success: true };
}

/**
 * Get list of voters with pagination
 */
export async function getVotersList(options?: {
  page?: number;
  limit?: number;
  versionId?: number;
  search?: string;
  unmatchedOnly?: boolean;
}): Promise<ActionResult<PaginatedVoters>> {
  const supabase = await getSupabaseReadOnlyClient();
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("spr_voters")
    .select("*", { count: "exact" })
    .order("nama", { ascending: true });

  if (options?.versionId) {
    query = query.eq("version_id", options.versionId);
  }

  if (options?.unmatchedOnly) {
    query = query.is("household_member_id", null);
  }

  if (options?.search) {
    query = query.or(
      `nama.ilike.%${options.search}%,no_kp.ilike.%${options.search}%,alamat.ilike.%${options.search}%`
    );
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
      data: (data || []) as SprVoter[],
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Get a single voter by ID
 */
export async function getVoter(id: number): Promise<ActionResult<SprVoter>> {
  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from("spr_voters")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as SprVoter };
}

/**
 * Create a new voter
 */
export async function createVoter(input: CreateVoterInput): Promise<ActionResult<SprVoter>> {
  if (!input.nama?.trim()) {
    return { success: false, error: "Name is required" };
  }

  if (!input.versionId || Number.isNaN(input.versionId)) {
    return { success: false, error: "Version ID is required" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can create voters",
    };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("spr_voters")
    .insert({
      version_id: input.versionId,
      no_siri: input.noSiri || null,
      no_kp: input.noKp || null,
      no_kp_lama: input.noKpLama || null,
      nama: input.nama.trim(),
      no_hp: input.noHp || null,
      jantina: input.jantina || null,
      tarikh_lahir: input.tarikhLahir ? new Date(input.tarikhLahir).toISOString() : null,
      bangsa: input.bangsa || null,
      agama: input.agama || null,
      kategori_kaum: input.kategoriKaum || null,
      no_rumah: input.noRumah || null,
      alamat: input.alamat || null,
      poskod: input.poskod || null,
      daerah: input.daerah || null,
      kod_lokaliti: input.kodLokaliti || null,
      nama_parlimen: input.namaParlimen || null,
      nama_dun: input.namaDun || null,
      nama_pdm: input.namaPdm || null,
      nama_lokaliti: input.namaLokaliti || null,
      kategori_undi: input.kategoriUndi || null,
      nama_tm: input.namaTm || null,
      masa_undi: input.masaUndi || null,
      saluran: input.saluran || null,
      household_member_id: input.householdMemberId || null,
      voting_support_status: input.votingSupportStatus || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/spr-voters");
  return { success: true, data: data as SprVoter };
}

/**
 * Update a voter
 */
export async function updateVoter(input: UpdateVoterInput): Promise<ActionResult<SprVoter>> {
  if (!input.id || Number.isNaN(input.id)) {
    return { success: false, error: "Invalid voter ID" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can update voters",
    };
  }

  const supabase = await getSupabaseServerClient();

  const updates: Record<string, unknown> = {};

  if (input.nama !== undefined) {
    if (!input.nama.trim()) {
      return { success: false, error: "Name cannot be empty" };
    }
    updates.nama = input.nama.trim();
  }

  if (input.noSiri !== undefined) updates.no_siri = input.noSiri;
  if (input.noKp !== undefined) updates.no_kp = input.noKp || null;
  if (input.noKpLama !== undefined) updates.no_kp_lama = input.noKpLama || null;
  if (input.noHp !== undefined) updates.no_hp = input.noHp || null;
  if (input.jantina !== undefined) updates.jantina = input.jantina || null;
  if (input.tarikhLahir !== undefined)
    updates.tarikh_lahir = input.tarikhLahir ? new Date(input.tarikhLahir).toISOString() : null;
  if (input.bangsa !== undefined) updates.bangsa = input.bangsa || null;
  if (input.agama !== undefined) updates.agama = input.agama || null;
  if (input.kategoriKaum !== undefined) updates.kategori_kaum = input.kategoriKaum || null;
  if (input.noRumah !== undefined) updates.no_rumah = input.noRumah || null;
  if (input.alamat !== undefined) updates.alamat = input.alamat || null;
  if (input.poskod !== undefined) updates.poskod = input.poskod || null;
  if (input.daerah !== undefined) updates.daerah = input.daerah || null;
  if (input.kodLokaliti !== undefined) updates.kod_lokaliti = input.kodLokaliti || null;
  if (input.namaParlimen !== undefined) updates.nama_parlimen = input.namaParlimen || null;
  if (input.namaDun !== undefined) updates.nama_dun = input.namaDun || null;
  if (input.namaPdm !== undefined) updates.nama_pdm = input.namaPdm || null;
  if (input.namaLokaliti !== undefined) updates.nama_lokaliti = input.namaLokaliti || null;
  if (input.kategoriUndi !== undefined) updates.kategori_undi = input.kategoriUndi || null;
  if (input.namaTm !== undefined) updates.nama_tm = input.namaTm || null;
  if (input.masaUndi !== undefined) updates.masa_undi = input.masaUndi || null;
  if (input.saluran !== undefined) updates.saluran = input.saluran || null;
  if (input.householdMemberId !== undefined)
    updates.household_member_id = input.householdMemberId || null;
  if (input.votingSupportStatus !== undefined)
    updates.voting_support_status = input.votingSupportStatus || null;

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("spr_voters")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/spr-voters");
  return { success: true, data: data as SprVoter };
}

/**
 * Delete a voter
 */
export async function deleteVoter(id: number): Promise<ActionResult> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid voter ID" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can delete voters",
    };
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.from("spr_voters").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/spr-voters");
  return { success: true };
}

/**
 * Clear all imported voters for a specific version
 * This allows re-uploading data without deleting the version itself
 */
export async function clearVersionVoters(versionId: number): Promise<ActionResult<{ deleted: number }>> {
  if (!versionId || Number.isNaN(versionId)) {
    return { success: false, error: "Invalid version ID" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can clear version voters",
    };
  }

  // Verify version exists
  const versionResult = await getVoterVersion(versionId);
  if (!versionResult.success || !versionResult.data) {
    return { success: false, error: "Invalid version ID" };
  }

  const supabase = await getSupabaseServerClient();

  // Get count before deletion for return value
  const { count } = await supabase
    .from("spr_voters")
    .select("*", { count: "exact", head: true })
    .eq("version_id", versionId);

  // Delete all voters for this version
  const { error } = await supabase
    .from("spr_voters")
    .delete()
    .eq("version_id", versionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/spr-voters");
  return { success: true, data: { deleted: count || 0 } };
}

/**
 * Quick update voting support status for a voter
 */
export async function updateVoterVotingSupportStatus(
  id: number,
  votingSupportStatus: "white" | "black" | "red" | null
): Promise<ActionResult<SprVoter>> {
  if (!id || Number.isNaN(id)) {
    return { success: false, error: "Invalid voter ID" };
  }

  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can update voting support status",
    };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("spr_voters")
    .update({
      voting_support_status: votingSupportStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/spr-voters");
  return { success: true, data: data as SprVoter };
}

/**
 * Import voters from CSV
 */
/**
 * Import voters from CSV chunk (used for progress tracking)
 * This processes a subset of CSV lines with a known header map
 */
export async function importVotersFromCSVChunk(
  versionId: number,
  headerMap: Record<string, number>,
  csvLines: string[],
  startRowIndex: number,
  skipVersionCheck = false // Allow skipping version check for performance on subsequent chunks
): Promise<ActionResult<{ imported: number; errors: string[] }>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can import voters",
    };
  }

  if (!versionId || Number.isNaN(versionId)) {
    return { success: false, error: "Version ID is required" };
  }

  // Verify version exists (skip on subsequent chunks for performance)
  if (!skipVersionCheck) {
    const versionResult = await getVoterVersion(versionId);
    if (!versionResult.success || !versionResult.data) {
      return { success: false, error: "Invalid version ID" };
    }
  }

  const supabase = await getSupabaseServerClient();
  const errors: string[] = [];
  let imported = 0;

  const BATCH_SIZE = 1000;
  const batch: Array<{
    version_id: number;
    no_siri: number | null;
    no_kp: string | null;
    no_kp_lama: string | null;
    nama: string;
    no_hp: string | null;
    jantina: string | null;
    tarikh_lahir: string | null;
    bangsa: string | null;
    agama: string | null;
    kategori_kaum: string | null;
    no_rumah: string | null;
    alamat: string | null;
    poskod: string | null;
    daerah: string | null;
    kod_lokaliti: string | null;
    nama_parlimen: string | null;
    nama_dun: string | null;
    nama_pdm: string | null;
    nama_lokaliti: string | null;
    kategori_undi: string | null;
    nama_tm: string | null;
    masa_undi: string | null;
    saluran: number | null;
  }> = [];

  for (let i = 0; i < csvLines.length; i++) {
    const line = csvLines[i];
    if (!line.trim()) continue;

    const rowNumber = startRowIndex + i + 1;

    try {
      const values = parseCSVLine(line);
      const getValue = (colName: string): string | null => {
        const idx = headerMap[colName];
        return idx !== undefined && idx < values.length ? values[idx] || null : null;
      };

      const nama = getValue("Nama");
      if (!nama || !nama.trim()) {
        errors.push(`Row ${rowNumber}: Name is required`);
        continue;
      }

      const tarikhLahir = parseDateOfBirth(getValue("TarikhLahir"));
      const noSiriStr = getValue("NoSiri");
      const noSiri = noSiriStr ? parseInt(noSiriStr, 10) : null;
      const saluranStr = getValue("Saluran");
      const saluran = saluranStr ? parseInt(saluranStr, 10) : null;

      batch.push({
        version_id: versionId,
        no_siri: noSiri && !isNaN(noSiri) ? noSiri : null,
        no_kp: getValue("NoKp") || null,
        no_kp_lama: getValue("NoKpLama") || null,
        nama: nama.trim(),
        no_hp: getValue("NoHP") || null,
        jantina: getValue("Jantina") || null,
        tarikh_lahir: tarikhLahir,
        bangsa: getValue("Bangsa") || null,
        agama: getValue("agama") || null,
        kategori_kaum: getValue("Kategorikaum") || null,
        no_rumah: getValue("NoRumah") || null,
        alamat: getValue("alamat") || null,
        poskod: getValue("poskod") || null,
        daerah: getValue("daerah") || null,
        kod_lokaliti: getValue("KodLokaliti") || null,
        nama_parlimen: getValue("NamaParlimen") || null,
        nama_dun: getValue("NamaDun") || null,
        nama_pdm: getValue("NamaPDM") || null,
        nama_lokaliti: getValue("NamaLokaliti") || null,
        kategori_undi: getValue("KategoriUNDI") || null,
        nama_tm: getValue("NamaTM") || null,
        masa_undi: getValue("MasaUndi") || null,
        saluran: saluran && !isNaN(saluran) ? saluran : null,
      });

      if (batch.length >= BATCH_SIZE) {
        const { error: insertError } = await supabase.from("spr_voters").insert(batch);
        if (insertError) {
          for (let j = 0; j < batch.length; j++) {
            const { error: singleError } = await supabase.from("spr_voters").insert(batch[j]);
            if (singleError) {
              errors.push(`Row ${rowNumber - batch.length + j + 1}: ${singleError.message}`);
            } else {
              imported++;
            }
          }
        } else {
          imported += batch.length;
        }
        batch.length = 0;
      }
    } catch (err) {
      errors.push(`Row ${rowNumber}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  // Insert remaining rows
  if (batch.length > 0) {
    const { error: insertError } = await supabase.from("spr_voters").insert(batch);
    if (insertError) {
      const startRow = startRowIndex + csvLines.length - batch.length;
      for (let j = 0; j < batch.length; j++) {
        const { error: singleError } = await supabase.from("spr_voters").insert(batch[j]);
        if (singleError) {
          errors.push(`Row ${startRow + j + 1}: ${singleError.message}`);
        } else {
          imported++;
        }
      }
    } else {
      imported += batch.length;
    }
  }

  return {
    success: true,
    data: {
      imported,
      errors: errors.slice(0, 100),
    },
  };
}

/**
 * Helper function to parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

/**
 * Helper function to parse date of birth (handles Excel date numbers and date strings)
 */
function parseDateOfBirth(tarikhLahirStr: string | null): string | null {
  if (!tarikhLahirStr) return null;

  const dateNum = parseInt(tarikhLahirStr, 10);
  if (!isNaN(dateNum) && dateNum > 25569) {
    // Excel date (days since 1900-01-01)
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (dateNum - 2) * 24 * 60 * 60 * 1000);
    return date.toISOString();
  } else {
    // Try parsing as date string
    const parsed = new Date(tarikhLahirStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return null;
}

export async function importVotersFromCSV(
  versionId: number,
  csvContent: string
): Promise<ActionResult<{ imported: number; errors: string[] }>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can import voters",
    };
  }

  if (!versionId || Number.isNaN(versionId)) {
    return { success: false, error: "Version ID is required" };
  }

  // Verify version exists
  const versionResult = await getVoterVersion(versionId);
  if (!versionResult.success || !versionResult.data) {
    return { success: false, error: "Invalid version ID" };
  }

  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    return { success: false, error: "CSV file must have at least a header and one data row" };
  }

  // Parse header
  const header = lines[0].split(",").map((h) => h.trim());
  const headerMap: Record<string, number> = {};
  header.forEach((h, i) => {
    headerMap[h] = i;
  });

  // Required columns
  const requiredColumns = ["Nama"];
  for (const col of requiredColumns) {
    if (!(col in headerMap)) {
      return { success: false, error: `Missing required column: ${col}` };
    }
  }

  const supabase = await getSupabaseServerClient();
  const errors: string[] = [];
  let imported = 0;

  // Batch size for inserts (process 1000 rows at a time for better performance)
  const BATCH_SIZE = 1000;
  const batch: Array<{
    version_id: number;
    no_siri: number | null;
    no_kp: string | null;
    no_kp_lama: string | null;
    nama: string;
    no_hp: string | null;
    jantina: string | null;
    tarikh_lahir: string | null;
    bangsa: string | null;
    agama: string | null;
    kategori_kaum: string | null;
    no_rumah: string | null;
    alamat: string | null;
    poskod: string | null;
    daerah: string | null;
    kod_lokaliti: string | null;
    nama_parlimen: string | null;
    nama_dun: string | null;
    nama_pdm: string | null;
    nama_lokaliti: string | null;
    kategori_undi: string | null;
    nama_tm: string | null;
    masa_undi: string | null;
    saluran: number | null;
  }> = [];

  // Process each row (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      // Parse CSV line (handle quoted values)
      const values = parseCSVLine(line);

      // Map values to columns
      const getValue = (colName: string): string | null => {
        const idx = headerMap[colName];
        return idx !== undefined && idx < values.length ? values[idx] || null : null;
      };

      const nama = getValue("Nama");
      if (!nama || !nama.trim()) {
        errors.push(`Row ${i + 1}: Name is required`);
        continue;
      }

      // Parse date of birth
      const tarikhLahir = parseDateOfBirth(getValue("TarikhLahir"));

      const noSiriStr = getValue("NoSiri");
      const noSiri = noSiriStr ? parseInt(noSiriStr, 10) : null;
      const saluranStr = getValue("Saluran");
      const saluran = saluranStr ? parseInt(saluranStr, 10) : null;

      // Add to batch
      batch.push({
        version_id: versionId,
        no_siri: noSiri && !isNaN(noSiri) ? noSiri : null,
        no_kp: getValue("NoKp") || null,
        no_kp_lama: getValue("NoKpLama") || null,
        nama: nama.trim(),
        no_hp: getValue("NoHP") || null,
        jantina: getValue("Jantina") || null,
        tarikh_lahir: tarikhLahir,
        bangsa: getValue("Bangsa") || null,
        agama: getValue("agama") || null,
        kategori_kaum: getValue("Kategorikaum") || null,
        no_rumah: getValue("NoRumah") || null,
        alamat: getValue("alamat") || null,
        poskod: getValue("poskod") || null,
        daerah: getValue("daerah") || null,
        kod_lokaliti: getValue("KodLokaliti") || null,
        nama_parlimen: getValue("NamaParlimen") || null,
        nama_dun: getValue("NamaDun") || null,
        nama_pdm: getValue("NamaPDM") || null,
        nama_lokaliti: getValue("NamaLokaliti") || null,
        kategori_undi: getValue("KategoriUNDI") || null,
        nama_tm: getValue("NamaTM") || null,
        masa_undi: getValue("MasaUndi") || null,
        saluran: saluran && !isNaN(saluran) ? saluran : null,
      });

      // Insert batch when it reaches the batch size
      if (batch.length >= BATCH_SIZE) {
        const { error: insertError } = await supabase.from("spr_voters").insert(batch);

        if (insertError) {
          // If batch insert fails, try individual inserts to identify problematic rows
          for (let j = 0; j < batch.length; j++) {
            const { error: singleError } = await supabase.from("spr_voters").insert(batch[j]);
            if (singleError) {
              errors.push(`Row ${i - batch.length + j + 1}: ${singleError.message}`);
            } else {
              imported++;
            }
          }
        } else {
          imported += batch.length;
        }

        // Clear batch
        batch.length = 0;
      }
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  // Insert remaining rows in batch
  if (batch.length > 0) {
    const { error: insertError } = await supabase.from("spr_voters").insert(batch);

    if (insertError) {
      // If batch insert fails, try individual inserts to identify problematic rows
      const startRow = lines.length - batch.length;
      for (let j = 0; j < batch.length; j++) {
        const { error: singleError } = await supabase.from("spr_voters").insert(batch[j]);
        if (singleError) {
          errors.push(`Row ${startRow + j + 1}: ${singleError.message}`);
        } else {
          imported++;
        }
      }
    } else {
      imported += batch.length;
    }
  }

  revalidatePath("/admin/spr-voters");
  return {
    success: true,
    data: {
      imported,
      errors: errors.slice(0, 100), // Limit errors to first 100
    },
  };
}

/**
 * Export voters to CSV
 */
export async function exportVotersToCSV(versionId?: number): Promise<ActionResult<string>> {
  const supabase = await getSupabaseReadOnlyClient();

  let query = supabase.from("spr_voters").select("*").order("nama", { ascending: true });

  if (versionId) {
    query = query.eq("version_id", versionId);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, error: "No voters found to export" };
  }

  // CSV header
  const headers = [
    "NoSiri",
    "NoKp",
    "NoKpLama",
    "Nama",
    "NoHP",
    "Jantina",
    "TarikhLahir",
    "Bangsa",
    "agama",
    "Kategorikaum",
    "NoRumah",
    "alamat",
    "poskod",
    "daerah",
    "KodLokaliti",
    "NamaParlimen",
    "NamaDun",
    "NamaPDM",
    "NamaLokaliti",
    "KategoriUNDI",
    "NamaTM",
    "MasaUndi",
    "Saluran",
  ];

  // Build CSV
  let csv = headers.join(",") + "\n";

  for (const voter of data as SprVoter[]) {
    const row = [
      voter.no_siri?.toString() || "",
      voter.no_kp || "",
      voter.no_kp_lama || "",
      `"${(voter.nama || "").replace(/"/g, '""')}"`,
      voter.no_hp || "",
      voter.jantina || "",
      voter.tarikh_lahir
        ? new Date(voter.tarikh_lahir).toLocaleDateString("en-GB")
        : "",
      voter.bangsa || "",
      voter.agama || "",
      voter.kategori_kaum || "",
      voter.no_rumah || "",
      `"${(voter.alamat || "").replace(/"/g, '""')}"`,
      voter.poskod || "",
      voter.daerah || "",
      voter.kod_lokaliti || "",
      voter.nama_parlimen || "",
      voter.nama_dun || "",
      voter.nama_pdm || "",
      voter.nama_lokaliti || "",
      voter.kategori_undi || "",
      voter.nama_tm || "",
      voter.masa_undi || "",
      voter.saluran?.toString() || "",
    ];
    csv += row.join(",") + "\n";
  }

  return { success: true, data: csv };
}

/**
 * Automatically match SPR voters with household members
 * Matches by IC number (no_kp) with household member ic_number
 * Returns statistics about the matching process
 */
export async function matchVotersWithHouseholds(
  versionId: number
): Promise<ActionResult<{ matched: number; unmatched: number; total: number }>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can match voters",
    };
  }

  if (!versionId || Number.isNaN(versionId)) {
    return { success: false, error: "Version ID is required" };
  }

  const supabase = await getSupabaseServerClient();

  // Verify version exists
  const versionResult = await getVoterVersion(versionId);
  if (!versionResult.success || !versionResult.data) {
    return { success: false, error: "Invalid version ID" };
  }

  // Get all voters for this version that are not yet matched
  const { data: voters, error: votersError } = await supabase
    .from("spr_voters")
    .select("id, no_kp, no_kp_lama, nama")
    .eq("version_id", versionId)
    .is("household_member_id", null);

  if (votersError) {
    return { success: false, error: votersError.message };
  }

  if (!voters || voters.length === 0) {
    return {
      success: true,
      data: { matched: 0, unmatched: 0, total: 0 },
    };
  }

  // Get all household members with their IC numbers
  const { data: householdMembers, error: membersError } = await supabase
    .from("household_members")
    .select("id, ic_number, name");

  if (membersError) {
    return { success: false, error: membersError.message };
  }

  // Create a map of IC numbers to household member IDs
  // Handle both current IC (no_kp) and old IC (no_kp_lama)
  const icToMemberMap = new Map<string, number>();
  const nameToMemberMap = new Map<string, number[]>();

  (householdMembers || []).forEach((member) => {
    if (member.ic_number) {
      // Normalize IC number (remove spaces, dashes, convert to uppercase)
      const normalizedIc = member.ic_number.replace(/[\s-]/g, "").toUpperCase();
      icToMemberMap.set(normalizedIc, member.id);

      // Also try matching with old IC format if applicable
      // Malaysian IC numbers can have different formats
      const icVariations = [
        normalizedIc,
        normalizedIc.replace(/(\d{6})(\d{2})(\d{4})/, "$1-$2-$3"), // Add dashes
        normalizedIc.replace(/-/g, ""), // Remove dashes
      ];
      icVariations.forEach((variation) => {
        if (variation !== normalizedIc) {
          icToMemberMap.set(variation, member.id);
        }
      });
    }

    // Also index by name for fallback matching (normalize name)
    if (member.name) {
      const normalizedName = member.name.trim().toUpperCase();
      if (!nameToMemberMap.has(normalizedName)) {
        nameToMemberMap.set(normalizedName, []);
      }
      nameToMemberMap.get(normalizedName)!.push(member.id);
    }
  });

  let matched = 0;
  let unmatched = 0;
  const updates: Array<{ id: number; household_member_id: number }> = [];

  // Match voters with household members
  for (const voter of voters) {
    let matchedMemberId: number | null = null;

    // Try matching by IC number first (most reliable)
    if (voter.no_kp) {
      const normalizedVoterIc = voter.no_kp.replace(/[\s-]/g, "").toUpperCase();
      matchedMemberId = icToMemberMap.get(normalizedVoterIc) || null;

      // If not found, try with old IC
      if (!matchedMemberId && voter.no_kp_lama) {
        const normalizedOldIc = voter.no_kp_lama.replace(/[\s-]/g, "").toUpperCase();
        matchedMemberId = icToMemberMap.get(normalizedOldIc) || null;
      }
    }

    // If still not matched, try matching by name (less reliable, use only if exact match)
    if (!matchedMemberId && voter.nama) {
      const normalizedVoterName = voter.nama.trim().toUpperCase();
      const matchingMembers = nameToMemberMap.get(normalizedVoterName);
      if (matchingMembers && matchingMembers.length === 1) {
        // Only match if there's exactly one member with this name
        matchedMemberId = matchingMembers[0];
      }
    }

    if (matchedMemberId) {
      updates.push({ id: voter.id, household_member_id: matchedMemberId });
      matched++;
    } else {
      unmatched++;
    }
  }

  // Batch update matched voters
  if (updates.length > 0) {
    // Update in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const updatePromises = batch.map((update) =>
        supabase
          .from("spr_voters")
          .update({
            household_member_id: update.household_member_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", update.id)
      );

      await Promise.all(updatePromises);
    }
  }

  revalidatePath("/admin/spr-voters");
  return {
    success: true,
    data: {
      matched,
      unmatched,
      total: voters.length,
    },
  };
}
