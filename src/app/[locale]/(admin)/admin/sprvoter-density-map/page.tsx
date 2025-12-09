import {
  getVotersWithLocation,
  getVoterVersions,
  getLocalitiesWithVoterCounts,
} from "@/lib/actions/spr-voters";
import SprVoterDensityMap from "@/components/spr-voters/SprVoterDensityMap";
import VersionManagement from "../spr-voters/VersionManagement";
import DensityTypeSelector from "./DensityTypeSelector";

export default async function AdminSprVoterDensityMapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const versionId = typeof sp.versionId === "string" ? parseInt(sp.versionId, 10) : undefined;
  const densityType = (sp.densityType as string) || "voter_address";

  // Get versions
  const versionsResult = await getVoterVersions();
  const versions = versionsResult.success ? versionsResult.data || [] : [];

  // Get active version if no versionId specified
  const activeVersion = versions.find((v) => v.is_active);
  const selectedVersionId = versionId || activeVersion?.id;

  // Get voters with location data
  const votersResult = await getVotersWithLocation(selectedVersionId);
  const voters = votersResult.success ? votersResult.data || [] : [];

  // Get localities with voter counts
  const localitiesResult = await getLocalitiesWithVoterCounts(selectedVersionId);
  const localities = localitiesResult.success ? localitiesResult.data || [] : [];

  // Transform voters to match the component's expected format
  const voterPoints = voters
    .filter((v) => v.lat !== null && v.lng !== null)
    .map((v) => ({
      id: v.id,
      lat: v.lat!,
      lng: v.lng!,
      nama: v.nama,
      nama_lokaliti: v.nama_lokaliti,
      nama_dun: v.nama_dun,
      nama_parlimen: v.nama_parlimen,
      voting_support_status: v.voting_support_status,
    }));

  // Transform localities to match the component's expected format
  // For locality-based density, we create points at locality locations
  // Each point represents all voters in that locality
  const localityPoints = localities.map((loc) => ({
    id: loc.id,
    lat: loc.lat,
    lng: loc.lng,
    nama: loc.name,
    nama_lokaliti: loc.name,
    nama_dun: loc.nama_dun,
    nama_parlimen: loc.nama_parlimen,
    voting_support_status: null as "white" | "black" | "red" | null,
    voter_count: loc.voter_count, // Store voter count for popup display
  }));

  // Select points based on density type
  const displayPoints = densityType === "locality_location" ? localityPoints : voterPoints;
  const totalCount =
    densityType === "locality_location"
      ? localities.reduce((sum, loc) => sum + loc.voter_count, 0)
      : voterPoints.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.015em]">
            SPR Voter Density Map
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visualize voter density across different locations
          </p>
        </div>
      </div>

      <VersionManagement versions={versions} selectedVersionId={selectedVersionId} />

      {selectedVersionId && (
        <>
          {displayPoints.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">
                        {densityType === "locality_location"
                          ? "Total Localities with Voters:"
                          : "Total Voters with Location:"}
                      </span>{" "}
                      {densityType === "locality_location"
                        ? `${localities.length} (${totalCount} voters)`
                        : totalCount}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Low Density</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Medium Density</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span>High Density</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Very High Density</span>
                      </div>
                    </div>
                  </div>
                  <DensityTypeSelector />
                </div>
              </div>
              <SprVoterDensityMap voters={displayPoints} />
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {densityType === "locality_location"
                  ? "No localities with location data and voters available for the selected version."
                  : "No voters with location data available for the selected version."}
              </p>
            </div>
          )}
        </>
      )}

      {!selectedVersionId && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No voter version selected. Please create or select a version to view the density map.
          </p>
        </div>
      )}
    </div>
  );
}
