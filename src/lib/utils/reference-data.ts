import type { ReferenceTable } from "@/lib/actions/reference-data";

// Helper function to get table display name
export function getTableDisplayName(table: ReferenceTable): string {
  const names: Record<ReferenceTable, string> = {
    genders: "Gender",
    religions: "Religion",
    races: "Race",
    districts: "District",
    parliaments: "Parliament",
    localities: "Locality",
    polling_stations: "Polling Station",
    duns: "DUN",
  };
  return names[table];
}
