"use client";
import Button from "@/components/ui/Button";
import { Crosshair, MapPin } from "lucide-react";
import { useState } from "react";

export default function LocationCapture() {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const mapSrc =
    lat !== null && lng !== null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${(lng - 0.005).toFixed(5)},${(lat - 0.005).toFixed(5)},${(lng + 0.005).toFixed(5)},${(lat + 0.005).toFixed(5)}&layer=mapnik&marker=${lat.toFixed(5)},${lng.toFixed(5)}`
      : "";
  async function capture() {
    setLoading(true);
    setStatus("Locating...");
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setStatus("Geolocation requires HTTPS or localhost");
      setLoading(false);
      return;
    }
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported");
      setLoading(false);
      return;
    }
    try {
      // Check permission status where supported
      const perm = navigator.permissions?.query ? await navigator.permissions.query({ name: "geolocation" }) : null;
      if (perm && perm.state === "denied") {
        setStatus("Location permission denied in browser settings");
        setLoading(false);
        return;
      }
    } catch {}
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude;
        const lo = pos.coords.longitude;
        setLat(la);
        setLng(lo);
        setStatus("Location captured");
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${lo}&zoom=16`);
          const json = await res.json();
          const addr = String(json.display_name || "");
          const el = document.querySelector<HTMLInputElement>('input[name="address"]');
          if (el && addr) el.value = addr;
        } catch {
        }
        setLoading(false);
      },
      () => {
        setStatus("Unable to retrieve location. You can also use the address");
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }

  async function useAddress() {
    const el = document.querySelector<HTMLInputElement>('input[name="address"]');
    const addr = el?.value?.trim();
    if (!addr) {
      setStatus("Enter an address first");
      return;
    }
    setLoading(true);
    setStatus("Pinning from address...");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`);
      const json: Array<{ lat: string; lon: string }> = await res.json();
      if (json.length > 0) {
        const item = json[0];
        const la = Number(item.lat);
        const lo = Number(item.lon);
        setLat(la);
        setLng(lo);
        setStatus("Pinpoint set from address");
      } else {
        setStatus("Address not found");
      }
    } catch {
      setStatus("Failed to pin from address");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4">
      <div className="w-full sm:w-56 lg:w-64 h-56 sm:h-40 lg:h-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden flex-shrink-0 shadow-sm">
        {lat !== null && lng !== null ? (
          <iframe
            src={mapSrc}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location Map"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-3 sm:px-4 text-center">
            Pin will appear here after capturing location
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 flex-1 sm:flex-initial sm:min-w-[140px]">
        <div className="flex gap-2 sm:gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="!h-12 !min-h-[48px] !w-full sm:!w-12 !px-0 !gap-0 flex-1 sm:flex-initial flex-shrink-0"
            aria-label="Use Current Location"
            onClick={capture}
            disabled={loading}
          >
            <Crosshair className="size-5 sm:size-4" aria-hidden="true" />
            <span className="sm:sr-only ml-2 text-sm">Current Location</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="!h-12 !min-h-[48px] !w-full sm:!w-12 !px-0 !gap-0 flex-1 sm:flex-initial flex-shrink-0"
            aria-label="Use Address"
            onClick={useAddress}
            disabled={loading}
          >
            <MapPin className="size-5 sm:size-4" aria-hidden="true" />
            <span className="sm:sr-only ml-2 text-sm">From Address</span>
          </Button>
        </div>
        <div className="min-h-[20px]">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words leading-relaxed">
            {status || "Ready to capture location"}
          </span>
        </div>
      </div>
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />
    </div>
  );
}
