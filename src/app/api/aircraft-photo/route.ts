import { NextRequest, NextResponse } from "next/server";

// Mapping type ICAO -> nom Wikipedia pour la recherche
const ICAO_TO_WIKI: Record<string, string> = {
  A318: "Airbus A318", A319: "Airbus A319", A320: "Airbus A320",
  A20N: "Airbus A320neo", A321: "Airbus A321", A21N: "Airbus A321neo",
  A332: "Airbus A330", A333: "Airbus A330", A339: "Airbus A330neo",
  A342: "Airbus A340", A343: "Airbus A340", A346: "Airbus A340",
  A359: "Airbus A350", A35K: "Airbus A350", A388: "Airbus A380",
  B735: "Boeing 737", B736: "Boeing 737", B737: "Boeing 737 Classic",
  B738: "Boeing 737 Next Generation", B739: "Boeing 737 Next Generation",
  B38M: "Boeing 737 MAX", B39M: "Boeing 737 MAX",
  B752: "Boeing 757", B753: "Boeing 757",
  B762: "Boeing 767", B763: "Boeing 767", B764: "Boeing 767",
  B772: "Boeing 777", B773: "Boeing 777", B77W: "Boeing 777",
  B77L: "Boeing 777", B788: "Boeing 787", B789: "Boeing 787", B78X: "Boeing 787",
  B742: "Boeing 747", B744: "Boeing 747", B748: "Boeing 747",
  E170: "Embraer E-jet family", E175: "Embraer E-jet family",
  E190: "Embraer E-jet family", E195: "Embraer E-jet family",
  AT72: "ATR 72", AT76: "ATR 72", AT45: "ATR 42",
  DH8D: "Bombardier Dash 8", DH8C: "Bombardier Dash 8",
  CRJ2: "Bombardier CRJ100/200", CRJ7: "Bombardier CRJ700",
  CRJ9: "Bombardier CRJ900", CRJX: "Bombardier CRJ1000",
  C172: "Cessna 172", C208: "Cessna 208 Caravan",
  C25A: "Cessna Citation CJ2", C25B: "Cessna Citation CJ3",
  TBM9: "TBM 900", TBM8: "TBM 850", TBM7: "TBM 700",
  MD11: "McDonnell Douglas MD-11", DC10: "McDonnell Douglas DC-10",
  F100: "Fokker 100", F70: "Fokker 70",
  P28A: "Piper PA-28", P28B: "Piper PA-28",
  BE20: "Beechcraft Super King Air", BE9L: "Beechcraft King Air",
  GLF5: "Gulfstream V", GLF6: "Gulfstream G650",
  C56X: "Cessna Citation Excel", C680: "Cessna Citation Sovereign",
  PC12: "Pilatus PC-12", SR22: "Cirrus SR22",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (!type) return NextResponse.json({ url: null });

  const icaoType = type.toUpperCase().slice(0, 4);
  const wikiTitle = ICAO_TO_WIKI[icaoType];

  if (!wikiTitle) return NextResponse.json({ url: null });

  try {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("titles", wikiTitle);
    url.searchParams.set("prop", "pageimages");
    url.searchParams.set("format", "json");
    url.searchParams.set("pithumbsize", "800");
    url.searchParams.set("origin", "*");

    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 }, // cache 24h
    });

    if (!res.ok) return NextResponse.json({ url: null });

    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return NextResponse.json({ url: null });

    const page = Object.values(pages)[0] as { thumbnail?: { source: string } };
    const photoUrl = page?.thumbnail?.source ?? null;

    return NextResponse.json({ url: photoUrl });
  } catch {
    return NextResponse.json({ url: null });
  }
}