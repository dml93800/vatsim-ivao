import { NextRequest, NextResponse } from "next/server";
import { fetchVatsimSnapshot } from "@/lib/adapters/vatsim";
import { fetchIvaoSnapshot } from "@/lib/adapters/ivao";
import { Network } from "@/types/flight";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ network: string }> }
) {
  const { network } = await params;

  if (network !== "vatsim" && network !== "ivao") {
    return NextResponse.json(
      { error: "Réseau invalide. Utilisez 'vatsim' ou 'ivao'." },
      { status: 400 }
    );
  }

  try {
    const snapshot =
      network === "vatsim"
        ? await fetchVatsimSnapshot()
        : await fetchIvaoSnapshot();

    return NextResponse.json(snapshot);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export type { Network };
