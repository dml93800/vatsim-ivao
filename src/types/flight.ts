// Format commun, normalisé, indépendant du réseau (VATSIM ou IVAO)

export type Network = "vatsim" | "ivao";

export interface NormalizedPilot {
  callsign: string;
  network: Network;
  latitude: number;
  longitude: number;
  heading: number; // degrés, 0-359
  altitude: number; // pieds
  groundspeed: number; // noeuds
  aircraftType: string | null;
  departure: string | null; // ICAO
  arrival: string | null; // ICAO
  route: string | null;
  pilotName: string | null;
  transponder: string | null;
}

export interface NormalizedAtc {
  callsign: string;
  network: Network;
  latitude: number;
  longitude: number;
  frequency: string | null;
  facilityType: string; // ex: "DEL", "GND", "TWR", "APP", "CTR", "FSS"
  controllerName: string | null;
  visualRange: number | null; // nm, rayon de couverture pour affichage carte
}

export interface NetworkSnapshot {
  network: Network;
  fetchedAt: string; // ISO date
  pilots: NormalizedPilot[];
  atc: NormalizedAtc[];
}
