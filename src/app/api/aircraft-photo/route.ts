import { NextRequest, NextResponse } from "next/server";

// Mapping des codes ICAO courts (ceux renvoyés par VATSIM/IVAO dans le plan
// de vol, ex: "A320", "B738") vers un nom de recherche précis
const TYPE_NAME_MAP: Record<string, string> = {
  A20N: "Airbus A320neo",
  A21N: "Airbus A321neo",
  A319: "Airbus A319",
  A320: "Airbus A320",
  A321: "Airbus A321",
  A332: "Airbus A330-200",
  A333: "Airbus A330-300",
  A339: "Airbus A330neo",
  A343: "Airbus A340-300",
  A359: "Airbus A350-900",
  A35K: "Airbus A350-1000",
  A388: "Airbus A380",
  B737: "Boeing 737",
  B738: "Boeing 737-800",
  B739: "Boeing 737-900",
  B38M: "Boeing 737 MAX 8",
  B39M: "Boeing 737 MAX 9",
  B744: "Boeing 747-400",
  B748: "Boeing 747-8",
  B752: "Boeing 757-200",
  B763: "Boeing 767-300",
  B772: "Boeing 777-200",
  B773: "Boeing 777-300",
  B77W: "Boeing 777-300ER",
  B788: "Boeing 787-8",
  B789: "Boeing 787-9",
  B78X: "Boeing 787-10",
  CRJ9: "Bombardier CRJ900",
  E170: "Embraer E170",
  E190: "Embraer E190",
  E195: "Embraer E195",
  AT76: "ATR 72",
  AT72: "ATR 72",
  DH8D: "Bombardier Dash 8 Q400",
};

// Code ICAO compagnie -> nom complet, utilisé pour cibler une photo avec la
// bonne livrée plutôt qu'une photo générique du type d'appareil
const AIRLINE_NAME_MAP: Record<string, string> = {
  AFR: "Air France", BAW: "British Airways", DLH: "Lufthansa", KLM: "KLM",
  EZY: "easyJet", RYR: "Ryanair", VLG: "Vueling", IBE: "Iberia",
  TAP: "TAP Portugal", SWR: "Swiss International Air Lines", AUA: "Austrian Airlines",
  THY: "Turkish Airlines", UAE: "Emirates", QTR: "Qatar Airways", ETD: "Etihad Airways",
  SVA: "Saudia", AAL: "American Airlines", UAL: "United Airlines", DAL: "Delta Air Lines",
  SWA: "Southwest Airlines", JBU: "JetBlue", ACA: "Air Canada", WJA: "WestJet",
  QFA: "Qantas", ANZ: "Air New Zealand", JAL: "Japan Airlines", ANA: "All Nippon Airways",
  CES: "China Eastern Airlines", CCA: "Air China", CSN: "China Southern Airlines",
  SIA: "Singapore Airlines", CPA: "Cathay Pacific", KAL: "Korean Air", THA: "Thai Airways",
  GIA: "Garuda Indonesia", AIC: "Air India", ELY: "El Al", MSR: "EgyptAir",
  RAM: "Royal Air Maroc", DAH: "Air Algerie", TUI: "TUI fly", NAX: "Norwegian Air Shuttle",
  FIN: "Finnair", SAS: "Scandinavian Airlines", ICE: "Icelandair", AZA: "ITA Airways",
  WZZ: "Wizz Air", PGT: "Pegasus Airlines", AFL: "Aeroflot", LAN: "LATAM Airlines",
  AVA: "Avianca", GLO: "Gol Transportes Aereos", AZU: "Azul Brazilian Airlines",
};

const cache = new Map<string, string | null>();
const HEADERS = { "User-Agent": "FlightTrack/1.0 (projet étudiant ; contact: github.com/dml93800)" };

async function getWikipediaThumbnail(title: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.originalimage?.source ?? data?.thumbnail?.source ?? null;
}

// Cherche une photo précise sur Wikimedia Commons en croisant compagnie + type
// (ex: "Iberia Airbus A321"), pour matcher la bonne livrée plutôt qu'une photo
// générique du modèle. Filtre les SVG (logos/diagrammes) pour ne garder que
// de vraies photos.
async function searchCommonsPhoto(query: string): Promise<string | null> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", `${query} filetype:bitmap`);
  url.searchParams.set("gsrlimit", "6");
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime");
  url.searchParams.set("iiurlwidth", "600");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString(), { headers: HEADERS, next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data?.query?.pages as
    | Record<string, { imageinfo?: { url?: string; thumburl?: string; mime?: string }[] }>
    | undefined;
  if (!pages) return null;
  const photo = Object.values(pages).find(
    (p) => p.imageinfo?.[0]?.mime && p.imageinfo[0].mime !== "image/svg+xml"
  );
  return photo?.imageinfo?.[0]?.thumburl ?? photo?.imageinfo?.[0]?.url ?? null;
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type")?.toUpperCase().trim();
  const airlineIcao = req.nextUrl.searchParams.get("airline")?.toUpperCase().trim();

  if (!type) {
    return NextResponse.json({ error: "Paramètre 'type' manquant" }, { status: 400 });
  }

  const cacheKey = `${type}:${airlineIcao ?? ""}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    return cached
      ? NextResponse.json({ url: cached })
      : NextResponse.json({ url: null }, { status: 404 });
  }

  const typeTerm = TYPE_NAME_MAP[type] ?? type;
  const airlineName = airlineIcao ? AIRLINE_NAME_MAP[airlineIcao] : null;

  try {
    let photoUrl: string | null = null;

    // 1. Si on connaît la compagnie, on tente une photo avec la bonne livrée
    if (airlineName) {
      photoUrl = await searchCommonsPhoto(`${airlineName} ${typeTerm}`);
    }

    // 2. Sinon (ou si rien trouvé), photo générique du type via Wikipedia
    if (!photoUrl) {
      photoUrl = await getWikipediaThumbnail(typeTerm);
    }

    cache.set(cacheKey, photoUrl);

    return photoUrl
      ? NextResponse.json({ url: photoUrl })
      : NextResponse.json({ url: null }, { status: 404 });
  } catch {
    cache.set(cacheKey, null);
    return NextResponse.json({ url: null }, { status: 404 });
  }
}