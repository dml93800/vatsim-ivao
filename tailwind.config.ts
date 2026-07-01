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
          paper: "#0b1220",
          "paper-dark": "#131d31",
          ink: "#e8eef7",
          "ink-dim": "#8ea3c2",
          line: "#26324a",
          blue: "#4da3ff",
          magenta: "#ff5c8a",
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