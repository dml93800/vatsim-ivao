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
import FlightDetailPanel from "./FlightDetailPanel";

const REFRESH_INTERVAL_MS = 15_000; // calé sur la fréquence de mise à jour VATSIM

const NETWORK_COLOR: Record<Network, string> = {
  vatsim: "#1f4e79", // bleu carte aéronautique
  ivao: "#8b2f4b", // magenta carte aéronautique
};

// Icône avion en SVG, tournée via transform CSS selon le heading
function planeIcon(heading: number, network: Network) {
  const color = NETWORK_COLOR[network];
  // Le SVG source pointe vers le NE (~45°) par défaut, d'où l'offset -45
  // pour que heading=0 (nord) affiche bien le nez de l'avion vers le haut
  const rotation = heading - 45;
  return L.divIcon({
    className: "plane-icon",
    html: `<div style="transform: rotate(${rotation}deg); width: 18px; height: 18px;">
      <svg viewBox="0 0 122.88 122.88" fill="${color}" stroke="#f3e9d2" stroke-width="4" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.63,105.75c0.01-4.03,2.3-7.97,6.03-12.38L1.09,79.73c-1.36-0.59-1.33-1.42-0.54-2.4l4.57-3.9
          c0.83-0.51,1.71-0.73,2.66-0.47l26.62,4.5l22.18-24.02L4.8,18.41c-1.31-0.77-1.42-1.64-0.07-2.65l7.47-5.96l67.5,18.97L99.64,7.45
          c6.69-5.79,13.19-8.38,18.18-7.15c2.75,0.68,3.72,1.5,4.57,4.08c1.65,5.06-0.91,11.86-6.96,18.86L94.11,43.18l18.97,67.5
          l-5.96,7.47c-1.01,1.34-1.88,1.23-2.65-0.07L69.43,66.31L45.41,88.48l4.5,26.62c0.26,0.94,0.05,1.82-0.47,2.66l-3.9,4.57
          c-0.97,0.79-1.81,0.82-2.4-0.54l-13.64-21.57c-4.43,3.74-8.37,6.03-12.42,6.03C16.71,106.24,16.63,106.11,16.63,105.75
          L16.63,105.75z"/>
      </svg>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// Position ATC : icône tour de contrôle, ancrée par sa base
function atcIcon(network: Network) {
  const color = NETWORK_COLOR[network];
  return L.divIcon({
    className: "atc-icon",
    html: `<div style="width: 16px; height: 16px;">
      <svg viewBox="0 0 485 485" fill="${color}" stroke="#f3e9d2" stroke-width="10" xmlns="http://www.w3.org/2000/svg">
        <path d="M450.463,211.887h-94.811l23.411-115.613H257.5V0h-30v96.274H105.938l23.411,115.613H34.537L64.022,357.5h121.925V485h30
          V357.5h53.105V485h30V357.5h121.925L450.463,211.887z M257.5,241.887h63.215l-8.668,85.613H257.5V241.887z M227.5,327.5h-54.547
          l-8.668-85.613H227.5V327.5z M142.621,126.274h199.758l-17.335,85.613H159.956L142.621,126.274z M71.221,241.887h62.911
          l8.668,85.613H88.557L71.221,241.887z M396.443,327.5h-54.242l8.668-85.613h62.911L396.443,327.5z"/>
      </svg>
    </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
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
  const [selectedPilot, setSelectedPilot] = useState<NormalizedPilot | null>(null);
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
        setSelectedPilot((prev) => {
          if (!prev) return prev;
          const updated = (data as NetworkSnapshot).pilots.find(
            (p) => p.callsign === prev.callsign
          );
          return updated ?? null;
        });
      }
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => {
    setLoading(true);
    setSelectedPilot(null);
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="relative w-full h-full bg-chart-paper chart-grid">
      {loading && (
        <div
          className="absolute top-3 left-3 z-[1000] bg-chart-paper-dark border px-3 py-1.5 font-mono text-xs tracking-widest"
          style={{ borderColor: accent, color: accent }}
        >
          Synchronisation {network.toUpperCase()}...
        </div>
      )}
      {error && (
        <div className="absolute top-3 left-3 z-[1000] bg-chart-paper-dark text-red-700 px-3 py-1.5 font-mono text-xs border border-red-700/50 tracking-widest">
          ⚠ {error}
        </div>
      )}
      {snapshot && !error && (
        <div
          className="absolute top-3 left-3 z-[1000] bg-chart-paper-dark border px-3 py-1.5 font-mono text-xs tracking-widest flex gap-5"
          style={{ borderColor: accent }}
        >
          <span style={{ color: accent }}>
            ✈ {String(snapshot.pilots.length).padStart(4, "0")} VOLS
          </span>
          <span className="text-chart-ink-dim">
            ◆ {String(snapshot.atc.length).padStart(3, "0")} ATC
          </span>
        </div>
      )}

      <MapContainer
        center={[20, 10]}
        zoom={3}
        minZoom={2}
        worldCopyJump
        className="w-full h-full"
        style={{ background: "#f3e9d2" }}
      >
        <FitBoundsOnce />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {snapshot?.pilots.map((pilot) => (
          <PilotMarker
            key={pilot.callsign}
            pilot={pilot}
            network={network}
            onSelect={setSelectedPilot}
          />
        ))}

        {snapshot?.atc.map((atc) => (
          <AtcMarker key={atc.callsign} atc={atc} network={network} />
        ))}
      </MapContainer>

      {selectedPilot && (
        <FlightDetailPanel
          pilot={selectedPilot}
          network={network}
          onClose={() => setSelectedPilot(null)}
        />
      )}
    </div>
  );
}

function PilotMarker({
  pilot,
  network,
  onSelect,
}: {
  pilot: NormalizedPilot;
  network: Network;
  onSelect: (pilot: NormalizedPilot) => void;
}) {
  const accent = NETWORK_COLOR[network];
  return (
    <Marker
      position={[pilot.latitude, pilot.longitude]}
      icon={planeIcon(pilot.heading, network)}
      eventHandlers={{ click: () => onSelect(pilot) }}
    >
      <Popup>
        <div
          className="font-mono text-[11px] bg-chart-paper-dark border-l-4 px-3 py-2 w-[180px] text-chart-ink"
          style={{ borderColor: accent }}
        >
          <div className="font-bold tracking-wider mb-1" style={{ color: accent }}>
            {pilot.callsign}
          </div>
          <div className="flex justify-between">
            <span>{pilot.departure ?? "????"}</span>
            <span className="text-chart-ink-dim">→</span>
            <span>{pilot.arrival ?? "????"}</span>
          </div>
          <div className="text-chart-ink-dim text-[10px] mt-1">
            Clic sur l&apos;avion pour le détail complet
          </div>
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
            className="font-mono text-[11px] bg-chart-paper-dark border-l-4 px-3 py-2 w-[190px] text-chart-ink"
            style={{ borderColor: accent }}
          >
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-bold tracking-wider" style={{ color: accent }}>
                {atc.callsign}
              </span>
              <span className="text-chart-ink-dim text-[10px]">{atc.facilityType}</span>
            </div>
            <div className="text-chart-ink-dim text-[10px] truncate">
              {atc.controllerName ?? "—"}
            </div>
            <div className="border-t border-chart-line pt-1 mt-1">
              FREQ {atc.frequency ?? "—"}
            </div>
          </div>
        </Popup>
      </Marker>
      {atc.visualRange ? (
        <Circle
          center={[atc.latitude, atc.longitude]}
          radius={atc.visualRange * 1852} // nm -> mètres
          pathOptions={{
            color: accent,
            weight: 1,
            opacity: 0.5,
            dashArray: "4 6",
            fillOpacity: 0.04,
          }}
        />
      ) : null}
    </>
  );
}