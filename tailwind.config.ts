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
        scope: {
          bg: "#060a08",
          panel: "#0d1410",
          line: "#1b2b22",
          green: "#3cff8e",
          "green-dim": "#1d8a52",
          amber: "#ffb13d",
          "amber-dim": "#8a5e1d",
          text: "#e8ffef",
          dim: "#6e8276",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;