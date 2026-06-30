import { NextRequest, NextResponse } from "next/server";

// Mapping des codes ICAO courts (ceux renvoyés par VATSIM/IVAO dans le plan
// de vol, ex: "A320", "B738") vers le titre exact de l'article Wikipedia
// correspondant, pour cibler directement la bonne page plutôt que deviner.
const TYPE_NAME_MAP: Record<string, string> = {
  A20N: "Airbus A320neo",
  A21N: "Airbus A321neo",
  A319: "Airbus A319",
  A320: "Airbus A320",
  A321: "Airbus A321",
  A332: "Airbus A330",
  A333: "Airbus A330",
  A339: "Airbus A330neo",
  A343: "Airbus A340",
  A359: "Airbus A350 XWB",
  A35K: "Airbus A350 XWB",
  A388: "Airbus A380",
  B737: "Boeing 737",
  B738: "Boeing 737 Next Generation",
  B739: "Boeing 737 Next Generation",
  B38M: "Boeing 737 MAX",
  B39M: "Boeing 737 MAX",
  B744: "Boeing 747-400",
  B748: "Boeing 747-8",
  B752: "Boeing 757",
  B763: "Boeing 767",
  B772: "Boeing 777",
  B773: "Boeing 777",
  B77W: "Boeing 777",
  B788: "Boeing 787 Dreamliner",
  B789: "Boeing 787 Dreamliner",
  B78X: "Boeing 787 Dreamliner",
  CRJ9: "Bombardier CRJ900",
  E170: "Embraer E-Jet family",
  E190: "Embraer E190",
  E195: "Embraer E195",
  AT76: "ATR 72",
  AT72: "ATR 72",
  DH8D: "Bombardier Dash 8",
};

// Cache mémoire simple par instance serverless
const cache = new Map<string, string | null>();

const HEADERS = { "User-Agent": "FlightTrack/1.0 (projet étudiant ; contact: github.com/dml93800)" };

// Récupère l'image d'infobox d'une page Wikipedia via l'API REST officielle
async function getWikipediaThumbnail(title: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  // originalimage = pleine résolution, thumbnail = version réduite (fallback)
  return data?.originalimage?.source ?? data?.thumbnail?.source ?? null;
}

// Si le titre exact n'existe pas, on cherche le meilleur résultat correspondant
async function searchWikipediaTitle(query: string): Promise<string | null> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("srlimit", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString(), { headers: HEADERS, next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.query?.search?.[0]?.title ?? null;
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type")?.toUpperCase().trim();

  if (!type) {
    return NextResponse.json({ error: "Paramètre 'type' manquant" }, { status: 400 });
  }

  if (cache.has(type)) {
    const cached = cache.get(type);
    return cached
      ? NextResponse.json({ url: cached })
      : NextResponse.json({ url: null }, { status: 404 });
  }

  const searchTerm = TYPE_NAME_MAP[type] ?? type;

  try {
    // 1. On tente d'abord le titre exact (rapide, un seul appel)
    let photoUrl = await getWikipediaThumbnail(searchTerm);

    // 2. Si pas trouvé, on cherche le titre le plus proche puis on retente
    if (!photoUrl) {
      const bestTitle = await searchWikipediaTitle(`${searchTerm} aircraft`);
      if (bestTitle) {
        photoUrl = await getWikipediaThumbnail(bestTitle);
      }
    }

    cache.set(type, photoUrl);

    return photoUrl
      ? NextResponse.json({ url: photoUrl })
      : NextResponse.json({ url: null }, { status: 404 });
  } catch {
    cache.set(type, null);
    return NextResponse.json({ url: null }, { status: 404 });
  }
}