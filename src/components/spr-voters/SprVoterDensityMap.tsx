"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

type SprVoterPoint = {
  id: number;
  lat: number;
  lng: number;
  nama: string;
  nama_lokaliti: string | null;
  nama_dun: string | null;
  nama_parlimen: string | null;
  voting_support_status: "white" | "black" | "red" | null;
  voter_count?: number; // Optional: for locality-based density
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
const DensityLayerInner = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { useMap } = mod;
      
      return function DensityLayerInner({ points }: { points: SprVoterPoint[] }) {
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

          // Check if this is locality-based density (has voter_count field)
          const isLocalityBased = points.length > 0 && points[0].voter_count !== undefined;

          if (isLocalityBased) {
            // For locality-based density: show each locality as its own circle at exact location
            const voterCounts = points.map((p) => p.voter_count || 0);
            const maxDensity = voterCounts.length > 0 ? Math.max(...voterCounts) : 1;

            points.forEach((point) => {
              const density = point.voter_count || 0;
              if (density === 0) return; // Skip localities with no voters
              
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

              // Radius based on voter count (min 500m, max 3000m for better visibility)
              // Use a more visible scale: base radius on square root of density
              const radius = Math.max(500, Math.min(3000, 500 + Math.sqrt(density) * 50));

              const circle = L.circle([point.lat, point.lng], {
                radius,
                fillColor: color,
                color: color,
                weight: 3,
                opacity: 1,
                fillOpacity: 0.6,
              });

              const popupContent = `<div class="p-2">
                <strong>${density} voter${density > 1 ? "s" : ""}</strong><br/>
                Locality: ${point.nama_lokaliti || "Unknown"}<br/>
                DUN: ${point.nama_dun || "Unknown"}<br/>
                Parliament: ${point.nama_parlimen || "Unknown"}
              </div>`;

              circle.bindPopup(popupContent);
              layerGroup.addLayer(circle);
            });
          } else {
            // For voter address-based density: use grid-based clustering
            const gridSize = 0.01; // ~1km at equator
            const gridMap = new Map<string, SprVoterPoint[]>();

            points.forEach((point) => {
              const gridKey = `${Math.floor(point.lat / gridSize)},${Math.floor(point.lng / gridSize)}`;
              if (!gridMap.has(gridKey)) {
                gridMap.set(gridKey, []);
              }
              gridMap.get(gridKey)!.push(point);
            });

            const maxDensity = Math.max(...Array.from(gridMap.values()).map((p) => p.length));

            // Create circles for each grid cell with size based on density
            gridMap.forEach((cellPoints) => {
              if (cellPoints.length === 0) return;

              // Calculate center of the cell
              const avgLat = cellPoints.reduce((sum, p) => sum + p.lat, 0) / cellPoints.length;
              const avgLng = cellPoints.reduce((sum, p) => sum + p.lng, 0) / cellPoints.length;

              const density = cellPoints.length;
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

              // Calculate support status breakdown
              const supportCounts: Record<string, number> = {
                white: 0,
                black: 0,
                red: 0,
                unclassified: 0,
              };
              
              cellPoints.forEach((p) => {
                if (p.voting_support_status === "white") {
                  supportCounts.white++;
                } else if (p.voting_support_status === "black") {
                  supportCounts.black++;
                } else if (p.voting_support_status === "red") {
                  supportCounts.red++;
                } else {
                  supportCounts.unclassified++;
                }
              });

              const locality = cellPoints[0]?.nama_lokaliti || "Unknown";
              const dun = cellPoints[0]?.nama_dun || "Unknown";
              const parliament = cellPoints[0]?.nama_parlimen || "Unknown";

              const supportText = [
                supportCounts.white > 0 ? `White: ${supportCounts.white}` : "",
                supportCounts.black > 0 ? `Black: ${supportCounts.black}` : "",
                supportCounts.red > 0 ? `Red: ${supportCounts.red}` : "",
                supportCounts.unclassified > 0 ? `Unclassified: ${supportCounts.unclassified}` : "",
              ]
                .filter(Boolean)
                .join(", ");

              const popupContent = `<div class="p-2">
                <strong>${density} voter${density > 1 ? "s" : ""}</strong><br/>
                Locality: ${locality}<br/>
                DUN: ${dun}<br/>
                Parliament: ${parliament}<br/>
                Support Status: ${supportText}
              </div>`;

              circle.bindPopup(popupContent);
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

                const supportColor: Record<string, string> = {
                  white: "#22c55e",
                  black: "#000000",
                  red: "#ef4444",
                };

                const supportStatus = point.voting_support_status || "unclassified";
                const statusColor = supportColor[supportStatus] || "#6b7280";

                marker.bindPopup(
                  `<div class="p-2">
                    <strong>${point.nama}</strong><br/>
                    Locality: ${point.nama_lokaliti || "N/A"}<br/>
                    DUN: ${point.nama_dun || "N/A"}<br/>
                    Parliament: ${point.nama_parlimen || "N/A"}<br/>
                    Support: <span style="color: ${statusColor}">${supportStatus}</span>
                  </div>`
                );
                layerGroup.addLayer(marker);
              }
            });
          }

          // Add layer to map
          map.addLayer(layerGroup);

          // Fit bounds to show all points after layers are added
          // Wait for map to be ready, then zoom to highest density locality
          map.whenReady(() => {
            setTimeout(() => {
              if (points.length > 0) {
                try {
                  // Find the point with highest density (voter_count for locality-based, or use first point)
                  let highestDensityPoint = points[0];
                  let maxDensity = 0;
                  
                  if (isLocalityBased) {
                    // For locality-based: find the one with highest voter_count
                    points.forEach((point) => {
                      const density = point.voter_count || 0;
                      if (density > maxDensity) {
                        maxDensity = density;
                        highestDensityPoint = point;
                      }
                    });
                  } else {
                    // For voter-based: use the center of all points
                    const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
                    const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
                    highestDensityPoint = { ...points[0], lat: avgLat, lng: avgLng };
                  }
                  
                  // Zoom to the highest density point
                  map.setView([highestDensityPoint.lat, highestDensityPoint.lng], 12, { animate: false });
                } catch (error) {
                  // Fallback: use center of points
                  const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
                  const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
                  map.setView([avgLat, avgLng], 12, { animate: false });
                }
              }
            }, 100);
          });

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

type SprVoterDensityMapProps = {
  voters: SprVoterPoint[];
  className?: string;
};

/**
 * SPR Voter Density Map Component
 * Displays a density visualization of SPR voters on a map
 */
export default function SprVoterDensityMap({ voters, className = "" }: SprVoterDensityMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Import Leaflet CSS on client side
    if (typeof window !== "undefined") {
      // @ts-expect-error - CSS imports are not typed in TypeScript
      import("leaflet/dist/leaflet.css");
    }
  }, []);

  // Calculate center point from voters, or use default (Kota Kinabalu, Sabah)
  const defaultCenter: [number, number] = [5.9804, 116.0735];
  
  let center: [number, number] = defaultCenter;
  if (voters.length > 0) {
    const avgLat = voters.reduce((sum, v) => sum + v.lat, 0) / voters.length;
    const avgLng = voters.reduce((sum, v) => sum + v.lng, 0) / voters.length;
    center = [avgLat, avgLng];
  }

  if (!isClient) {
    return (
      <div className={`flex items-center justify-center h-96 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading map...</p>
      </div>
    );
  }

  if (voters.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">No voters with location data available</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "600px", width: "100%" }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DensityLayerInner points={voters} />
      </MapContainer>
    </div>
  );
}
