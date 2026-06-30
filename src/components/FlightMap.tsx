"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Network, NetworkSnapshot, NormalizedPilot } from "@/types/flight";

const REFRESH_INTERVAL_MS = 15_000; // calé sur la fréquence de mise à jour VATSIM

// Icône avion en SVG, tournée via transform CSS selon le heading
function planeIcon(heading: number, network: Network) {
  const color = network === "vatsim" ? "#1d4ed8" : "#dc2626";
  // Le SVG source pointe vers le NE (~45°) par défaut, d'où l'offset -45
  // pour que heading=0 (nord) affiche bien le nez de l'avion vers le haut
  const rotation = heading - 45;
  return L.divIcon({
    className: "plane-icon",
    html: `<div style="transform: rotate(${rotation}deg); width: 22px; height: 22px;">
      <svg viewBox="0 0 122.88 122.88" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.63,105.75c0.01-4.03,2.3-7.97,6.03-12.38L1.09,79.73c-1.36-0.59-1.33-1.42-0.54-2.4l4.57-3.9
          c0.83-0.51,1.71-0.73,2.66-0.47l26.62,4.5l22.18-24.02L4.8,18.41c-1.31-0.77-1.42-1.64-0.07-2.65l7.47-5.96l67.5,18.97L99.64,7.45
          c6.69-5.79,13.19-8.38,18.18-7.15c2.75,0.68,3.72,1.5,4.57,4.08c1.65,5.06-0.91,11.86-6.96,18.86L94.11,43.18l18.97,67.5
          l-5.96,7.47c-1.01,1.34-1.88,1.23-2.65-0.07L69.43,66.31L45.41,88.48l4.5,26.62c0.26,0.94,0.05,1.82-0.47,2.66l-3.9,4.57
          c-0.97,0.79-1.81,0.82-2.4-0.54l-13.64-21.57c-4.43,3.74-8.37,6.03-12.42,6.03C16.71,106.24,16.63,106.11,16.63,105.75
          L16.63,105.75z"/>
      </svg>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const atcIcon = L.divIcon({
  className: "atc-icon",
  html: `<div style="width: 10px; height: 10px; background: #16a34a; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

function FitBoundsOnce() {
  const map = useMap();
  useEffect(() => {
    map.setView([20, 10], 3);
  }, [map]);
  return null;
}

export default function FlightMap({ network }: { network: Network }) {
  const [snapshot, setSnapshot] = useState<NetworkSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/network/${network}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur de chargement");
        setSnapshot(null);
      } else {
        setSnapshot(data);
        setError(null);
      }
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/90 px-3 py-1.5 rounded-md text-sm shadow">
          Chargement des données {network.toUpperCase()}...
        </div>
      )}
      {error && (
        <div className="absolute top-3 left-3 z-[1000] bg-red-50 text-red-700 px-3 py-1.5 rounded-md text-sm shadow border border-red-200">
          {error}
        </div>
      )}
      {snapshot && !error && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/90 px-3 py-1.5 rounded-md text-sm shadow flex gap-4">
          <span>✈️ {snapshot.pilots.length} vols</span>
          <span>🎙️ {snapshot.atc.length} ATC</span>
        </div>
      )}

      <MapContainer
        center={[20, 10]}
        zoom={3}
        minZoom={2}
        worldCopyJump
        className="w-full h-full"
        style={{ background: "#0a1525" }}
      >
        <FitBoundsOnce />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {snapshot?.pilots.map((pilot) => (
          <PilotMarker key={pilot.callsign} pilot={pilot} network={network} />
        ))}

        {snapshot?.atc.map((atc) => (
          <div key={atc.callsign}>
            <Marker position={[atc.latitude, atc.longitude]} icon={atcIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>{atc.callsign}</strong> ({atc.facilityType})
                  <br />
                  {atc.controllerName ?? "—"}
                  <br />
                  Freq: {atc.frequency ?? "—"}
                </div>
              </Popup>
            </Marker>
            {atc.visualRange ? (
              <Circle
                center={[atc.latitude, atc.longitude]}
                radius={atc.visualRange * 1852} // nm -> mètres
                pathOptions={{
                  color: "#16a34a",
                  weight: 1,
                  fillOpacity: 0.04,
                }}
              />
            ) : null}
          </div>
        ))}
      </MapContainer>
    </div>
  );
}

function PilotMarker({
  pilot,
  network,
}: {
  pilot: NormalizedPilot;
  network: Network;
}) {
  return (
    <Marker
      position={[pilot.latitude, pilot.longitude]}
      icon={planeIcon(pilot.heading, network)}
    >
      <Popup>
        <div className="text-sm space-y-0.5">
          <div className="font-bold">{pilot.callsign}</div>
          <div>{pilot.pilotName ?? "—"}</div>
          <div>
            {pilot.departure ?? "????"} → {pilot.arrival ?? "????"}
          </div>
          <div>
            {pilot.aircraftType ?? "Type inconnu"} · FL
            {Math.round(pilot.altitude / 100)} · {pilot.groundspeed} kt
          </div>
          {pilot.route && (
            <div className="text-xs text-gray-500 max-w-[220px] truncate">
              {pilot.route}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}