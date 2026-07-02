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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const airline = searchParams.get("airline");

  if (!type) return NextResponse.json({ url: null });

  const icaoType = type.toUpperCase().slice(0, 4);
  const aircraftName = ICAO_TO_AIRCRAFT_NAME[icaoType];
  const airlineName = airline ? AIRLINE_ICAO_TO_NAME[airline.toUpperCase()] : null;

  if (!aircraftName) return NextResponse.json({ url: null });

  // Recherche avec compagnie + type si dispo, sinon juste le type
  const searchTerm = airlineName
    ? `${airlineName} ${aircraftName}`
    : `Airbus ${aircraftName}`;

  try {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&srlimit=10&format=json&origin=*`;

    const res = await fetch(apiUrl, { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.json({ url: null });

    const data = await res.json();
    const results = data.query?.search ?? [];

    // Trouve le premier fichier jpg/png pertinent
    const file = results.find((r: { title: string }) =>
      r.title.match(/\.(jpg|jpeg|png)$/i) &&
      !r.title.toLowerCase().includes("logo") &&
      !r.title.toLowerCase().includes("icon") &&
      !r.title.toLowerCase().includes("silhouette") &&
      !r.title.toLowerCase().includes("diagram") &&
      !r.title.toLowerCase().includes("map") &&
      !r.title.toLowerCase().includes("seat") &&
      !r.title.toLowerCase().includes("interior")
    );

    if (!file) return NextResponse.json({ url: null });

    const fileName = file.title.replace("File:", "");
    const thumbUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=800`;

    return NextResponse.json({ url: thumbUrl });
  } catch {
    return NextResponse.json({ url: null });
  }
}  