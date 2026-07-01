import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        chart: {
          paper: "#0b1220",         // fond nuit (app + carte)
          "paper-dark": "#131d31",  // panneaux / chips / popups
          ink: "#e8eef7",           // texte principal clair
          "ink-dim": "#8ea3c2",     // texte secondaire
          line: "#26324a",          // bordures discrètes
          blue: "#4da3ff",          // VATSIM (bleu ravivé)
          magenta: "#ff5c8a",       // IVAO (magenta ravivé)
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-sans-serif", "sans-serif"],
        serif: ["var(--font-serif)", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
