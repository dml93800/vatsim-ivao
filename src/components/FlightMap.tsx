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
import { Network, NetworkSnapshot, NormalizedPilot, NormalizedAtc } from "@/types/flight";

const REFRESH_INTERVAL_MS = 15_000;

const NETWORK_COLOR: Record<Network, string> = {
  vatsim: "#3cff8e",
  ivao: "#ffb13d",
};

function planeIcon(heading: number, network: Network) {
  const color = NETWORK_COLOR[network];
  const rotation = heading - 45;
  return L.divIcon({
    className: "plane-icon",
    html: `<div style="transform: rotate(${rotation}deg); width: 20px; height: 20px; filter: drop-shadow(0 0 3px ${color}aa);">
      <svg viewBox="0 0 122.88 122.88" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.63,105.75c0.01-4.03,2.3-7.97,6.03-12.38L1.09,79.73c-1.36-0.59-1.33-1.42-0.54-2.4l4.57-3.9
          c0.83-0.51,1.71-0.73,2.66-0.47l26.62,4.5l22.18-24.02L4.8,18.41c-1.31-0.77-1.42-1.64-0.07-2.65l7.47-5.96l67.5,18.97L99.64,7.45
          c6.69-5.79,13.19-8.38,18.18-7.15c2.75,0.68,3.72,1.5,4.57,4.08c1.65,5.06-0.91,11.86-6.96,18.86L94.11,43.18l18.97,67.5
          l-5.96,7.47c-1.01,1.34-1.88,1.23-2.65-0.07L69.43,66.31L45.41,88.48l4.5,26.62c0.26,0.94,0.05,1.82-0.47,2.66l-3.9,4.57
          c-0.97,0.79-1.81,0.82-2.4-0.54l-13.64-21.57c-4.43,3.74-8.37,6.03-12.42,6.03C16.71,106.24,16.63,106.11,16.63,105.75
          L16.63,105.75z"/>
      </svg>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function atcIcon(network: Network) {
  const color = NETWORK_COLOR[network];
  return L.divIcon({
    className: "atc-icon",
    html: `<div style="width: 13px; height: 13px; background: ${color}; border: 2px solid #ffffff; transform: rotate(45deg); box-shadow: 0 0 8px 2px ${color}cc;"></div>`,
    iconSize: [13, 13],
    iconAnchor: [6, 6],
  });
}

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
  const accent = NETWORK_COLOR[network];

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
    <div className="relative w-full h-full bg-scope-bg radar-grid">
      {loading && (
        <div
          className="absolute top-3 left-3 z-[1000] bg-scope-panel/90 border px-3 py-1.5 font-mono text-xs tracking-widest"
          style={{ borderColor: accent, color: accent }}
        >
          SYNC {network.toUpperCase()}...
        </div>
      )}
      {error && (
        <div className="absolute top-3 left-3 z-[1000] bg-scope-panel/95 text-red-400 px-3 py-1.5 font-mono text-xs border border-red-500/50 tracking-widest">
          ⚠ {error}
        </div>
      )}
      {snapshot && !error && (
        <div
          className="absolute top-3 left-3 z-[1000] bg-scope-panel/90 border px-3 py-1.5 font-mono text-xs tracking-widest flex gap-5"
          style={{ borderColor: accent }}
        >
          <span style={{ color: accent }}>
            ✈ {String(snapshot.pilots.length).padStart(4, "0")} VOLS
          </span>
          <span className="text-scope-dim">
            ◆ {String(snapshot.atc.length).padStart(3, "0")} ATC
          </span>
        </div>
      )}

      <div className="radar-sweep" style={{ background: `conic-gradient(from 0deg, ${accent}1a 0deg, ${accent}00 25deg, ${accent}00 360deg)` }} />

      {/* Teinte de couleur en surimpression : ambiance scope sans écraser
          le contraste des frontières/labels (contrairement à un filter CSS lourd) */}
      <div
        className="absolute inset-0 pointer-events-none z-[420]"
        style={{ backgroundColor: accent, opacity: 0.1, mixBlendMode: "color" }}
      />

      <MapContainer
        center={[20, 10]}
        zoom={3}
        minZoom={2}
        worldCopyJump
        className="w-full h-full"
        style={{ background: "transparent" }}
      >
        <FitBoundsOnce />
        <TileLayer
          className="scope-tiles"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {snapshot?.pilots.map((pilot) => (
          <PilotMarker key={pilot.callsign} pilot={pilot} network={network} />
        ))}

        {snapshot?.atc.map((atc) => (
          <AtcMarker key={atc.callsign} atc={atc} network={network} />
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
  const accent = NETWORK_COLOR[network];
  return (
    <Marker
      position={[pilot.latitude, pilot.longitude]}
      icon={planeIcon(pilot.heading, network)}
    >
      <Popup>
        <div
          className="font-mono text-[11px] bg-scope-panel border-l-4 px-3 py-2 w-[210px] text-scope-text"
          style={{ borderColor: accent }}
        >
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-bold tracking-wider" style={{ color: accent }}>
              {pilot.callsign}
            </span>
            <span className="text-scope-dim text-[10px]">{network.toUpperCase()}</span>
          </div>
          <div className="text-scope-dim text-[10px] mb-1.5 truncate">
            {pilot.pilotName ?? "PILOTE INCONNU"}
          </div>
          <div className="flex justify-between border-t border-scope-line pt-1.5">
            <span>{pilot.departure ?? "????"}</span>
            <span className="text-scope-dim">→</span>
            <span>{pilot.arrival ?? "????"}</span>
          </div>
          <div className="flex justify-between text-scope-dim mt-1">
            <span>{pilot.aircraftType ?? "TYPE N/A"}</span>
            <span>
              FL{Math.round(pilot.altitude / 100)} · {pilot.groundspeed}KT
            </span>
          </div>
          {pilot.route && (
            <div className="text-scope-dim text-[10px] mt-1 truncate border-t border-scope-line pt-1">
              {pilot.route}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

function AtcMarker({ atc, network }: { atc: NormalizedAtc; network: Network }) {
  const accent = NETWORK_COLOR[network];
  return (
    <>
      <Marker position={[atc.latitude, atc.longitude]} icon={atcIcon(network)}>
        <Popup>
          <div
            className="font-mono text-[11px] bg-scope-panel border-l-4 px-3 py-2 w-[190px] text-scope-text"
            style={{ borderColor: accent }}
          >
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-bold tracking-wider" style={{ color: accent }}>
                {atc.callsign}
              </span>
              <span className="text-scope-dim text-[10px]">{atc.facilityType}</span>
            </div>
            <div className="text-scope-dim text-[10px] truncate">
              {atc.controllerName ?? "—"}
            </div>
            <div className="border-t border-scope-line pt-1 mt-1">
              FREQ {atc.frequency ?? "—"}
            </div>
          </div>
        </Popup>
      </Marker>
      {atc.visualRange ? (
        <Circle
          center={[atc.latitude, atc.longitude]}
          radius={atc.visualRange * 1852}
          pathOptions={{
            color: accent,
            weight: 1,
            opacity: 0.4,
            dashArray: "4 6",
            fillOpacity: 0.03,
          }}
        />
      ) : null}
    </>
  );
}