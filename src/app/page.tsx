"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Network } from "@/types/flight";

const FlightMap = dynamic(() => import("@/components/FlightMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-white">
      Chargement de la carte...
    </div>
  ),
});

export default function Home() {
  const [network, setNetwork] = useState<Network>("vatsim");

  return (
    <main className="w-screen h-screen flex flex-col bg-[#0a1525]">
      <header className="flex items-center justify-between px-4 py-3 bg-[#0d1b2e] border-b border-white/10 z-[1100]">
        <h1 className="text-white font-semibold text-lg tracking-tight">
          FlightTrack
        </h1>

        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(["vatsim", "ivao"] as Network[]).map((n) => (
            <button
              key={n}
              onClick={() => setNetwork(n)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                network === n
                  ? "bg-blue-600 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {n.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 relative">
        <FlightMap network={network} />
      </div>
    </main>
  );
}
