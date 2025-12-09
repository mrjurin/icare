"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

type IssuePoint = {
  id: number;
  lat: number;
  lng: number;
  status: string;
  category: string;
  created_at: string;
};

// Dynamically import all Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading map...</p>
    </div>
  ),
});

const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});

// Component that uses useMap hook - must be inside MapContainer
// This component will be dynamically loaded so useMap is available
const HeatmapLayerInner = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { useMap } = mod;
      
      return function HeatmapLayerInner({ points }: { points: IssuePoint[] }) {
        const map = useMap();
        const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);
        const layerRef = useRef<any>(null);

        // Load Leaflet on client side
        useEffect(() => {
          if (typeof window !== "undefined") {
            import("leaflet").then((L) => {
              // Fix for default marker icons in Next.js
              delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
              L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
              });
              setLeaflet(L);
            });
          }
        }, []);

        useEffect(() => {
          if (!map || !leaflet || points.length === 0) return;

          const L = leaflet;

          // Remove existing layer if it exists
          if (layerRef.current) {
            map.removeLayer(layerRef.current);
          }

          // Create a new layer group
          const layerGroup = L.layerGroup();
          layerRef.current = layerGroup;

          // Group points by proximity (simple grid-based clustering)
          const gridSize = 0.01; // ~1km at equator
          const gridMap = new Map<string, IssuePoint[]>();

          points.forEach((point) => {
            const gridKey = `${Math.floor(point.lat / gridSize)},${Math.floor(point.lng / gridSize)}`;
            if (!gridMap.has(gridKey)) {
              gridMap.set(gridKey, []);
            }
            gridMap.get(gridKey)!.push(point);
          });

          // Create circles for each grid cell with size based on density
          gridMap.forEach((cellPoints) => {
            if (cellPoints.length === 0) return;

            // Calculate center of the cell
            const avgLat = cellPoints.reduce((sum, p) => sum + p.lat, 0) / cellPoints.length;
            const avgLng = cellPoints.reduce((sum, p) => sum + p.lng, 0) / cellPoints.length;

            // Determine color based on density
            const density = cellPoints.length;
            const maxDensity = Math.max(...Array.from(gridMap.values()).map((p) => p.length));
            const intensity = Math.min(density / Math.max(maxDensity, 1), 1);

            // Color gradient: green (low) -> yellow -> orange -> red (high)
            let color = "#22c55e"; // green
            if (intensity > 0.75) {
              color = "#ef4444"; // red
            } else if (intensity > 0.5) {
              color = "#f97316"; // orange
            } else if (intensity > 0.25) {
              color = "#eab308"; // yellow
            }

            // Radius based on density (min 50m, max 500m)
            const radius = Math.max(50, Math.min(500, density * 30));

            const circle = L.circle([avgLat, avgLng], {
              radius,
              fillColor: color,
              color: color,
              weight: 1,
              opacity: 0.8,
              fillOpacity: 0.4,
            });

            // Add popup with issue count
            const statusCounts: Record<string, number> = {};
            cellPoints.forEach((p) => {
              statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
            });

            const statusText = Object.entries(statusCounts)
              .map(([status, count]) => `${status.replace(/_/g, " ")}: ${count}`)
              .join(", ");

            circle.bindPopup(`<div class="p-2"><strong>${density} issue${density > 1 ? "s" : ""}</strong><br/>${statusText}</div>`);
            layerGroup.addLayer(circle);
          });

          // Add individual markers for isolated points (not in clusters)
          points.forEach((point) => {
            const gridKey = `${Math.floor(point.lat / gridSize)},${Math.floor(point.lng / gridSize)}`;
            const cellPoints = gridMap.get(gridKey) || [];
            
            // Only show individual markers if there's only one point in the cell
            if (cellPoints.length === 1) {
              const marker = L.marker([point.lat, point.lng], {
                icon: L.icon({
                  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
                  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                }),
              });

              const statusColor: Record<string, string> = {
                pending: "#f97316",
                in_progress: "#3b82f6",
                resolved: "#22c55e",
                closed: "#6b7280",
              };

              marker.bindPopup(
                `<div class="p-2">
                  <strong>Issue #${point.id}</strong><br/>
                  Status: <span style="color: ${statusColor[point.status] || "#000"}">${point.status.replace(/_/g, " ")}</span><br/>
                  Category: ${point.category.replace(/_/g, " ")}
                </div>`
              );
              layerGroup.addLayer(marker);
            }
          });

          // Add layer to map
          map.addLayer(layerGroup);

          // Fit bounds to show all points
          if (points.length > 0) {
            const bounds = L.latLngBounds(
              points.map((p) => [p.lat, p.lng] as [number, number])
            );
            map.fitBounds(bounds, { padding: [50, 50] });
          }

          // Cleanup function
          return () => {
            if (layerRef.current && map) {
              map.removeLayer(layerRef.current);
            }
          };
        }, [map, points, leaflet]);

        return null;
      };
    }),
  {
    ssr: false,
  }
);

type IssueDensityMapProps = {
  issues: IssuePoint[];
  className?: string;
};

/**
 * Issue Density Map Component
 * Displays a heatmap visualization of reported issues
 */
export default function IssueDensityMap({ issues, className = "" }: IssueDensityMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Import Leaflet CSS on client side
    if (typeof window !== "undefined") {
      // @ts-expect-error - CSS imports are not typed in TypeScript
      import("leaflet/dist/leaflet.css");
    }
  }, []);

  // Calculate center point from issues, or use default (Kota Kinabalu, Sabah)
  const defaultCenter: [number, number] = [5.9804, 116.0735];
  
  let center: [number, number] = defaultCenter;
  if (issues.length > 0) {
    const avgLat = issues.reduce((sum, i) => sum + i.lat, 0) / issues.length;
    const avgLng = issues.reduce((sum, i) => sum + i.lng, 0) / issues.length;
    center = [avgLat, avgLng];
  }

  if (!isClient) {
    return (
      <div className={`flex items-center justify-center h-96 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading map...</p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">No issues with location data available</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={issues.length > 0 ? 12 : 10}
        style={{ height: "600px", width: "100%" }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayerInner points={issues} />
      </MapContainer>
    </div>
  );
}
