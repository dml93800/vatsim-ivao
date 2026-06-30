"use client";

import { useEffect, useState } from "react";
import { Network, NormalizedPilot } from "@/types/flight";

const NETWORK_COLOR: Record<Network, string> = {
  vatsim: "#3cff8e",
  ivao: "#ffb13d",
};

// pics.avs.io attend le code IATA (2 lettres), alors que le callsign VATSIM/IVAO
// donne le code ICAO (3 lettres). Table de correspondance pour les compagnies les
// plus fréquentes sur le réseau ; complétable au besoin.
const ICAO_TO_IATA: Record<string, string> = {
  AFR: "AF", // Air France
  BAW: "BA", // British Airways
  DLH: "LH", // Lufthansa
  KLM: "KL", // KLM
  EZY: "U2", // easyJet
  RYR: "FR", // Ryanair
  VLG: "VY", // Vueling
  IBE: "IB", // Iberia
  TAP: "TP", // TAP Portugal
  SWR: "LX", // Swiss
  AUA: "OS", // Austrian
  THY: "TK", // Turkish Airlines
  UAE: "EK", // Emirates
  QTR: "QR", // Qatar Airways
  ETD: "EY", // Etihad
  SVA: "SV", // Saudia
  AAL: "AA", // American Airlines
  UAL: "UA", // United
  DAL: "DL", // Delta
  SWA: "WN", // Southwest
  JBU: "B6", // JetBlue
  ACA: "AC", // Air Canada
  WJA: "WS", // WestJet
  QFA: "QF", // Qantas
  ANZ: "NZ", // Air New Zealand
  JAL: "JL", // Japan Airlines
  ANA: "NH", // All Nippon Airways
  CES: "MU", // China Eastern
  CCA: "CA", // Air China
  CSN: "CZ", // China Southern
  SIA: "SQ", // Singapore Airlines
  CPA: "CX", // Cathay Pacific
  KAL: "KE", // Korean Air
  THA: "TG", // Thai Airways
  GIA: "GA", // Garuda Indonesia
  AIC: "AI", // Air India
  ELY: "LY", // El Al
  MSR: "MS", // EgyptAir
  RAM: "AT", // Royal Air Maroc
  DAH: "AH", // Air Algérie
  TUI: "X3", // TUI fly
  NAX: "DY", // Norwegian
  FIN: "AY", // Finnair
  SAS: "SK", // SAS
  ICE: "FI", // Icelandair
  AZA: "AZ", // ITA Airways
  WZZ: "W6", // Wizz Air
  PGT: "PC", // Pegasus
  AFL: "SU", // Aeroflot
  LAN: "LA", // LATAM
  AVA: "AV", // Avianca
  GLO: "G3", // Gol
  AZU: "AD", // Azul
};

// Déduit le code ICAO compagnie depuis le callsign (ex: "AFR1234" -> "AFR"),
// puis le convertit en IATA via la table ci-dessus
function airlineLogoCode(callsign: string): { icao: string; iata: string | null } | null {
  const match = callsign.match(/^[A-Za-z]{2,4}/);
  if (!match) return null;
  const icao = match[0].toUpperCase();
  return { icao, iata: ICAO_TO_IATA[icao] ?? null };
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

  const airline = airlineLogoCode(pilot.callsign);
  const logoUrl = airline?.iata ? `https://pics.avs.io/200/200/${airline.iata}.png` : null;

  // Durée de vol mise à jour chaque minute pour rester live
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Recherche de la photo de l'appareil via notre route API (croise compagnie + type)
  useEffect(() => {
    setAircraftPhoto(null);
    if (!pilot.aircraftType) return;
    let cancelled = false;
    const params = new URLSearchParams({ type: pilot.aircraftType });
    if (airline?.icao) params.set("airline", airline.icao);
    fetch(`/api/aircraft-photo?${params.toString()}`)
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
  }, [pilot.aircraftType, airline?.icao]);

  useEffect(() => {
    setLogoFailed(false);
  }, [pilot.callsign]);

  return (
    <div
      className="absolute top-0 right-0 h-full w-[440px] max-w-[92vw] bg-scope-panel border-l z-[1100] flex flex-col font-mono text-scope-text overflow-y-auto"
      style={{ borderColor: accent }}
    >
      {/* Photo de l'appareil en bandeau, ou un fond neutre si pas trouvée */}
      <div className="relative w-full h-[220px] bg-scope-bg border-b border-scope-line shrink-0">
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
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-scope-bg/80 border border-scope-line text-scope-text text-lg hover:text-red-400 hover:border-red-400 transition-colors"
        >
          ✕
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 bg-scope-bg/80 backdrop-blur-sm flex items-center gap-3">
          {logoUrl && !logoFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={airline?.icao ?? ""}
              className="w-9 h-9 object-contain bg-white/90 rounded-sm p-1"
              onError={() => setLogoFailed(true)}
            />
          )}
          <span className="font-bold tracking-wider text-lg" style={{ color: accent }}>
            {pilot.callsign}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5 text-[13px]">
        <div>
          <div className="text-scope-dim text-[11px] tracking-widest mb-1">PILOTE</div>
          <div className="text-[14px]">{pilot.pilotName ?? "Inconnu"}</div>
        </div>

        <div>
          <div className="text-scope-dim text-[11px] tracking-widest mb-1.5">ROUTE</div>
          <div className="flex items-center justify-between bg-scope-bg border border-scope-line px-4 py-3">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: accent }}>
                {pilot.departure ?? "????"}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center px-3">
              <span className="text-scope-dim text-[11px]">{formatDuration(pilot.logonTime, now)}</span>
              <div className="w-full h-px bg-scope-line my-1.5" />
              <span className="text-scope-dim text-[11px]">EN VOL</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: accent }}>
                {pilot.arrival ?? "????"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-scope-dim text-[11px] tracking-widest mb-1">ALTITUDE</div>
            <div className="text-[14px]">FL{Math.round(pilot.altitude / 100)}</div>
          </div>
          <div>
            <div className="text-scope-dim text-[11px] tracking-widest mb-1">VITESSE</div>
            <div className="text-[14px]">{pilot.groundspeed} kt</div>
          </div>
          <div>
            <div className="text-scope-dim text-[11px] tracking-widest mb-1">APPAREIL</div>
            <div className="text-[14px]">{pilot.aircraftType ?? "N/A"}</div>
          </div>
          <div>
            <div className="text-scope-dim text-[11px] tracking-widest mb-1">RÉSEAU</div>
            <div className="text-[14px]" style={{ color: accent }}>{network.toUpperCase()}</div>
          </div>
        </div>

        {pilot.route && (
          <div>
            <div className="text-scope-dim text-[11px] tracking-widest mb-1">PLAN DE VOL</div>
            <div className="text-[12px] text-scope-dim leading-relaxed break-words">
              {pilot.route}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}