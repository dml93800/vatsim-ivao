import { NormalizedAtc, NormalizedPilot, NetworkSnapshot } from "@/types/flight";
import airportsData from "@/data/airports.json";

const VATSIM_DATA_URL = "https://data.vatsim.net/v3/vatsim-data.json";

// ICAO -> [lat, lon]. Le flux VATSIM v3 ne fournit PAS les coordonnées des
// contrôleurs directement, seulement leur callsign (ex: "LFPG_TWR"). On
// déduit donc la position depuis le code OACI préfixant le callsign.
const AIRPORTS: Record<string, [number, number]> = airportsData as unknown as Record<
  string,
  [number, number]
>;

/**
 * Extrait un code OACI probable depuis un callsign ATC VATSIM/IVAO.
 * Ex: "LFPG_TWR" -> "LFPG", "EHAM_N_APP" -> "EHAM", "SCT_CTR" -> null (pas un code OACI)
 */
function resolveAtcPosition(callsign: string): [number, number] | null {
  const prefix = callsign.split("_")[0];
  if (AIRPORTS[prefix]) {
    return AIRPORTS[prefix];
  }
  return null;
}

// Mapping du champ "facility" numérique VATSIM vers un type lisible
const FACILITY_MAP: Record<number, string> = {
  0: "OBS",
  1: "FSS",
  2: "DEL",
  3: "GND",
  4: "TWR",
  5: "APP",
  6: "CTR",
};

// Portée de couverture approximative (nm) selon le type de position,
// utilisée uniquement pour l'affichage du cercle sur la carte
const VISUAL_RANGE_MAP: Record<string, number> = {
  DEL: 5,
  GND: 5,
  TWR: 30,
  APP: 60,
  CTR: 150,
  FSS: 300,
  OBS: 0,
};

interface VatsimRawPilot {
  callsign: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  groundspeed: number;
  heading: number;
  transponder: string;
  flight_plan?: {
    aircraft_short?: string;
    departure?: string;
    arrival?: string;
    route?: string;
  } | null;
}

interface VatsimRawAtc {
  callsign: string;
  name: string;
  frequency: string;
  facility: number;
  visual_range: number;
}

interface VatsimRawData {
  pilots: VatsimRawPilot[];
  controllers: VatsimRawAtc[];
}

export async function fetchVatsimSnapshot(): Promise<NetworkSnapshot> {
  const res = await fetch(VATSIM_DATA_URL, {
    // VATSIM met à jour son flux toutes les 15s, inutile de spammer plus souvent
    next: { revalidate: 15 },
  });

  if (!res.ok) {
    throw new Error(`Erreur VATSIM API: ${res.status}`);
  }

  const raw: VatsimRawData = await res.json();

  const pilots: NormalizedPilot[] = raw.pilots
    .filter((p) => p.latitude !== 0 || p.longitude !== 0)
    .map((p) => ({
      callsign: p.callsign,
      network: "vatsim",
      latitude: p.latitude,
      longitude: p.longitude,
      heading: p.heading,
      altitude: p.altitude,
      groundspeed: p.groundspeed,
      aircraftType: p.flight_plan?.aircraft_short ?? null,
      departure: p.flight_plan?.departure ?? null,
      arrival: p.flight_plan?.arrival ?? null,
      route: p.flight_plan?.route ?? null,
      pilotName: p.name ?? null,
      transponder: p.transponder ?? null,
    }));

  const atc = raw.controllers
    .filter((c) => c.facility > 0) // on exclut les observateurs (facility 0)
    .map((c): NormalizedAtc | null => {
      const facilityType = FACILITY_MAP[c.facility] ?? "UNK";
      const position = resolveAtcPosition(c.callsign);
      if (!position) return null;
      return {
        callsign: c.callsign,
        network: "vatsim" as const,
        latitude: position[0],
        longitude: position[1],
        frequency: c.frequency ?? null,
        facilityType,
        controllerName: c.name ?? null,
        visualRange: c.visual_range || VISUAL_RANGE_MAP[facilityType] || 30,
      };
    })
    .filter((c): c is NormalizedAtc => c !== null);

  return {
    network: "vatsim",
    fetchedAt: new Date().toISOString(),
    pilots,
    atc,
  };
}
