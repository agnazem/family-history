import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas:        "var(--canvas)",
        surface:       "var(--surface)",
        "surface-alt": "var(--surface-alt)",
        ink: {
          DEFAULT: "var(--ink)",
          soft:    "var(--ink-soft)",
          mute:    "var(--ink-mute)",
        },
        rule:          "var(--rule)",
        gold:          "var(--gold)",
        accent: {
          DEFAULT: "var(--accent)",
          hover:   "var(--accent-hover)",
          mid:     "var(--gold)",
          pale:    "var(--accent-soft)",
          border:  "var(--rule)",
          soft:    "var(--accent-soft)",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans:    ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-dm-mono)", "ui-monospace", "SF Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
