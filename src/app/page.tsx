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
      <header
        className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 z-[1100]"
        style={{
          background: "linear-gradient(180deg,#18233a 0%,#111a2c 100%)",
          boxShadow: "0 8px 24px -8px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.08)",
        }}
      >
        <div className="flex flex-col gap-px">
          <h1 className="font-serif font-bold text-2xl tracking-tight leading-none text-[#eef3fb]">
            Flight<span className="text-chart-blue">Track</span>
          </h1>
          <span className="font-serif text-[10.5px] font-medium tracking-[.22em] uppercase text-chart-ink-dim">
            by <span className="font-bold italic" style={{ color: "#88F600" }}>TOUATI</span>
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 p-1.5 rounded-[15px] border border-white/10"
          style={{
            background: "rgba(11,18,32,.6)",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05)",
          }}
        >
          {(["vatsim", "ivao"] as Network[]).map((n) => {
            const active = network === n;
            const isV = n === "vatsim";
            const brand = isV ? "#4da3ff" : "#ff5c8a";
            const dotColor = active ? "#fff" : brand;
            return (
              <button
                key={n}
                onClick={() => setNetwork(n)}
                className="flex items-center gap-2.5 px-5 py-2 rounded-[11px] font-mono font-black text-[13px] tracking-wide transition-all"
                style={
                  active
                    ? {
                        color: "#fff",
                        background: isV
                          ? "linear-gradient(180deg,#4da3ff,#2b7fd4)"
                          : "linear-gradient(180deg,#ff6f9c,#e03e6e)",
                        border: "1px solid rgba(255,255,255,.25)",
                        boxShadow: isV
                          ? "0 6px 18px -4px rgba(77,163,255,.65), inset 0 1px 0 rgba(255,255,255,.35)"
                          : "0 6px 18px -4px rgba(255,92,138,.6), inset 0 1px 0 rgba(255,255,255,.35)",
                      }
                    : { color: "#8ea3c2", background: "transparent", border: "1px solid transparent" }
                }
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: dotColor,
                    boxShadow: `0 0 8px ${dotColor}`,
                  }}
                />
                {n.toUpperCase()}
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex-1 relative">
        <FlightMap network={network} />
      </div>
    </main>
  );
}