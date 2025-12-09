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
  lat: number | null;
  lng: number | null;
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
  lat?: number | null;
  lng?: number | null;
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
  lat?: number | null;
  lng?: number | null;
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
 * Get voters with location data (lat/lng) for a specific version
 * Used for density map visualization
 */
export async function getVotersWithLocation(
  versionId?: number
): Promise<ActionResult<SprVoter[]>> {
  const supabase = await getSupabaseReadOnlyClient();

  let query = supabase
    .from("spr_voters")
    .select("id, lat, lng, nama, nama_lokaliti, nama_dun, nama_parlimen, voting_support_status")
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (versionId) {
    query = query.eq("version_id", versionId);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as SprVoter[] };
}

/**
 * Get localities with location data and voter counts for a specific version
 * Used for density map visualization based on locality locations
 */
export async function getLocalitiesWithVoterCounts(
  versionId?: number
): Promise<ActionResult<Array<{
  id: number;
  name: string;
  lat: number;
  lng: number;
  voter_count: number;
  nama_dun: string | null;
  nama_parlimen: string | null;
}>>> {
  const supabase = await getSupabaseReadOnlyClient();

  // Get localities with location data (lat/lng)
  const { data: localities, error: localitiesError } = await supabase
    .from("localities")
    .select("id, name, code, lat, lng")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .eq("is_active", true);

  if (localitiesError) {
    return { success: false, error: localitiesError.message };
  }

  if (!localities || localities.length === 0) {
    return { success: true, data: [] };
  }

  // Get voters for the version
  // Note: Supabase has a default limit of 1000 rows, so we need to fetch all records
  let voterQuery = supabase
    .from("spr_voters")
    .select("id, nama_lokaliti, kod_lokaliti, nama_dun, nama_parlimen", { count: "exact" });

  if (versionId) {
    voterQuery = voterQuery.eq("version_id", versionId);
  }

  // Fetch all voters (Supabase default limit is 1000, so we need to handle pagination)
  const allVoters: Array<{
    id: number;
    nama_lokaliti: string | null;
    kod_lokaliti: string | null;
    nama_dun: string | null;
    nama_parlimen: string | null;
  }> = [];
  
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const query = versionId
      ? supabase
          .from("spr_voters")
          .select("id, nama_lokaliti, kod_lokaliti, nama_dun, nama_parlimen")
          .eq("version_id", versionId)
          .range(from, from + pageSize - 1)
      : supabase
          .from("spr_voters")
          .select("id, nama_lokaliti, kod_lokaliti, nama_dun, nama_parlimen")
          .range(from, from + pageSize - 1);

    const { data: votersPage, error: votersError } = await query;

    if (votersError) {
      return { success: false, error: votersError.message };
    }

    if (votersPage && votersPage.length > 0) {
      allVoters.push(...votersPage);
      from += pageSize;
      hasMore = votersPage.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  const voters = allVoters;

  // Helper function to normalize strings for comparison
  const normalize = (str: string | null | undefined): string => {
    if (!str) return "";
    return String(str).trim().toUpperCase();
  };

  // Count voters per locality using direct comparison (more reliable than Map lookups)
  const localityVoterCounts = new Map<
    number, // locality id
    { count: number; nama_dun: string | null; nama_parlimen: string | null }
  >();

  let matchedVoters = 0;
  let unmatchedVoters = 0;

  (voters || []).forEach((voter) => {
    let matchedLocality: typeof localities[0] | undefined;

    // Normalize voter codes/names for comparison
    const voterCode = normalize(voter.kod_lokaliti);
    const voterName = normalize(voter.nama_lokaliti);

    // Try to find matching locality by code first (more reliable)
    if (voterCode) {
      matchedLocality = localities.find((loc) => {
        const locCode = normalize(loc.code);
        return locCode === voterCode || locCode === voter.kod_lokaliti?.trim() || loc.code === voter.kod_lokaliti;
      });
    }

    // If no match by code, try matching by name (case-insensitive)
    if (!matchedLocality && voterName) {
      matchedLocality = localities.find((loc) => {
        const locName = normalize(loc.name);
        return locName === voterName || locName === voter.nama_lokaliti?.trim() || loc.name === voter.nama_lokaliti;
      });
    }

    if (matchedLocality) {
      matchedVoters++;
      const current = localityVoterCounts.get(matchedLocality.id) || {
        count: 0,
        nama_dun: voter.nama_dun,
        nama_parlimen: voter.nama_parlimen,
      };
      current.count++;
      localityVoterCounts.set(matchedLocality.id, current);
    } else {
      unmatchedVoters++;
    }
  });

  // Log matching statistics for debugging
  console.log(`[getLocalitiesWithVoterCounts] Version: ${versionId || "all"}, Total voters: ${voters?.length || 0}, Matched: ${matchedVoters}, Unmatched: ${unmatchedVoters}`);
  console.log(`[getLocalitiesWithVoterCounts] Localities with voters: ${Array.from(localityVoterCounts.values()).reduce((sum, v) => sum + v.count, 0)}`);
  
  // Log sample matches for debugging
  if (process.env.NODE_ENV === "development" && localityVoterCounts.size > 0) {
    const sampleCounts = Array.from(localityVoterCounts.entries()).slice(0, 5);
    console.log(`[getLocalitiesWithVoterCounts] Sample locality counts:`, sampleCounts.map(([id, data]) => {
      const loc = localities.find(l => l.id === id);
      return `${loc?.name}: ${data.count}`;
    }));
  }

  // Combine localities with voter counts
  // Use the locality's lat/lng coordinates (not voter addresses)
  const result = (localities || [])
    .map((locality) => {
      const voterData = localityVoterCounts.get(locality.id) || {
        count: 0,
        nama_dun: null,
        nama_parlimen: null,
      };

      return {
        id: locality.id,
        name: locality.name,
        lat: locality.lat!, // Use locality's lat/lng
        lng: locality.lng!, // Use locality's lat/lng
        voter_count: voterData.count,
        nama_dun: voterData.nama_dun,
        nama_parlimen: voterData.nama_parlimen,
      };
    })
    .filter((loc) => loc.voter_count > 0); // Only include localities with voters

  // Log final result for debugging
  const totalVotersInResult = result.reduce((sum, loc) => sum + loc.voter_count, 0);
  console.log(`[getLocalitiesWithVoterCounts] Final result: ${result.length} localities, ${totalVotersInResult} total voters`);

  return { success: true, data: result };
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
      lat: input.lat !== undefined ? input.lat : null,
      lng: input.lng !== undefined ? input.lng : null,
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
  if (input.lat !== undefined) updates.lat = input.lat;
  if (input.lng !== undefined) updates.lng = input.lng;

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

/**
 * Start geocoding voter addresses (fire and forget)
 * Creates a job and processes asynchronously
 */
export async function startGeocodingJob(
  versionId: number
): Promise<ActionResult<{ jobId: number }>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can geocode addresses",
    };
  }

  const supabase = await getSupabaseServerClient();

  // Check if there's already a running or paused job for this version
  const { data: existingJob } = await supabase
    .from("geocoding_jobs")
    .select("id, status")
    .eq("version_id", versionId)
    .in("status", ["pending", "running", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingJob) {
    return {
      success: true,
      data: { jobId: existingJob.id },
    };
  }

  // Count voters that need geocoding
  const { count: totalVoters, error: countError } = await supabase
    .from("spr_voters")
    .select("id", { count: "exact", head: true })
    .eq("version_id", versionId)
    .is("lat", null)
    .not("alamat", "is", null)
    .neq("alamat", "");

  if (countError) {
    return { success: false, error: `Failed to count voters: ${countError.message}` };
  }

  if (!totalVoters || totalVoters === 0) {
    return {
      success: false,
      error: "No voters found that need geocoding",
    };
  }

  // Create job record
  const { data: job, error: jobError } = await supabase
    .from("geocoding_jobs")
    .insert({
      version_id: versionId,
      status: "pending",
      total_voters: totalVoters,
      created_by: access.staffId || null,
    })
    .select()
    .single();

  if (jobError || !job) {
    return { success: false, error: `Failed to create job: ${jobError?.message || "Unknown error"}` };
  }

  // Start geocoding process asynchronously (fire and forget)
  processGeocodingJob(job.id, versionId).catch((error) => {
    console.error(`Geocoding job ${job.id} failed:`, error);
  });

  revalidatePath("/admin/spr-voters");
  revalidatePath("/[locale]/(admin)/admin/spr-voters");
  return {
    success: true,
    data: { jobId: job.id },
  };
}

/**
 * Process geocoding job asynchronously
 * This function runs in the background and updates job progress
 */
async function processGeocodingJob(jobId: number, versionId: number): Promise<void> {
  const supabase = await getSupabaseServerClient();

  try {
    // Get current job status to check if resuming
    const { data: currentJob } = await supabase
      .from("geocoding_jobs")
      .select("status, processed_voters, geocoded_count, failed_count, skipped_count")
      .eq("id", jobId)
      .single();

    const isResuming = currentJob?.status === "paused";
    const alreadyProcessed = currentJob?.processed_voters || 0;
    let geocoded = currentJob?.geocoded_count || 0;
    let failed = currentJob?.failed_count || 0;
    let skipped = currentJob?.skipped_count || 0;
    let processed = alreadyProcessed;

    // Update job status to running (or keep running if already running)
    await supabase
      .from("geocoding_jobs")
      .update({
        status: "running",
        started_at: isResuming ? undefined : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // Get all voters for this version that don't have lat/lng yet and have an address
    const { data: voters, error: fetchError } = await supabase
      .from("spr_voters")
      .select("id, alamat, poskod, daerah, nama_lokaliti")
      .eq("version_id", versionId)
      .is("lat", null)
      .not("alamat", "is", null)
      .neq("alamat", "");

    if (fetchError || !voters) {
      throw new Error(`Failed to fetch voters: ${fetchError?.message || "Unknown error"}`);
    }

    // If resuming, skip already processed voters
    const votersToProcess = isResuming ? voters.slice(alreadyProcessed) : voters;

    // Process voters one by one with rate limiting
    for (const voter of votersToProcess) {
      // Check if job has been paused before processing each voter
      const { data: jobCheck } = await supabase
        .from("geocoding_jobs")
        .select("status")
        .eq("id", jobId)
        .single();

      if (jobCheck?.status === "paused") {
        // Job was paused, exit the loop
        await supabase
          .from("geocoding_jobs")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);
        return; // Exit function but don't mark as failed
      }

      if (jobCheck?.status !== "running") {
        // Job status changed to something else (completed, failed, etc.), exit
        return;
      }
      // Build address string from available fields
      const addressParts: string[] = [];
      if (voter.alamat) addressParts.push(voter.alamat);
      if (voter.poskod) addressParts.push(voter.poskod);
      if (voter.daerah) addressParts.push(voter.daerah);
      if (voter.nama_lokaliti) addressParts.push(voter.nama_lokaliti);

      const address = addressParts.join(", ").trim();

      if (!address) {
        skipped++;
        processed++;
        // Update progress
        await supabase
          .from("geocoding_jobs")
          .update({
            processed_voters: processed,
            skipped_count: skipped,
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);
        continue;
      }

      try {
        // Geocode using Nominatim API
        // Rate limit: 1 request per second (Nominatim usage policy)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
          {
            headers: {
              "User-Agent": "iCare-Voter-Management/1.0", // Required by Nominatim usage policy
            },
          }
        );

        if (!response.ok) {
          failed++;
          processed++;
          // Update progress
          await supabase
            .from("geocoding_jobs")
            .update({
              processed_voters: processed,
              failed_count: failed,
              updated_at: new Date().toISOString(),
            })
            .eq("id", jobId);
          // Wait before next request
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        const results: Array<{ lat: string; lon: string }> = await response.json();

        if (results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);

          if (!isNaN(lat) && !isNaN(lon)) {
            // Update voter with lat/lng
            const { error: updateError } = await supabase
              .from("spr_voters")
              .update({
                lat,
                lng: lon,
                updated_at: new Date().toISOString(),
              })
              .eq("id", voter.id);

            if (updateError) {
              failed++;
            } else {
              geocoded++;
            }
          } else {
            failed++;
          }
        } else {
          failed++;
        }

        processed++;

        // Update progress every 10 voters or at the end
        if (processed % 10 === 0 || processed === voters.length) {
          await supabase
            .from("geocoding_jobs")
            .update({
              processed_voters: processed,
              geocoded_count: geocoded,
              failed_count: failed,
              skipped_count: skipped,
              updated_at: new Date().toISOString(),
            })
            .eq("id", jobId);
        }

        // Rate limiting: wait 1 second between requests (Nominatim requirement)
        if (processed < voters.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        failed++;
        processed++;
        // Update progress even on error
        await supabase
          .from("geocoding_jobs")
          .update({
            processed_voters: processed,
            failed_count: failed,
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);
        // Wait before next request
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Mark job as completed
    await supabase
      .from("geocoding_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        processed_voters: processed,
        geocoded_count: geocoded,
        failed_count: failed,
        skipped_count: skipped,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // Note: Don't call revalidatePath here as this is a background process
    // The UI polls for updates, so revalidation happens via the polling mechanism
  } catch (error) {
    // Mark job as failed
    await supabase
      .from("geocoding_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}

/**
 * Get geocoding job status
 */
/**
 * Pause a running geocoding job
 */
export async function pauseGeocodingJob(
  jobId: number
): Promise<ActionResult<{ jobId: number }>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can pause geocoding jobs",
    };
  }

  const supabase = await getSupabaseServerClient();

  // Check if job exists and is running
  const { data: job, error: fetchError } = await supabase
    .from("geocoding_jobs")
    .select("id, status")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) {
    return { success: false, error: `Failed to find job: ${fetchError?.message || "Unknown error"}` };
  }

  if (job.status !== "running") {
    return {
      success: false,
      error: `Cannot pause job: Job is not running (current status: ${job.status})`,
    };
  }

  // Update job status to paused
  const { error: updateError } = await supabase
    .from("geocoding_jobs")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (updateError) {
    return { success: false, error: `Failed to pause job: ${updateError.message}` };
  }

  revalidatePath("/admin/spr-voters");
  revalidatePath("/[locale]/(admin)/admin/spr-voters");
  return {
    success: true,
    data: { jobId },
  };
}

/**
 * Resume a paused geocoding job
 */
export async function resumeGeocodingJob(
  jobId: number
): Promise<ActionResult<{ jobId: number }>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can resume geocoding jobs",
    };
  }

  const supabase = await getSupabaseServerClient();

  // Check if job exists and is paused
  const { data: job, error: fetchError } = await supabase
    .from("geocoding_jobs")
    .select("id, status, version_id")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) {
    return { success: false, error: `Failed to find job: ${fetchError?.message || "Unknown error"}` };
  }

  if (job.status !== "paused") {
    return {
      success: false,
      error: `Cannot resume job: Job is not paused (current status: ${job.status})`,
    };
  }

  // Update job status to running
  const { error: updateError } = await supabase
    .from("geocoding_jobs")
    .update({
      status: "running",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (updateError) {
    return { success: false, error: `Failed to resume job: ${updateError.message}` };
  }

  // Restart the geocoding process (it will skip already processed voters)
  processGeocodingJob(jobId, job.version_id).catch((error) => {
    console.error(`Geocoding job ${jobId} failed after resume:`, error);
  });

  revalidatePath("/admin/spr-voters");
  revalidatePath("/[locale]/(admin)/admin/spr-voters");
  return {
    success: true,
    data: { jobId },
  };
}

/**
 * Get geocoding job status
 */
export async function getGeocodingJobStatus(
  jobId: number
): Promise<ActionResult<{
  id: number;
  status: "pending" | "running" | "paused" | "completed" | "failed";
  totalVoters: number;
  processedVoters: number;
  geocodedCount: number;
  failedCount: number;
  skippedCount: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
}>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await getSupabaseReadOnlyClient();

  const { data: job, error } = await supabase
    .from("geocoding_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return { success: false, error: `Failed to fetch job: ${error?.message || "Unknown error"}` };
  }

  return {
    success: true,
    data: {
      id: job.id,
      status: job.status as "pending" | "running" | "paused" | "completed" | "failed",
      totalVoters: job.total_voters,
      processedVoters: job.processed_voters,
      geocodedCount: job.geocoded_count,
      failedCount: job.failed_count,
      skippedCount: job.skipped_count,
      errorMessage: job.error_message,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    },
  };
}

/**
 * Get the latest geocoding job for a version
 */
export async function getLatestGeocodingJob(
  versionId: number
): Promise<ActionResult<{
  id: number;
  status: "pending" | "running" | "paused" | "completed" | "failed";
  totalVoters: number;
  processedVoters: number;
  geocodedCount: number;
  failedCount: number;
  skippedCount: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
} | null>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await getSupabaseReadOnlyClient();

  const { data: job, error } = await supabase
    .from("geocoding_jobs")
    .select("*")
    .eq("version_id", versionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // No job found is not an error
    if (error.code === "PGRST116") {
      return { success: true, data: null };
    }
    return { success: false, error: `Failed to fetch job: ${error.message}` };
  }

  if (!job) {
    return { success: true, data: null };
  }

  return {
    success: true,
    data: {
      id: job.id,
      status: job.status as "pending" | "running" | "paused" | "completed" | "failed",
      totalVoters: job.total_voters,
      processedVoters: job.processed_voters,
      geocodedCount: job.geocoded_count,
      failedCount: job.failed_count,
      skippedCount: job.skipped_count,
      errorMessage: job.error_message,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    },
  };
}
