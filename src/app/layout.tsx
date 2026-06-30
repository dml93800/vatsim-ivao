import type { Metadata } from "next";
import { IBM_Plex_Mono, Spectral } from "next/font/google";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

const spectral = Spectral({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FlightTrack — VATSIM & IVAO Live Tracker",
  description: "Suivi en temps réel des vols et positions ATC sur VATSIM et IVAO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plexMono.variable} ${spectral.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}