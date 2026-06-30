"use client";

import { useEffect, useState } from "react";
import { Network, NormalizedPilot } from "@/types/flight";

const NETWORK_COLOR: Record<Network, string> = {
  vatsim: "#3cff8e",
  ivao: "#ffb13d",
};

// Déduit le code OACI de la compagnie depuis le callsign (ex: "AFR1234" -> "AFR")
function airlineIcaoFromCallsign(callsign: string): string | null {
  const match = callsign.match(/^[A-Za-z]{2,4}/);
  return match ? match[0].toUpperCase() : null;
}

function formatDuration(logonTime: string | null, now: number): string {
  if (!logonTime) return "—";
  const start = new Date(logonTime).getTime();
  if (Number.isNaN(start)) return "—";
  const diffMin = Math.max(0, Math.floor((now - start) / 60000));
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function FlightDetailPanel({
  pilot,
  network,
  onClose,
}: {
  pilot: NormalizedPilot;
  network: Network;
  onClose: () => void;
}) {
  const accent = NETWORK_COLOR[network];
  const [now, setNow] = useState(() => Date.now());
  const [aircraftPhoto, setAircraftPhoto] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  const airlineIcao = airlineIcaoFromCallsign(pilot.callsign);
  const logoUrl = airlineIcao ? `https://pics.avs.io/200/200/${airlineIcao}.png` : null;

  // Durée de vol mise à jour chaque minute pour rester live
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Recherche de la photo de l'appareil via notre route API (Wikimedia Commons)
  useEffect(() => {
    setAircraftPhoto(null);
    if (!pilot.aircraftType) return;
    let cancelled = false;
    fetch(`/api/aircraft-photo?type=${encodeURIComponent(pilot.aircraftType)}`)
      .then((res) => (res.ok ? res.json() : { url: null }))
      .then((data) => {
        if (!cancelled) setAircraftPhoto(data.url ?? null);
      })
      .catch(() => {
        if (!cancelled) setAircraftPhoto(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pilot.aircraftType]);

  useEffect(() => {
    setLogoFailed(false);
  }, [pilot.callsign]);

  return (
    <div
      className="absolute top-0 right-0 h-full w-[320px] max-w-[90vw] bg-scope-panel border-l z-[1100] flex flex-col font-mono text-scope-text overflow-y-auto"
      style={{ borderColor: accent }}
    >
      {/* Photo de l'appareil en bandeau, ou un fond neutre si pas trouvée */}
      <div className="relative w-full h-[160px] bg-scope-bg border-b border-scope-line shrink-0">
        {aircraftPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={aircraftPhoto}
            alt={pilot.aircraftType ?? "Appareil"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-scope-dim text-[11px] tracking-widest">
            PHOTO INDISPONIBLE
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-scope-bg/80 border border-scope-line text-scope-text hover:text-red-400 hover:border-red-400 transition-colors"
        >
          ✕
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-scope-bg/80 backdrop-blur-sm flex items-center gap-2">
          {logoUrl && !logoFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={airlineIcao ?? ""}
              className="w-6 h-6 object-contain bg-white/90 rounded-sm p-0.5"
              onError={() => setLogoFailed(true)}
            />
          )}
          <span className="font-bold tracking-wider text-sm" style={{ color: accent }}>
            {pilot.callsign}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 text-[12px]">
        <div>
          <div className="text-scope-dim text-[10px] tracking-widest mb-0.5">PILOTE</div>
          <div>{pilot.pilotName ?? "Inconnu"}</div>
        </div>

        <div>
          <div className="text-scope-dim text-[10px] tracking-widest mb-1">ROUTE</div>
          <div className="flex items-center justify-between bg-scope-bg border border-scope-line px-3 py-2">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: accent }}>
                {pilot.departure ?? "????"}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center px-2">
              <span className="text-scope-dim text-[10px]">{formatDuration(pilot.logonTime, now)}</span>
              <div className="w-full h-px bg-scope-line my-1" />
              <span className="text-scope-dim text-[10px]">EN VOL</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: accent }}>
                {pilot.arrival ?? "????"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-scope-dim text-[10px] tracking-widest mb-0.5">ALTITUDE</div>
            <div>FL{Math.round(pilot.altitude / 100)}</div>
          </div>
          <div>
            <div className="text-scope-dim text-[10px] tracking-widest mb-0.5">VITESSE</div>
            <div>{pilot.groundspeed} kt</div>
          </div>
          <div>
            <div className="text-scope-dim text-[10px] tracking-widest mb-0.5">APPAREIL</div>
            <div>{pilot.aircraftType ?? "N/A"}</div>
          </div>
          <div>
            <div className="text-scope-dim text-[10px] tracking-widest mb-0.5">RÉSEAU</div>
            <div style={{ color: accent }}>{network.toUpperCase()}</div>
          </div>
        </div>

        {pilot.route && (
          <div>
            <div className="text-scope-dim text-[10px] tracking-widest mb-0.5">PLAN DE VOL</div>
            <div className="text-[11px] text-scope-dim leading-relaxed break-words">
              {pilot.route}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}