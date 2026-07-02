import { NextRequest, NextResponse } from "next/server";

// Silhouettes via Wikimedia Commons - avions blancs/neutres par type
const AIRCRAFT_SILHOUETTES: Record<string, string> = {
  // Airbus narrow
  A318: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A318_silhouette.svg/800px-Airbus_A318_silhouette.svg.png",
  A319: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A319_silhouette.svg/800px-Airbus_A319_silhouette.svg.png",
  A320: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A320_silhouette.svg/800px-Airbus_A320_silhouette.svg.png",
  A20N: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A320_silhouette.svg/800px-Airbus_A320_silhouette.svg.png",
  A321: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A321_silhouette.svg/800px-Airbus_A321_silhouette.svg.png",
  A21N: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A321_silhouette.svg/800px-Airbus_A321_silhouette.svg.png",
  A332: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A330_silhouette.svg/800px-Airbus_A330_silhouette.svg.png",
  A333: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A330_silhouette.svg/800px-Airbus_A330_silhouette.svg.png",
  A339: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A330_silhouette.svg/800px-Airbus_A330_silhouette.svg.png",
  A342: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A340_silhouette.svg/800px-Airbus_A340_silhouette.svg.png",
  A343: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A340_silhouette.svg/800px-Airbus_A340_silhouette.svg.png",
  A346: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A340_silhouette.svg/800px-Airbus_A340_silhouette.svg.png",
  A359: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A350_silhouette.svg/800px-Airbus_A350_silhouette.svg.png",
  A35K: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A350_silhouette.svg/800px-Airbus_A350_silhouette.svg.png",
  A388: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airbus_A380_silhouette.svg/800px-Airbus_A380_silhouette.svg.png",
  // Boeing narrow
  B735: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_737_silhouette.svg/800px-Boeing_737_silhouette.svg.png",
  B736: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_737_silhouette.svg/800px-Boeing_737_silhouette.svg.png",
  B737: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_737_silhouette.svg/800px-Boeing_737_silhouette.svg.png",
  B738: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_737_silhouette.svg/800px-Boeing_737_silhouette.svg.png",
  B739: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_737_silhouette.svg/800px-Boeing_737_silhouette.svg.png",
  B38M: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_737_MAX_silhouette.svg/800px-Boeing_737_MAX_silhouette.svg.png",
  B39M: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_737_MAX_silhouette.svg/800px-Boeing_737_MAX_silhouette.svg.png",
  // Boeing wide
  B752: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_757_silhouette.svg/800px-Boeing_757_silhouette.svg.png",
  B753: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_757_silhouette.svg/800px-Boeing_757_silhouette.svg.png",
  B762: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_767_silhouette.svg/800px-Boeing_767_silhouette.svg.png",
  B763: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_767_silhouette.svg/800px-Boeing_767_silhouette.svg.png",
  B764: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_767_silhouette.svg/800px-Boeing_767_silhouette.svg.png",
  B772: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_777_silhouette.svg/800px-Boeing_777_silhouette.svg.png",
  B773: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_777_silhouette.svg/800px-Boeing_777_silhouette.svg.png",
  B77W: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_777_silhouette.svg/800px-Boeing_777_silhouette.svg.png",
  B77L: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_777_silhouette.svg/800px-Boeing_777_silhouette.svg.png",
  B788: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_787_silhouette.svg/800px-Boeing_787_silhouette.svg.png",
  B789: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_787_silhouette.svg/800px-Boeing_787_silhouette.svg.png",
  B78X: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_787_silhouette.svg/800px-Boeing_787_silhouette.svg.png",
  B742: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_747_silhouette.svg/800px-Boeing_747_silhouette.svg.png",
  B744: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_747_silhouette.svg/800px-Boeing_747_silhouette.svg.png",
  B748: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Boeing_747_silhouette.svg/800px-Boeing_747_silhouette.svg.png",
  // Regional
  E170: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Embraer_E-jet_silhouette.svg/800px-Embraer_E-jet_silhouette.svg.png",
  E175: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Embraer_E-jet_silhouette.svg/800px-Embraer_E-jet_silhouette.svg.png",
  E190: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Embraer_E-jet_silhouette.svg/800px-Embraer_E-jet_silhouette.svg.png",
  E195: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Embraer_E-jet_silhouette.svg/800px-Embraer_E-jet_silhouette.svg.png",
  AT72: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/ATR_72_silhouette.svg/800px-ATR_72_silhouette.svg.png",
  AT76: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/ATR_72_silhouette.svg/800px-ATR_72_silhouette.svg.png",
  DH8D: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bombardier_Dash_8_silhouette.svg/800px-Bombardier_Dash_8_silhouette.svg.png",
  CRJ9: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bombardier_CRJ_silhouette.svg/800px-Bombardier_CRJ_silhouette.svg.png",
  CRJ7: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bombardier_CRJ_silhouette.svg/800px-Bombardier_CRJ_silhouette.svg.png",
  // GA
  C172: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Cessna_172_silhouette.svg/800px-Cessna_172_silhouette.svg.png",
  C208: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Cessna_208_silhouette.svg/800px-Cessna_208_silhouette.svg.png",
  PC12: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Pilatus_PC-12_silhouette.svg/800px-Pilatus_PC-12_silhouette.svg.png",
  MD11: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/McDonnell_Douglas_MD-11_silhouette.svg/800px-McDonnell_Douglas_MD-11_silhouette.svg.png",
  F100: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Fokker_100_silhouette.svg/800px-Fokker_100_silhouette.svg.png",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (!type) return NextResponse.json({ url: null });

  const icaoType = type.toUpperCase().slice(0, 4);
  const url = AIRCRAFT_SILHOUETTES[icaoType] ?? null;

  return NextResponse.json({ url });
}