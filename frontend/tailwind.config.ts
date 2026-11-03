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
        canvas: "#0B0F17",
        surface: "#111827",
        "surface-hover": "#1F2937",
        "border-subtle": "#374151",
        sev: {
          critical: "#EF4444",
          high: "#F97316",
          medium: "#F59E0B",
          low: "#3B82F6",
          info: "#6B7280",
        },
      },
    },
  },
  plugins: [],
};

export default config;

