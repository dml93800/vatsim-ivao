import { NextRequest, NextResponse } from "next/server";

// Mapping des codes ICAO courts (ceux renvoyés par VATSIM/IVAO dans le plan
// de vol, ex: "A320", "B738") vers un nom de recherche plus précis, pour de
// meilleurs résultats sur Wikimedia Commons. Liste non-exhaustive, complétée
// au fil des types les plus courants croisés sur le réseau.
const TYPE_NAME_MAP: Record<string, string> = {
  A20N: "Airbus A320neo",
  A21N: "Airbus A321neo",
  A319: "Airbus A319",
  A320: "Airbus A320",
  A321: "Airbus A321",
  A332: "Airbus A330-200",
  A333: "Airbus A330-300",
  A339: "Airbus A330-900",
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
  B788: "Boeing 787-8 Dreamliner",
  B789: "Boeing 787-9 Dreamliner",
  B78X: "Boeing 787-10 Dreamliner",
  CRJ9: "Bombardier CRJ900",
  E190: "Embraer E190",
  E195: "Embraer E195",
  AT76: "ATR 72",
  DH8D: "Bombardier Dash 8 Q400",
};

// Cache mémoire simple par instance serverless, suffisant pour éviter de
// re-frapper Wikimedia à chaque requête sur un même type pendant la durée
// de vie de l'instance
const cache = new Map<string, string | null>();

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
    const apiUrl = new URL("https://commons.wikimedia.org/w/api.php");
    apiUrl.searchParams.set("action", "query");
    apiUrl.searchParams.set("generator", "search");
    apiUrl.searchParams.set("gsrsearch", `intitle:"${searchTerm}" filetype:bitmap`);
    apiUrl.searchParams.set("gsrlimit", "1");
    apiUrl.searchParams.set("gsrnamespace", "6"); // namespace Fichier:
    apiUrl.searchParams.set("prop", "imageinfo");
    apiUrl.searchParams.set("iiprop", "url");
    apiUrl.searchParams.set("iiurlwidth", "500");
    apiUrl.searchParams.set("format", "json");
    apiUrl.searchParams.set("origin", "*");

    const res = await fetch(apiUrl.toString(), {
      headers: { "User-Agent": "FlightTrack/1.0 (projet étudiant)" },
      next: { revalidate: 86400 }, // une photo par type ne change pas, cache 24h
    });

    if (!res.ok) throw new Error(`Wikimedia ${res.status}`);

    const data = await res.json();
    const pages = data?.query?.pages as
      | Record<string, { imageinfo?: { url?: string; thumburl?: string }[] }>
      | undefined;
    const firstPage = pages ? Object.values(pages)[0] : null;
    const url: string | null =
      firstPage?.imageinfo?.[0]?.thumburl ?? firstPage?.imageinfo?.[0]?.url ?? null;

    cache.set(type, url);

    return url
      ? NextResponse.json({ url })
      : NextResponse.json({ url: null }, { status: 404 });
  } catch {
    cache.set(type, null);
    return NextResponse.json({ url: null }, { status: 404 });
  }
}