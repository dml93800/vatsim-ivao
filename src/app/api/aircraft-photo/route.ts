import { NextRequest, NextResponse } from "next/server";

const ICAO_TO_AIRCRAFT_NAME: Record<string, string> = {
  A318: "A318", A319: "A319", A320: "A320", A20N: "A320neo",
  A321: "A321", A21N: "A321neo", A332: "A330", A333: "A330",
  A339: "A330neo", A342: "A340", A343: "A340", A346: "A340",
  A359: "A350", A35K: "A350", A388: "A380",
  B735: "737", B736: "737", B737: "737", B738: "737",
  B739: "737", B38M: "737 MAX", B39M: "737 MAX",
  B752: "757", B753: "757", B762: "767", B763: "767", B764: "767",
  B772: "777", B773: "777", B77W: "777", B77L: "777",
  B788: "787", B789: "787", B78X: "787",
  B742: "747", B744: "747", B748: "747",
  E170: "E170", E175: "E175", E190: "E190", E195: "E195",
  AT72: "ATR 72", AT76: "ATR 72", AT45: "ATR 42",
  DH8D: "Dash 8", CRJ2: "CRJ200", CRJ7: "CRJ700", CRJ9: "CRJ900",
  C172: "C172", C208: "Caravan", MD11: "MD-11", DC10: "DC-10",
  F100: "Fokker 100", PC12: "PC-12",
};

const ICAO_TO_MANUFACTURER: Record<string, string> = {
  A318: "Airbus", A319: "Airbus", A320: "Airbus", A20N: "Airbus",
  A321: "Airbus", A21N: "Airbus", A332: "Airbus", A333: "Airbus",
  A339: "Airbus", A342: "Airbus", A343: "Airbus", A346: "Airbus",
  A359: "Airbus", A35K: "Airbus", A388: "Airbus",
  B735: "Boeing", B736: "Boeing", B737: "Boeing", B738: "Boeing",
  B739: "Boeing", B38M: "Boeing", B39M: "Boeing",
  B752: "Boeing", B753: "Boeing", B762: "Boeing", B763: "Boeing",
  B764: "Boeing", B772: "Boeing", B773: "Boeing", B77W: "Boeing",
  B77L: "Boeing", B788: "Boeing", B789: "Boeing", B78X: "Boeing",
  B742: "Boeing", B744: "Boeing", B748: "Boeing",
  E170: "Embraer", E175: "Embraer", E190: "Embraer", E195: "Embraer",
  AT72: "ATR", AT76: "ATR", AT45: "ATR",
  DH8D: "Bombardier", CRJ2: "Bombardier", CRJ7: "Bombardier", CRJ9: "Bombardier",
};

const AIRLINE_ICAO_TO_NAME: Record<string, string> = {
  AFR: "Air France", BAW: "British Airways", DLH: "Lufthansa",
  KLM: "KLM", EZY: "easyJet", RYR: "Ryanair", VLG: "Vueling",
  IBE: "Iberia", TAP: "TAP Air Portugal", SWR: "Swiss",
  AUA: "Austrian Airlines", THY: "Turkish Airlines", UAE: "Emirates",
  QTR: "Qatar Airways", ETD: "Etihad", SVA: "Saudia",
  AAL: "American Airlines", UAL: "United Airlines", DAL: "Delta Air Lines",
  SWA: "Southwest Airlines", JBU: "JetBlue", ACA: "Air Canada",
  WJA: "WestJet", QFA: "Qantas", ANZ: "Air New Zealand",
  JAL: "Japan Airlines", ANA: "All Nippon Airways",
  CES: "China Eastern", CCA: "Air China", CSN: "China Southern",
  SIA: "Singapore Airlines", CPA: "Cathay Pacific",
  KAL: "Korean Air", THA: "Thai Airways", GIA: "Garuda Indonesia",
  AIC: "Air India", ELY: "El Al", MSR: "EgyptAir",
  RAM: "Royal Air Maroc", DAH: "Air Algérie", ETH: "Ethiopian Airlines",
  NAX: "Norwegian", FIN: "Finnair", SAS: "Scandinavian Airlines",
  ICE: "Icelandair", WZZ: "Wizz Air", PGT: "Pegasus Airlines",
  AFL: "Aeroflot", LAN: "LATAM", AVA: "Avianca", GLO: "Gol",
  AZU: "Azul", AZA: "ITA Airways", BEL: "Brussels Airlines",
  VIR: "Virgin Atlantic", EIN: "Aer Lingus", MEA: "Middle East Airlines",
};

async function searchCommons(query: string): Promise<string | null> {
  try {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=10&format=json&origin=*`;
    const res = await fetch(apiUrl, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.query?.search ?? [];
    const file = results.find((r: { title: string }) =>
      r.title.match(/\.(jpg|jpeg|png)$/i) &&
      !r.title.toLowerCase().includes("logo") &&
      !r.title.toLowerCase().includes("icon") &&
      !r.title.toLowerCase().includes("silhouette") &&
      !r.title.toLowerCase().includes("diagram") &&
      !r.title.toLowerCase().includes("map") &&
      !r.title.toLowerCase().includes("seat") &&
      !r.title.toLowerCase().includes("interior") &&
      !r.title.toLowerCase().includes("cabin") &&
      !r.title.toLowerCase().includes("cockpit")
    );
    if (!file) return null;
    const fileName = file.title.replace("File:", "");
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=800`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const airline = searchParams.get("airline");

  if (!type) return NextResponse.json({ url: null });

  const icaoType = type.toUpperCase().slice(0, 4);
  const aircraftName = ICAO_TO_AIRCRAFT_NAME[icaoType];
  const manufacturer = ICAO_TO_MANUFACTURER[icaoType];
  const airlineName = airline ? AIRLINE_ICAO_TO_NAME[airline.toUpperCase()] : null;

  if (!aircraftName) return NextResponse.json({ url: null });

  // Vraie compagnie → photo avec livrée
  if (airlineName) {
    const url = await searchCommons(`${airlineName} ${aircraftName}`);
    if (url) return NextResponse.json({ url, isSilhouette: false });
  }

  // VA ou compagnie inconnue → livrée constructeur (house colors)
  const manufacturer_name = manufacturer ?? "Airbus";
  const url = await searchCommons(`${manufacturer_name} ${aircraftName} house colors`);
  if (url) return NextResponse.json({ url, isSilhouette: true });

  // Fallback → n'importe quelle photo du type
  const fallback = await searchCommons(`${manufacturer_name} ${aircraftName} flight`);
  return NextResponse.json({ url: fallback, isSilhouette: true });
}