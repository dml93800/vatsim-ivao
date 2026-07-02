import { NormalizedAtc, NormalizedPilot, NetworkSnapshot } from "@/types/flight";
import airportsData from "@/data/airports.json";

const IVAO_DATA_URL = "https://api.ivao.aero/v2/tracker/whazzup";

const AIRPORTS: Record<string, [number, number]> = airportsData as unknown as Record<string, [number, number]>;

function resolveAtcPosition(callsign: string): [number, number] | null {
  const prefix = callsign.split("_")[0];
  if (AIRPORTS[prefix]) return AIRPORTS[prefix];
  return null;
}

const VISUAL_RANGE_MAP: Record<string, number> = {
  DEL: 5, GND: 5, TWR: 30, APP: 60, CTR: 150, FSS: 300, OBS: 0,
};

interface IvaoAircraft {
  icaoCode?: string | null;
  model?: string | null;
}

interface IvaoFlightPlan {
  departureId?: string | null;
  arrivalId?: string | null;
  aircraftId?: string | null;
  route?: string | null;
  aircraft?: IvaoAircraft | null;
}

interface IvaoLastTrack {
  latitude: number;
  longitude: number;
  altitude: number;
  groundSpeed: number;
  heading: number;
  transponder: number | string;
  timestamp: string;
}

interface IvaoPilot {
  callsign: string;
  userId: number;
  lastTrack?: IvaoLastTrack | null;
  flightPlan?: IvaoFlightPlan | null;
  createdAt?: string | null;
}

interface IvaoAtcSession {
  frequency?: number | null;
  position?: string | null;
}

interface IvaoAtc {
  callsign: string;
  userId: number;
  atcSession?: IvaoAtcSession | null;
  lastTrack?: {
    latitude: number;
    longitude: number;
  } | null;
}

interface IvaoWhazzup {
  clients?: {
    pilots?: IvaoPilot[];
    atcs?: IvaoAtc[];
  };
}

export async function fetchIvaoSnapshot(): Promise<NetworkSnapshot> {
  const res = await fetch(IVAO_DATA_URL, {
    next: { revalidate: 15 },
  });

  if (!res.ok) {
    throw new Error(`Erreur IVAO API: ${res.status}`);
  }

  const raw: IvaoWhazzup = await res.json();

  const rawPilots = raw.clients?.pilots ?? [];
  const rawAtcs = raw.clients?.atcs ?? [];

  const pilots: NormalizedPilot[] = rawPilots
    .filter((p) => p.lastTrack && (p.lastTrack.latitude !== 0 || p.lastTrack.longitude !== 0))
    .map((p) => ({
      callsign: p.callsign,
      network: "ivao" as const,
      latitude: p.lastTrack!.latitude,
      longitude: p.lastTrack!.longitude,
      heading: p.lastTrack!.heading,
      altitude: p.lastTrack!.altitude,
      groundspeed: p.lastTrack!.groundSpeed,
      // Priorité à aircraft.icaoCode (type précis), fallback sur aircraftId
      aircraftType: p.flightPlan?.aircraft?.icaoCode ?? p.flightPlan?.aircraftId ?? null,
      departure: p.flightPlan?.departureId ?? null,
      arrival: p.flightPlan?.arrivalId ?? null,
      route: p.flightPlan?.route ?? null,
      pilotName: `IVAO #${p.userId}`,
      transponder: String(p.lastTrack!.transponder) ?? null,
      logonTime: p.createdAt ?? null,
    }));

  const atc: NormalizedAtc[] = rawAtcs
    .map((c): NormalizedAtc | null => {
      // Utilise la position du lastTrack si dispo, sinon résout depuis le callsign
      let lat: number, lon: number;
      if (c.lastTrack?.latitude && c.lastTrack?.longitude) {
        lat = c.lastTrack.latitude;
        lon = c.lastTrack.longitude;
      } else {
        const position = resolveAtcPosition(c.callsign);
        if (!position) return null;
        [lat, lon] = position;
      }

      // Position type depuis atcSession, sinon parse le callsign
      const facilityType = c.atcSession?.position ??
        c.callsign.split("_").pop() ?? "UNK";

      return {
        callsign: c.callsign,
        network: "ivao" as const,
        latitude: lat,
        longitude: lon,
        // Fréquence en number → string avec 3 décimales
        frequency: c.atcSession?.frequency != null
          ? c.atcSession.frequency.toFixed(3)
          : null,
        facilityType,
        controllerName: `IVAO #${c.userId}`,
        visualRange: VISUAL_RANGE_MAP[facilityType] ?? 30,
      };
    })
    .filter((c): c is NormalizedAtc => c !== null);

  return {
    network: "ivao",
    fetchedAt: new Date().toISOString(),
    pilots,
    atc,
  };
}