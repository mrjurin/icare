"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MapPin, Link2, Unlink, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { linkPollingStationToZone, type ZoneWithPollingStation } from "@/lib/actions/zones";
import { getReferenceDataList } from "@/lib/actions/reference-data";

type Props = {
  zone: ZoneWithPollingStation;
  zoneId: number;
};

export default function PollingStationLinkSection({ zone, zoneId }: Props) {
  const t = useTranslations("zones.detail.pollingStation");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pollingStations, setPollingStations] = useState<Array<{ id: number; name: string; code: string | null }>>([]);
  const [selectedPollingStationId, setSelectedPollingStationId] = useState<number | null>(
    zone.polling_station_id || null
  );
  const [isLoadingStations, setIsLoadingStations] = useState(false);

  // Fetch polling stations
  useEffect(() => {
    setIsLoadingStations(true);
    getReferenceDataList("polling_stations")
      .then((result) => {
        if (result.success && result.data) {
          setPollingStations(
            result.data
              .filter((ps: any) => ps.is_active !== false)
              .map((ps: any) => ({
                id: ps.id,
                name: ps.name,
                code: ps.code,
              }))
          );
        }
      })
      .finally(() => {
        setIsLoadingStations(false);
      });
  }, []);

  const handleLink = () => {
    if (!selectedPollingStationId) {
      setError(t("pleaseSelectPollingStation"));
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await linkPollingStationToZone(zoneId, selectedPollingStationId);
      if (result.success) {
        setSuccess(t("linkedSuccessfully"));
        router.refresh();
      } else {
        setError(result.error || t("linkFailed"));
      }
    });
  };

  const handleUnlink = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await linkPollingStationToZone(zoneId, null);
      if (result.success) {
        setSuccess(t("unlinkedSuccessfully"));
        setSelectedPollingStationId(null);
        router.refresh();
      } else {
        setError(result.error || t("unlinkFailed"));
      }
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="size-5 text-gray-600" />
        <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
      </div>

      {zone.polling_station ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">{t("currentPollingStation")}</div>
            <div className="text-lg font-semibold text-gray-900">{zone.polling_station.name}</div>
            {zone.polling_station.code && (
              <div className="text-sm text-gray-600 mt-1">Code: {zone.polling_station.code}</div>
            )}
            {zone.polling_station.locality_name && (
              <div className="text-sm text-gray-600 mt-1">Locality: {zone.polling_station.locality_name}</div>
            )}
          </div>

          {isLoadingStations ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="size-4 animate-spin" />
              <span>{t("loadingPollingStations")}</span>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("selectPollingStation")}
                </label>
                <select
                  value={selectedPollingStationId || ""}
                  onChange={(e) => setSelectedPollingStationId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isPending}
                >
                  <option value="">{t("selectOption")}</option>
                  {pollingStations.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      {ps.name} {ps.code ? `(${ps.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleLink}
                  disabled={isPending || !selectedPollingStationId || selectedPollingStationId === zone.polling_station_id}
                  className="gap-2"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Link2 className="size-4" />
                  )}
                  <span>{t("link")}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUnlink}
                  disabled={isPending}
                  className="gap-2"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Unlink className="size-4" />
                  )}
                  <span>{t("unlink")}</span>
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">{t("noPollingStationLinked")}</p>

          {isLoadingStations ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="size-4 animate-spin" />
              <span>{t("loadingPollingStations")}</span>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("selectPollingStation")}
                </label>
                <select
                  value={selectedPollingStationId || ""}
                  onChange={(e) => setSelectedPollingStationId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isPending}
                >
                  <option value="">{t("selectOption")}</option>
                  {pollingStations.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      {ps.name} {ps.code ? `(${ps.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleLink}
                disabled={isPending || !selectedPollingStationId}
                className="gap-2"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Link2 className="size-4" />
                )}
                <span>{t("link")}</span>
              </Button>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}
    </div>
  );
}
