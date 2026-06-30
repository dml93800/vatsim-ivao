"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Network } from "@/types/flight";

const FlightMap = dynamic(() => import("@/components/FlightMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-scope-green font-mono text-sm tracking-widest">
      INITIALISATION DU SCOPE...
    </div>
  ),
});

export default function Home() {
  const [network, setNetwork] = useState<Network>("vatsim");

  return (
    <main className="w-screen h-screen flex flex-col bg-scope-bg font-sans">
      <header className="flex items-center justify-between px-5 py-3 bg-scope-panel border-b border-scope-line z-[1100]">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-scope-green live-dot shadow-[0_0_8px_#3cff8e]" />
          <h1 className="text-scope-text font-mono font-bold text-base tracking-[0.15em]">
            FLIGHT<span className="text-scope-green">TRACK</span>
          </h1>
        </div>

        <div className="flex items-center gap-0.5 bg-scope-bg rounded-sm p-0.5 border border-scope-line">
          {(["vatsim", "ivao"] as Network[]).map((n) => (
            <button
              key={n}
              onClick={() => setNetwork(n)}
              className={`px-4 py-1.5 rounded-sm text-xs font-mono font-bold tracking-widest transition-colors ${
                network === n
                  ? n === "vatsim"
                    ? "bg-scope-green/15 text-scope-green border border-scope-green/40"
                    : "bg-scope-amber/15 text-scope-amber border border-scope-amber/40"
                  : "text-scope-dim border border-transparent hover:text-scope-text"
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