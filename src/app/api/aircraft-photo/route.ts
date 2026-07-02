import { NextRequest, NextResponse } from "next/server";

const PLANESPOTTERS_API = "https://api.planespotters.net/pub/photos/hex";

// Silhouettes par type d'appareil (image blanche/générique)
// Source : silhouettes publiques par type ICAO
function getSilhouetteUrl(aircraftType: string | null): string {
  const type = (aircraftType ?? "").toUpperCase().slice(0, 4);
  // Planespotters fournit aussi des silhouettes génériques
  return `https://www.planespotters.net/silhouettes/${type}.png`;
}

// Codes ICAO des vraies compagnies aériennes (liste partielle des principales)
const REAL_AIRLINES = new Set([
  "AAL","UAL","DAL","SWA","JBU","ACA","WJA","AFR","BAW","DLH","KLM","EZY",
  "RYR","VLG","IBE","TAP","SWR","AUA","THY","UAE","QTR","ETD","SVA","MSR",
  "RAM","DAH","TUN","JAL","ANA","CES","CCA","CSN","SIA","CPA","KAL","THA",
  "GIA","AIC","ELY","QFA","ANZ","ETH","KQA","SAA","MGL","TGW","AVA","GLO",
  "AZU","LAN","ARG","TAM","AZA","NAX","FIN","SAS","ICE","WZZ","PGT","AFL",
  "BEL","VIR","EIN","AER","LOT","CSA","MAY","THY","PIA","TGW","MEA","GFA",
  "OMA","SVA","IRA","TBT","KAC","JZA","WAN","CAW","CHH","HXA","DKH","OKA",
  "UZB","TCV","ROU","TCW","SEY","MDA","BCI","LAO","ANG","PAC","AIZ","FJI",
  "NCA","JSA","JTA","HAL","WestJet","SWA","ASA","SKW","EWR","VXP","DBA",
]);

function isRealAirline(callsign: string): boolean {
  const code = callsign.match(/^[A-Za-z]{2,3}/)?.[0]?.toUpperCase();
  if (!code) return false;
  return REAL_AIRLINES.has(code);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const airline = searchParams.get("airline");

  if (!type) {
    return NextResponse.json({ url: null });
  }

  // Si c'est une VA ou compagnie inconnue → silhouette générique
  if (!airline || !isRealAirline(airline)) {
    return NextResponse.json({
      url: `https://www.planespotters.net/silhouettes/${type.toUpperCase().slice(0, 4)}.png`,
      isSilhouette: true,
    });
  }

  // Vraie compagnie → cherche une photo réelle via Planespotters
  try {
    const res = await fetch(
      `https://api.planespotters.net/pub/photos/airline/${airline}/${type}`,
      {
        headers: { "User-Agent": "FlightTrack/1.0 (IVAO tracker)" },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ url: getSilhouetteUrl(type) });
    }

    const data = await res.json();
    const photo = data.photos?.[0];

    if (!photo?.thumbnail_large?.src) {
      return NextResponse.json({ url: getSilhouetteUrl(type) });
    }

    return NextResponse.json({ url: photo.thumbnail_large.src });
  } catch {
    return NextResponse.json({ url: getSilhouetteUrl(type) });
  }
}