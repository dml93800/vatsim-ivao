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
          paper: "#f3e9d2",      // fond parchemin
          "paper-dark": "#e8dab8", // panneaux légèrement plus sombres
          ink: "#3b2f23",        // texte / lignes encre sépia
          "ink-dim": "#8a7a5f",  // texte secondaire
          line: "#c9b88f",       // bordures discrètes
          blue: "#1f4e79",       // VATSIM (bleu carte aéro)
          magenta: "#8b2f4b",    // IVAO (magenta carte aéro)
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-serif)", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;