"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Network } from "@/types/flight";

const FlightMap = dynamic(() => import("@/components/FlightMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-chart-ink font-serif text-lg tracking-wide">
      Chargement de la carte...
    </div>
  ),
});

export default function Home() {
  const [network, setNetwork] = useState<Network>("vatsim");

  return (
    <main className="w-screen h-screen flex flex-col bg-chart-paper font-mono">
      <header className="flex items-center justify-between px-6 py-3 bg-chart-paper-dark border-b-2 border-chart-ink/20 z-[1100]">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-chart-blue live-dot" />
          <h1 className="text-chart-ink font-serif font-semibold text-xl tracking-wide">
            FlightTrack
          </h1>
        </div>

        <div className="flex items-center gap-1 bg-chart-paper rounded-sm p-1 border border-chart-line">
          {(["vatsim", "ivao"] as Network[]).map((n) => (
            <button
              key={n}
              onClick={() => setNetwork(n)}
              className={`px-4 py-1.5 rounded-sm text-xs font-mono font-semibold tracking-widest transition-colors ${
                network === n
                  ? n === "vatsim"
                    ? "bg-chart-blue/10 text-chart-blue border border-chart-blue/40"
                    : "bg-chart-magenta/10 text-chart-magenta border border-chart-magenta/40"
                  : "text-chart-ink-dim border border-transparent hover:text-chart-ink"
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