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
        // Brand
        brand: {
          DEFAULT: "#FF6B35",
          dark: "#E55A2B",
          darker: "#CC4F21",
          light: "#FFE4D6",
        },
        // Admin dark theme
        admin: {
          bg: "#0F0F0F",
          surface: "#1E1E1E",
          elevated: "#2A2A2A",
          border: "#333333",
          text: "#FFFFFF",
          muted: "#B3B3B3",
          faint: "#666666",
        },
        // Partner portal light theme
        portal: {
          bg: "#F9FAFB",
          surface: "#FFFFFF",
          border: "#E5E7EB",
          text: "#111827",
          muted: "#6B7280",
          faint: "#9CA3AF",
        },
        // Status colors
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        tight: ["Inter Tight", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      spacing: {
        "4.5": "1.125rem",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
      maxWidth: {
        admin: "1440px",
        portal: "1280px",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
