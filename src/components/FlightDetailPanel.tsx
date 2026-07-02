"use client";

import { useEffect, useState } from "react";
import { Network, NormalizedPilot } from "@/types/flight";

const NETWORK_COLOR: Record<Network, string> = {
  vatsim: "#4da3ff",
  ivao: "#ff5c8a",
};

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

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

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
      className="absolute top-4 right-4 bottom-4 w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 z-[1100] flex flex-col font-mono text-chart-ink overflow-hidden"
      style={{ background: "linear-gradient(180deg,#18233a,#0f1828)", boxShadow: "0 30px 70px -20px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.1)" }}
    >
      {/* Photo de l'appareil en bandeau */}
      <div className="relative w-full h-[220px] bg-chart-paper border-b border-white/10 shrink-0">
        {aircraftPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={aircraftPhoto}
            alt={pilot.aircraftType ?? "Appareil"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-chart-ink-dim text-[11px] tracking-widest">
            PHOTO INDISPONIBLE
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center bg-black/40 border border-white/20 text-chart-ink text-lg hover:text-red-400 hover:border-red-400 transition-colors"
        >
          ✕
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 bg-chart-paper/80 backdrop-blur-sm flex items-center gap-3">
          {logoUrl && !logoFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={airline?.icao ?? ""}
              className="w-9 h-9 object-contain bg-white/90 rounded-sm p-1"
              onError={() => setLogoFailed(true)}
            />
          )}
          <span className="font-bold tracking-wider text-[22px]" style={{ color: accent }}>
            {pilot.callsign}
          </span>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="p-5 flex flex-col gap-5 text-[13px] overflow-y-auto flex-1">
        <div>
          <div className="text-chart-ink-dim text-[11px] tracking-widest mb-1">PILOTE</div>
          <div className="text-[14px]">{pilot.pilotName ?? "Inconnu"}</div>
        </div>

        <div>
          <div className="text-chart-ink-dim text-[11px] tracking-widest mb-1.5">ROUTE</div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3.5 bg-chart-paper-dark">
            <div className="text-center">
              <div className="text-[26px] font-black" style={{ color: accent }}>
                {pilot.departure ?? "????"}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center px-3">
              <span className="text-chart-ink-dim text-[11px]">{formatDuration(pilot.logonTime, now)}</span>
              <div className="w-full h-px bg-white/15 my-1.5" />
              <span className="text-chart-ink-dim text-[11px]">EN VOL</span>
            </div>
            <div className="text-center">
              <div className="text-[26px] font-black" style={{ color: accent }}>
                {pilot.arrival ?? "????"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-chart-ink-dim text-[11px] tracking-widest mb-1">ALTITUDE</div>
            <div className="text-[14px]">FL{Math.round(pilot.altitude / 100)}</div>
          </div>
          <div>
            <div className="text-chart-ink-dim text-[11px] tracking-widest mb-1">VITESSE</div>
            <div className="text-[14px]">{pilot.groundspeed} kt</div>
          </div>
          <div>
            <div className="text-chart-ink-dim text-[11px] tracking-widest mb-1">APPAREIL</div>
            <div className="text-[14px]">{pilot.aircraftType ?? "N/A"}</div>
          </div>
          <div>
            <div className="text-chart-ink-dim text-[11px] tracking-widest mb-1">RÉSEAU</div>
            <div className="text-[14px]" style={{ color: accent }}>{network.toUpperCase()}</div>
          </div>
        </div>

        {pilot.route && (
          <div>
            <div className="text-chart-ink-dim text-[11px] tracking-widest mb-1">PLAN DE VOL</div>
            <div className="text-[12px] text-chart-ink-dim leading-relaxed break-words">
              {pilot.route}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}