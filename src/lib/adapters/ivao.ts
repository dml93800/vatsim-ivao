import { NormalizedAtc, NormalizedPilot, NetworkSnapshot } from "@/types/flight";
import airportsData from "@/data/airports.json";

const IVAO_DATA_URL = "https://api.ivao.aero/v2/tracker/whazzup";

// ICAO -> [lat, lon] pour résoudre la position des contrôleurs
const AIRPORTS: Record<string, [number, number]> = airportsData as unknown as Record<string, [number, number]>;

function resolveAtcPosition(callsign: string): [number, number] | null {
  const prefix = callsign.split("_")[0];
  if (AIRPORTS[prefix]) return AIRPORTS[prefix];
  return null;
}

const VISUAL_RANGE_MAP: Record<string, number> = {
  DEL: 5,
  GND: 5,
  TWR: 30,
  APP: 60,
  CTR: 150,
  FSS: 300,
  OBS: 0,
};

interface IvaoLastTrack {
  latitude: number;
  longitude: number;
  altitude: number;
  groundSpeed: number;
  heading: number;
  transponder: string;
  timestamp: string;
}

interface IvaoFlightPlan {
  departureId?: string | null;
  arrivalId?: string | null;
  aircraftId?: string | null;
  route?: string | null;
}

interface IvaoPilot {
  callsign: string;
  userId: number;
  lastTrack?: IvaoLastTrack | null;
  flightPlan?: IvaoFlightPlan | null;
  createdAt?: string | null;
  user?: { firstName?: string; lastName?: string } | null;
}

interface IvaoAtc {
  callsign: string;
  userId: number;
  rating?: number | null;
  atcSession?: {
    frequency?: string | null;
    position?: string | null;
  } | null;
  user?: { firstName?: string; lastName?: string } | null;
}

interface IvaoWhazzup {
  clients?: {
    pilots?: IvaoPilot[];
    atcs?: IvaoAtc[];
  };
}

export async function fetchIvaoSnapshot(): Promise<NetworkSnapshot> {
  const res = await fetch(IVAO_DATA_URL, {
    // IVAO met à jour toutes les 15s
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
      aircraftType: p.flightPlan?.aircraftId ?? null,
      departure: p.flightPlan?.departureId ?? null,
      arrival: p.flightPlan?.arrivalId ?? null,
      route: p.flightPlan?.route ?? null,
      pilotName: p.user ? `${p.user.firstName ?? ""} ${p.user.lastName ?? ""}`.trim() : null,
      transponder: p.lastTrack!.transponder ?? null,
      logonTime: p.createdAt ?? null,
    }));

  const atc: NormalizedAtc[] = rawAtcs
    .map((c): NormalizedAtc | null => {
      const position = resolveAtcPosition(c.callsign);
      if (!position) return null;
      const callsignParts = c.callsign.split("_");
      const facilityType = callsignParts[callsignParts.length - 1] ?? "UNK";
      return {
        callsign: c.callsign,
        network: "ivao" as const,
        latitude: position[0],
        longitude: position[1],
        frequency: c.atcSession?.frequency ?? null,
        facilityType,
        controllerName: c.user ? `${c.user.firstName ?? ""} ${c.user.lastName ?? ""}`.trim() : null,
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