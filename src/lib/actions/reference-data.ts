"use server";

import { getSupabaseServerClient, getSupabaseReadOnlyClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/utils/access-control";
import { revalidatePath } from "next/cache";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

// Generic reference data type
export type ReferenceData = {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields for specific types
  [key: string]: unknown;
};

// Table names for reference data
export type ReferenceTable =
  | "genders"
  | "religions"
  | "races"
  | "districts"
  | "parliaments"
  | "localities"
  | "polling_stations"
  | "duns"
  | "zones"
  | "cawangan"
  | "villages";

export type CreateReferenceDataInput = {
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  // Additional fields for specific types
  parliamentId?: number;
  dunId?: number;
  districtId?: number;
  localityId?: number;
  address?: string;
  pollingStationId?: number;
  zoneId?: number;
  cawanganId?: number;
  // Location fields for localities
  lat?: number;
  lng?: number;
};

export type UpdateReferenceDataInput = {
  id: number;
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  // Additional fields for specific types
  parliamentId?: number;
  dunId?: number;
  districtId?: number;
  localityId?: number;
  address?: string;
  pollingStationId?: number;
  zoneId?: number;
  cawanganId?: number;
  // Location fields for localities
  lat?: number;
  lng?: number;
};

/**
 * Get all reference data items (public - no authentication required)
 * Used for public forms like membership applications
 */
export async function getReferenceDataListPublic(
  table: "genders" | "races" | "religions"
): Promise<ActionResult<ReferenceData[]>> {
  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as ReferenceData[] };
}

/**
 * Get all reference data items
 */
export async function getReferenceDataList(
  table: ReferenceTable
): Promise<ActionResult<ReferenceData[]>> {
  const supabase = await getSupabaseReadOnlyClient();

  let selectQuery = "*";

  // Add joins for localities, polling stations, zones, cawangan, villages, and duns
  if (table === "localities") {
    selectQuery = "*, parliaments(name), duns(name), districts(name)";
  } else if (table === "polling_stations") {
    selectQuery = "*, localities(name)";
  } else if (table === "duns") {
    selectQuery = "*, parliaments(name)";
  } else if (table === "zones") {
    selectQuery = "*, duns(name), polling_stations(name, code)";
  } else if (table === "cawangan") {
    selectQuery = "*, zones(name)";
  } else if (table === "villages") {
    selectQuery = "*, cawangan(name), zones(name)";
  }

  const { data, error } = await supabase
    .from(table)
    .select(selectQuery)
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  // Transform the data to flatten nested objects
  const transformedData = (data || []).map((item: any) => {
    const result = { ...item };
    // Default is_active to false for duns table (column doesn't exist in schema)
    if (table === "duns" && result.is_active === undefined) {
      result.is_active = false;
    }
    if (table === "localities") {
      result.parliament_name = item.parliaments?.name || null;
      result.dun_name = item.duns?.name || null;
      result.district_name = item.districts?.name || null;
      delete result.parliaments;
      delete result.duns;
      delete result.districts;
    } else if (table === "polling_stations") {
      result.locality_name = item.localities?.name || null;
      delete result.localities;
    } else if (table === "duns") {
      result.parliament_name = item.parliaments?.name || null;
      delete result.parliaments;
    } else if (table === "zones") {
      result.dun_name = item.duns?.name || null;
      result.polling_station_name = item.polling_stations?.name || null;
      result.polling_station_code = item.polling_stations?.code || null;
      delete result.duns;
      delete result.polling_stations;
    } else if (table === "cawangan") {
      result.zone_name = item.zones?.name || null;
      delete result.zones;
    } else if (table === "villages") {
      result.cawangan_name = item.cawangan?.name || null;
      result.zone_name = item.zones?.name || null;
      delete result.cawangan;
      delete result.zones;
    }
    return result;
  });

  return { success: true, data: transformedData as ReferenceData[] };
}

/**
 * Get a single reference data item by ID
 */
export async function getReferenceData(
  table: ReferenceTable,
  id: number
): Promise<ActionResult<ReferenceData>> {
  const supabase = await getSupabaseReadOnlyClient();

  const { data, error } = await supabase.from(table).select("*").eq("id", id).single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Default is_active to false for duns table (column doesn't exist in schema)
  if (table === "duns" && data && !("is_active" in data)) {
    (data as any).is_active = false;
  }

  return { success: true, data: data as ReferenceData };
}

/**
 * Create a new reference data item
 */
export async function createReferenceData(
  table: ReferenceTable,
  input: CreateReferenceDataInput
): Promise<ActionResult<ReferenceData>> {
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
      error: "Access denied: Only super admin and ADUN can manage reference data",
    };
  }

  const supabase = await getSupabaseServerClient();

  // Build insert object based on table type
  const insertData: Record<string, unknown> = {
    name: input.name.trim(),
    // Include code only for tables that have this column (exclude zones and villages)
    ...(table !== "zones" && table !== "villages" && { code: input.code?.trim() || null }),
    description: input.description?.trim() || null,
    // Include is_active for all tables except duns, zones, and villages (they don't have this column)
    // For duns, we default to inactive but don't include the column
    // Note: cawangan has is_active column, so it's included
    ...(table !== "duns" && table !== "zones" && table !== "villages" && { is_active: input.isActive ?? true }),
  };

  // Validate required fields for zones, cawangan, and villages
  if (table === "zones" && !input.dunId) {
    return { success: false, error: "DUN is required for zones" };
  }
  if (table === "cawangan" && !input.zoneId) {
    return { success: false, error: "Zone is required for cawangan" };
  }
  if (table === "villages" && !input.cawanganId) {
    return { success: false, error: "Cawangan is required for villages" };
  }

  // Add table-specific fields
  if (table === "localities") {
    if (input.parliamentId) insertData.parliament_id = input.parliamentId;
    if (input.dunId) insertData.dun_id = input.dunId;
    if (input.districtId) insertData.district_id = input.districtId;
    if (input.lat !== undefined) insertData.lat = input.lat;
    if (input.lng !== undefined) insertData.lng = input.lng;
  } else if (table === "parliaments") {
    if (input.lat !== undefined) insertData.lat = input.lat;
    if (input.lng !== undefined) insertData.lng = input.lng;
  } else if (table === "polling_stations") {
    if (input.localityId) insertData.locality_id = input.localityId;
    if (input.address) insertData.address = input.address;
  } else if (table === "duns") {
    if (input.parliamentId) insertData.parliament_id = input.parliamentId;
  } else if (table === "zones") {
    if (input.dunId) insertData.dun_id = input.dunId;
    if (input.pollingStationId) insertData.polling_station_id = input.pollingStationId;
  } else if (table === "cawangan") {
    if (input.zoneId) insertData.zone_id = input.zoneId;
  } else if (table === "villages") {
    if (input.cawanganId) insertData.cawangan_id = input.cawanganId;
    // Keep zone_id for backward compatibility - get it from cawangan
    if (input.cawanganId) {
      const { data: cawanganData } = await supabase
        .from("cawangan")
        .select("zone_id")
        .eq("id", input.cawanganId)
        .single();
      if (cawanganData) {
        insertData.zone_id = cawanganData.zone_id;
      }
    }
  }

  const { data, error } = await supabase.from(table).insert(insertData).select().single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/reference-data/${table}`);
  return { success: true, data: data as ReferenceData };
}

/**
 * Update a reference data item
 */
export async function updateReferenceData(
  table: ReferenceTable,
  input: UpdateReferenceDataInput
): Promise<ActionResult<ReferenceData>> {
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
      error: "Access denied: Only super admin and ADUN can manage reference data",
    };
  }

  const supabase = await getSupabaseServerClient();

  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      return { success: false, error: "Name cannot be empty" };
    }
    updates.name = input.name.trim();
  }

  // Update code only for tables that have this column (exclude zones and villages)
  if (input.code !== undefined && table !== "zones" && table !== "villages") {
    updates.code = input.code?.trim() || null;
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }

  // Update is_active for all tables except duns, zones, and villages (they don't have this column)
  // For duns, we default to inactive but don't include the column
  if (input.isActive !== undefined && table !== "duns" && table !== "zones" && table !== "villages") {
    updates.is_active = input.isActive;
  }

  // Add table-specific fields
  if (table === "localities") {
    if (input.parliamentId !== undefined) updates.parliament_id = input.parliamentId || null;
    if (input.dunId !== undefined) updates.dun_id = input.dunId || null;
    if (input.districtId !== undefined) updates.district_id = input.districtId || null;
    if (input.lat !== undefined) updates.lat = input.lat || null;
    if (input.lng !== undefined) updates.lng = input.lng || null;
  } else if (table === "parliaments") {
    if (input.lat !== undefined) updates.lat = input.lat || null;
    if (input.lng !== undefined) updates.lng = input.lng || null;
  } else if (table === "polling_stations") {
    if (input.localityId !== undefined) updates.locality_id = input.localityId || null;
    if (input.address !== undefined) updates.address = input.address || null;
  } else if (table === "duns") {
    if (input.parliamentId !== undefined) updates.parliament_id = input.parliamentId || null;
  } else if (table === "zones") {
    if (input.dunId !== undefined) updates.dun_id = input.dunId || null;
    if (input.pollingStationId !== undefined) updates.polling_station_id = input.pollingStationId || null;
  } else if (table === "cawangan") {
    if (input.zoneId !== undefined) updates.zone_id = input.zoneId;
  } else if (table === "villages") {
    if (input.cawanganId !== undefined) {
      updates.cawangan_id = input.cawanganId;
      // Keep zone_id for backward compatibility - get it from cawangan
      const { data: cawanganData } = await supabase
        .from("cawangan")
        .select("zone_id")
        .eq("id", input.cawanganId)
        .single();
      if (cawanganData) {
        updates.zone_id = cawanganData.zone_id;
      }
    }
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/reference-data/${table}`);
  return { success: true, data: data as ReferenceData };
}

/**
 * Delete a reference data item
 */
export async function deleteReferenceData(
  table: ReferenceTable,
  id: number
): Promise<ActionResult> {
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
      error: "Access denied: Only super admin and ADUN can manage reference data",
    };
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/reference-data/${table}`);
  return { success: true };
}

/**
 * Import reference data from CSV
 */
export async function importReferenceDataFromCSV(
  table: ReferenceTable,
  csvContent: string
): Promise<ActionResult<{ imported: number; errors: string[] }>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can import reference data",
    };
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
  const requiredColumns = ["Name"];
  for (const col of requiredColumns) {
    if (!(col in headerMap)) {
      return { success: false, error: `Missing required column: ${col}` };
    }
  }

  const supabase = await getSupabaseServerClient();
  const errors: string[] = [];
  let imported = 0;

  // Get existing data for foreign key lookups
  let parliamentMap: Map<string, number> = new Map();
  let dunMap: Map<string, number> = new Map();
  let districtMap: Map<string, number> = new Map();
  let localityMap: Map<string, number> = new Map();

  if (table === "localities" || table === "polling_stations") {
    // Load parliaments, duns, districts for localities
    if (table === "localities") {
      const { data: parliaments } = await supabase.from("parliaments").select("id, name, code");
      const { data: duns } = await supabase.from("duns").select("id, name, code");
      const { data: districts } = await supabase.from("districts").select("id, name, code");

      (parliaments || []).forEach((p: any) => {
        if (p.name) parliamentMap.set(p.name.toUpperCase(), p.id);
        if (p.code) parliamentMap.set(p.code.toUpperCase(), p.id);
      });
      (duns || []).forEach((d: any) => {
        if (d.name) dunMap.set(d.name.toUpperCase(), d.id);
        if (d.code) dunMap.set(d.code.toUpperCase(), d.id);
      });
      (districts || []).forEach((d: any) => {
        if (d.name) districtMap.set(d.name.toUpperCase(), d.id);
        if (d.code) districtMap.set(d.code.toUpperCase(), d.id);
      });
    }

    // Load localities for polling stations
    if (table === "polling_stations") {
      const { data: localities } = await supabase.from("localities").select("id, name, code");
      (localities || []).forEach((l: any) => {
        if (l.name) localityMap.set(l.name.toUpperCase(), l.id);
        if (l.code) localityMap.set(l.code.toUpperCase(), l.id);
      });
    }
  }

  // Process each row (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      // Parse CSV line (handle quoted values)
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

      // Map values to columns
      const getValue = (colName: string): string | null => {
        const idx = headerMap[colName];
        return idx !== undefined && idx < values.length ? values[idx] || null : null;
      };

      const name = getValue("Name");
      if (!name || !name.trim()) {
        errors.push(`Row ${i + 1}: Name is required`);
        continue;
      }

      // Build insert object
      const insertData: Record<string, unknown> = {
        name: name.trim(),
        code: getValue("Code")?.trim() || null,
        description: getValue("Description")?.trim() || null,
        // Include is_active for all tables except duns (duns doesn't have this column)
        // For duns, we default to inactive but don't include the column
        ...(table !== "duns" && {
          is_active: getValue("IsActive")?.toLowerCase() !== "false",
        }),
      };

      // Handle table-specific fields
      if (table === "localities") {
        const parliamentName = getValue("Parliament");
        const dunName = getValue("DUN");
        const districtName = getValue("District");

        if (parliamentName) {
          const parliamentId = parliamentMap.get(parliamentName.toUpperCase());
          if (parliamentId) {
            insertData.parliament_id = parliamentId;
          } else {
            errors.push(`Row ${i + 1}: Parliament "${parliamentName}" not found`);
          }
        }

        if (dunName) {
          const dunId = dunMap.get(dunName.toUpperCase());
          if (dunId) {
            insertData.dun_id = dunId;
          } else {
            errors.push(`Row ${i + 1}: DUN "${dunName}" not found`);
          }
        }

        if (districtName) {
          const districtId = districtMap.get(districtName.toUpperCase());
          if (districtId) {
            insertData.district_id = districtId;
          } else {
            errors.push(`Row ${i + 1}: District "${districtName}" not found`);
          }
        }
      } else if (table === "polling_stations") {
        const localityName = getValue("Locality");
        if (localityName) {
          const localityId = localityMap.get(localityName.toUpperCase());
          if (localityId) {
            insertData.locality_id = localityId;
          } else {
            errors.push(`Row ${i + 1}: Locality "${localityName}" not found`);
          }
        }
        insertData.address = getValue("Address")?.trim() || null;
      }

      // Check for duplicates (by name)
      const { data: existing } = await supabase
        .from(table)
        .select("id")
        .eq("name", insertData.name as string)
        .single();

      if (existing) {
        errors.push(`Row ${i + 1}: "${name}" already exists`);
        continue;
      }

      const { error: insertError } = await supabase.from(table).insert(insertData);

      if (insertError) {
        errors.push(`Row ${i + 1}: ${insertError.message}`);
      } else {
        imported++;
      }
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  revalidatePath(`/admin/reference-data/${table}`);
  return {
    success: true,
    data: {
      imported,
      errors: errors.slice(0, 100), // Limit errors to first 100
    },
  };
}

/**
 * Export reference data to CSV
 */
export async function exportReferenceDataToCSV(table: ReferenceTable): Promise<ActionResult<string>> {
  const supabase = await getSupabaseReadOnlyClient();

  let selectQuery = "*";
  if (table === "localities") {
    selectQuery = "*, parliaments(name, code), duns(name, code), districts(name, code)";
  } else if (table === "polling_stations") {
    selectQuery = "*, localities(name, code)";
  }

  const { data, error } = await supabase.from(table).select(selectQuery).order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, error: "No data found to export" };
  }

  // Build CSV header based on table type
  let headers: string[] = ["Name", "Code", "Description", "IsActive"];

  if (table === "localities") {
    headers.push("Parliament", "DUN", "District");
  } else if (table === "polling_stations") {
    headers.push("Locality", "Address");
  }

  // Build CSV
  let csv = headers.join(",") + "\n";

  for (const item of data as any[]) {
    const row: string[] = [
      `"${(item.name || "").replace(/"/g, '""')}"`,
      item.code || "",
      `"${(item.description || "").replace(/"/g, '""')}"`,
      // Default to false for duns (column doesn't exist in schema)
      (item.is_active ?? false) ? "true" : "false",
    ];

    if (table === "localities") {
      // Handle nested structure from Supabase
      const parliament = (item as any).parliaments;
      const dun = (item as any).duns;
      const district = (item as any).districts;
      row.push(
        (parliament?.name || parliament || "") as string,
        (dun?.name || dun || "") as string,
        (district?.name || district || "") as string
      );
    } else if (table === "polling_stations") {
      // Handle nested structure from Supabase
      const locality = (item as any).localities;
      row.push(
        (locality?.name || locality || "") as string,
        `"${(item.address || "").replace(/"/g, '""')}"`
      );
    }

    csv += row.join(",") + "\n";
  }

  return { success: true, data: csv };
}

/**
 * Populate reference data from SPR voters data
 */
export async function populateReferenceDataFromSpr(
  table: ReferenceTable,
  versionId?: number
): Promise<ActionResult<{ added: number; skipped: number; errors: string[] }>> {
  const access = await getCurrentUserAccess();

  if (!access.isAuthenticated) {
    return { success: false, error: "Authentication required" };
  }

  if (!access.isSuperAdmin && !access.isAdun) {
    return {
      success: false,
      error: "Access denied: Only super admin and ADUN can populate reference data",
    };
  }

  const supabase = await getSupabaseServerClient();
  const errors: string[] = [];
  let added = 0;
  let skipped = 0;

  try {
    // Determine which fields we need based on table type
    let selectFields = "id, version_id";
    switch (table) {
      case "genders":
        selectFields += ", jantina";
        break;
      case "religions":
        selectFields += ", agama";
        break;
      case "races":
        selectFields += ", bangsa";
        break;
      case "districts":
        selectFields += ", daerah";
        break;
      case "parliaments":
        selectFields += ", nama_parlimen";
        break;
      case "duns":
        selectFields += ", nama_dun";
        break;
      case "localities":
        selectFields += ", nama_lokaliti, kod_lokaliti, nama_parlimen, nama_dun, daerah";
        break;
      case "polling_stations":
        selectFields += ", nama_tm, nama_lokaliti, alamat";
        break;
    }

    let query = supabase.from("spr_voters").select(selectFields);

    if (versionId) {
      query = query.eq("version_id", versionId);
    }

    const { data: sprVoters, error: sprError } = await query;

    if (sprError) {
      return { success: false, error: sprError.message };
    }

    if (!sprVoters || sprVoters.length === 0) {
      return { success: false, error: "No SPR voters data found" };
    }

    // Get existing reference data to avoid duplicates
    const { data: existingData } = await supabase.from(table).select("name, code");
    const existingNames = new Set(
      (existingData || []).map((item: any) => item.name?.toUpperCase().trim())
    );
    const existingCodes = new Set(
      (existingData || [])
        .map((item: any) => item.code?.toUpperCase().trim())
        .filter((code: string) => code)
    );

    // Get existing reference data for foreign key lookups
    let parliamentMap: Map<string, number> = new Map();
    let dunMap: Map<string, number> = new Map();
    let districtMap: Map<string, number> = new Map();
    let localityMap: Map<string, number> = new Map();

    if (table === "localities" || table === "polling_stations") {
      const { data: parliaments } = await supabase.from("parliaments").select("id, name, code");
      const { data: duns } = await supabase.from("duns").select("id, name, code");
      const { data: districts } = await supabase.from("districts").select("id, name, code");

      (parliaments || []).forEach((p: any) => {
        if (p.name) parliamentMap.set(p.name.toUpperCase().trim(), p.id);
        if (p.code) parliamentMap.set(p.code.toUpperCase().trim(), p.id);
      });
      (duns || []).forEach((d: any) => {
        if (d.name) dunMap.set(d.name.toUpperCase().trim(), d.id);
        if (d.code) dunMap.set(d.code.toUpperCase().trim(), d.id);
      });
      (districts || []).forEach((d: any) => {
        if (d.name) districtMap.set(d.name.toUpperCase().trim(), d.id);
        if (d.code) districtMap.set(d.code.toUpperCase().trim(), d.id);
      });

      if (table === "polling_stations") {
        const { data: localities } = await supabase.from("localities").select("id, name, code");
        (localities || []).forEach((l: any) => {
          if (l.name) localityMap.set(l.name.toUpperCase().trim(), l.id);
          if (l.code) localityMap.set(l.code.toUpperCase().trim(), l.id);
        });
      }
    }

    // Extract distinct values based on table type
    const distinctValues = new Map<string, any>();

    for (const voter of (sprVoters || []) as any[]) {
      let value: string | null = null;
      let code: string | null = null;
      let additionalData: Record<string, unknown> = {};

      switch (table) {
        case "genders":
          if (voter.jantina) {
            value = voter.jantina === "P" ? "Perempuan" : voter.jantina === "L" ? "Lelaki" : voter.jantina;
            code = voter.jantina;
          }
          break;
        case "religions":
          value = voter.agama;
          break;
        case "races":
          value = voter.bangsa;
          break;
        case "districts":
          value = voter.daerah;
          break;
        case "parliaments":
          value = voter.nama_parlimen;
          // Try to split code and name if format is like "P171 SEPANGGAR"
          if (value) {
            const trimmedValue = value.trim();
            // Match pattern: letter(s) + numbers + space + name
            // Examples: "P171 SEPANGGAR", "P.171 SEPANGGAR", "P171-SEPANGGAR"
            // Pattern: one or more letters, optional dot/dash, one or more digits, then space(s), then the rest
            const match = trimmedValue.match(/^([A-Z]+[.\-]?\d+)\s+(.+)$/i);
            if (match) {
              // Extract code and clean it (remove dots and dashes)
              code = match[1].trim().toUpperCase().replace(/[.\-]/g, "");
              // Extract name
              value = match[2].trim();
            } else {
              // Try pattern without space: "P171SEPANGGAR" -> "P171" and "SEPANGGAR"
              // Pattern: letters + optional dot/dash + digits, then letters (start of name)
              const matchNoSpace = trimmedValue.match(/^([A-Z]+[.\-]?\d+)([A-Z][A-Z\s].*)$/i);
              if (matchNoSpace) {
                code = matchNoSpace[1].trim().toUpperCase().replace(/[.\-]/g, "");
                value = matchNoSpace[2].trim();
              }
            }
          }
          break;
        case "duns":
          value = voter.nama_dun;
          break;
        case "localities":
          value = voter.nama_lokaliti;
          code = voter.kod_lokaliti;
          additionalData = {
            parliament_id: voter.nama_parlimen
              ? parliamentMap.get(voter.nama_parlimen.toUpperCase().trim()) || null
              : null,
            dun_id: voter.nama_dun
              ? dunMap.get(voter.nama_dun.toUpperCase().trim()) || null
              : null,
            district_id: voter.daerah
              ? districtMap.get(voter.daerah.toUpperCase().trim()) || null
              : null,
          };
          break;
        case "polling_stations":
          value = voter.nama_tm;
          additionalData = {
            locality_id: voter.nama_lokaliti
              ? localityMap.get(voter.nama_lokaliti.toUpperCase().trim()) || null
              : null,
            address: voter.alamat || null,
          };
          break;
      }

      if (!value || !value.trim()) continue;

      const normalizedValue = value.trim();
      const normalizedUpper = normalizedValue.toUpperCase();

      // Skip if already exists by name
      if (existingNames.has(normalizedUpper)) {
        continue;
      }

      // Store unique values with their additional data
      if (!distinctValues.has(normalizedUpper)) {
        distinctValues.set(normalizedUpper, {
          name: normalizedValue,
          code: code?.trim() || null,
          ...additionalData,
        });
      } else {
        // For localities and polling_stations, merge additional data if needed
        if (table === "localities" || table === "polling_stations") {
          const existing = distinctValues.get(normalizedUpper)!;
          // Update foreign keys if current has them and existing doesn't
          if (table === "localities") {
            if (!existing.parliament_id && additionalData.parliament_id) {
              existing.parliament_id = additionalData.parliament_id;
            }
            if (!existing.dun_id && additionalData.dun_id) {
              existing.dun_id = additionalData.dun_id;
            }
            if (!existing.district_id && additionalData.district_id) {
              existing.district_id = additionalData.district_id;
            }
          } else if (table === "polling_stations") {
            if (!existing.locality_id && additionalData.locality_id) {
              existing.locality_id = additionalData.locality_id;
            }
            if (!existing.address && additionalData.address) {
              existing.address = additionalData.address;
            }
          }
        }
      }
    }

    // Insert new values
    for (const [key, data] of distinctValues.entries()) {
      // Double-check code uniqueness for tables that have unique codes
      if (data.code && existingCodes.has(data.code.toUpperCase().trim())) {
        skipped++;
        continue;
      }

      // Double-check name uniqueness (in case it was added after we checked)
      if (existingNames.has(data.name.toUpperCase().trim())) {
        skipped++;
        continue;
      }

      const insertData: Record<string, unknown> = {
        name: data.name,
        code: data.code || null,
        description: null,
        // Include is_active for all tables except duns (duns doesn't have this column)
        // For duns, we default to inactive but don't include the column
        ...(table !== "duns" && { is_active: true }),
        ...(table === "localities" && {
          parliament_id: data.parliament_id || null,
          dun_id: data.dun_id || null,
          district_id: data.district_id || null,
        }),
        ...(table === "polling_stations" && {
          locality_id: data.locality_id || null,
          address: data.address || null,
        }),
      };

      const { error: insertError } = await supabase.from(table).insert(insertData);

      if (insertError) {
        // If it's a duplicate key error, skip it
        if (insertError.code === "23505" || insertError.message.includes("duplicate")) {
          skipped++;
        } else {
          errors.push(`${data.name}: ${insertError.message}`);
        }
      } else {
        added++;
      }
    }

    revalidatePath(`/admin/reference-data/${table}`);
    return {
      success: true,
      data: {
        added,
        skipped,
        errors: errors.slice(0, 100), // Limit errors to first 100
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
