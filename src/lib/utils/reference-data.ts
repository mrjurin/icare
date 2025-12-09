import type { ReferenceTable } from "@/lib/actions/reference-data";

// Helper function to get table display name
export function getTableDisplayName(
  table: ReferenceTable,
  t?: (key: string) => string
): string {
  if (t) {
    return t(`tables.${table}`);
  }
  
  const names: Record<ReferenceTable, string> = {
    genders: "Gender",
    religions: "Religion",
    races: "Race",
    districts: "District",
    parliaments: "Parliament",
    localities: "Locality",
    polling_stations: "Polling Station",
    duns: "DUN",
    zones: "Zone",
    cawangan: "Cawangan",
    villages: "Village",
  };
  return names[table];
}
