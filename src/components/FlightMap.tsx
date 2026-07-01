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
  return L.divIcon({
    className: "plane-icon",
    html: `<div style="transform: rotate(${heading}deg); width: 22px; height: 22px;">
      <svg viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L9 9 2 12l7 1 1 7 2-6 2 6 1-7 7-1-7-3z"/>
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
