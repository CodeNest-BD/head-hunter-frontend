import type { Config } from "tailwindcss";

/**
 * The design system from the redesign reference (head-hunter-design/assets/hh.css),
 * expressed as Tailwind utilities. Every value here is the reference's, verbatim —
 * components compose these rather than hard-coding hexes or arbitrary sizes.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Ground ───
        canvas: "rgb(var(--canvas-rgb) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          sub: "rgb(var(--surface-sub-rgb) / <alpha-value>)",
          sunken: "rgb(var(--surface-sunken-rgb) / <alpha-value>)",
        },
        // ─── Ink ───
        ink: {
          DEFAULT: "rgb(var(--ink-rgb) / <alpha-value>)",
          body: "rgb(var(--ink-body-rgb) / <alpha-value>)",
          muted: "rgb(var(--ink-muted-rgb) / <alpha-value>)",
          faint: "rgb(var(--ink-faint-rgb) / <alpha-value>)",
        },
        // ─── Lines ───
        line: {
          DEFAULT: "rgb(var(--line-rgb) / <alpha-value>)",
          strong: "rgb(var(--line-strong-rgb) / <alpha-value>)",
        },
        // ─── Brand ───
        blue: {
          DEFAULT: "rgb(var(--blue-rgb) / <alpha-value>)",
          deep: "rgb(var(--blue-deep-rgb) / <alpha-value>)",
          ink: "rgb(var(--blue-ink-rgb) / <alpha-value>)",
        },
        tint: {
          DEFAULT: "rgb(var(--tint-rgb) / <alpha-value>)",
          strong: "rgb(var(--tint-strong-rgb) / <alpha-value>)",
        },
        sky: "rgb(var(--sky-rgb) / <alpha-value>)",
        navy: {
          DEFAULT: "rgb(var(--navy-rgb) / <alpha-value>)",
          2: "rgb(var(--navy-2-rgb) / <alpha-value>)",
          3: "rgb(var(--navy-3-rgb) / <alpha-value>)",
        },
        rail: {
          ink: "rgb(var(--rail-ink-rgb) / <alpha-value>)",
          dim: "rgb(var(--rail-ink-dim-rgb) / <alpha-value>)",
        },
        // ─── Semantic ───
        ok: {
          DEFAULT: "rgb(var(--ok-rgb) / <alpha-value>)",
          bg: "rgb(var(--ok-bg-rgb) / <alpha-value>)",
          line: "rgb(var(--ok-line-rgb) / <alpha-value>)",
        },
        warn: {
          DEFAULT: "rgb(var(--warn-rgb) / <alpha-value>)",
          bg: "rgb(var(--warn-bg-rgb) / <alpha-value>)",
          line: "rgb(var(--warn-line-rgb) / <alpha-value>)",
        },
        bad: {
          DEFAULT: "rgb(var(--bad-rgb) / <alpha-value>)",
          bg: "rgb(var(--bad-bg-rgb) / <alpha-value>)",
          line: "rgb(var(--bad-line-rgb) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--info-rgb) / <alpha-value>)",
          bg: "rgb(var(--info-bg-rgb) / <alpha-value>)",
          line: "rgb(var(--info-line-rgb) / <alpha-value>)",
        },
        violet: {
          DEFAULT: "rgb(var(--violet-rgb) / <alpha-value>)",
          bg: "rgb(var(--violet-bg-rgb) / <alpha-value>)",
          line: "rgb(var(--violet-line-rgb) / <alpha-value>)",
        },
        neutral: {
          DEFAULT: "rgb(var(--neutral-rgb) / <alpha-value>)",
          bg: "rgb(var(--neutral-bg-rgb) / <alpha-value>)",
          line: "rgb(var(--neutral-line-rgb) / <alpha-value>)",
        },

        /**
         * Legacy `brand-*` scale, re-pointed at the reference tokens. Existing
         * call sites keep working and pick up the reference palette unchanged.
         */
        brand: {
          navy: "rgb(var(--navy-rgb) / <alpha-value>)",
          primary: "rgb(var(--blue-rgb) / <alpha-value>)",
          secondary: "rgb(var(--blue-ink-rgb) / <alpha-value>)",
          blue: "rgb(var(--blue-ink-rgb) / <alpha-value>)",
          sky: "rgb(var(--sky-rgb) / <alpha-value>)",
          ice: "rgb(var(--tint-strong-rgb) / <alpha-value>)",
          slate: "rgb(var(--ink-body-rgb) / <alpha-value>)",
          gray: "rgb(var(--ink-muted-rgb) / <alpha-value>)",
          "gray-light": "rgb(var(--ink-faint-rgb) / <alpha-value>)",
          line: "rgb(var(--line-rgb) / <alpha-value>)",
          tint: "rgb(var(--tint-rgb) / <alpha-value>)",
        },

        // ─── shadcn/ui tokens (defined on :root in globals.css) ───
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          primary: "hsl(var(--sidebar-primary) / <alpha-value>)",
          "primary-foreground":
            "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          accent: "hsl(var(--sidebar-accent) / <alpha-value>)",
          "accent-foreground":
            "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
        },
      },

      /**
       * The reference's type roles, each carrying its own line-height and
       * tracking so a role is one class. The numeric `text-[11|12|…]` sizes
       * below cover the in-between steps the reference uses inline.
       */
      fontSize: {
        label: ["11px", { lineHeight: "1.3", letterSpacing: "0.07em" }],
        meta: ["12px", { lineHeight: "1.4" }],
        sub: ["13px", { lineHeight: "1.45" }],
        body: ["13.5px", { lineHeight: "1.5" }],
        block: ["14px", { lineHeight: "1.4" }],
        card: ["15px", { lineHeight: "1.35", letterSpacing: "-0.008em" }],
        section: ["17px", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        page: ["20px", { lineHeight: "1.25", letterSpacing: "-0.012em" }],
        stat: ["24px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        display: ["26px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
      },

      fontWeight: {
        // The reference leans on the in-between weights Inter provides.
        450: "450",
        550: "550",
        650: "650",
        750: "750",
      },

      borderRadius: {
        lg: "var(--radius)", // 12px — page-level panels
        md: "calc(var(--radius) - 2px)", // 10px — cards
        sm: "calc(var(--radius) - 4px)", // 8px  — controls, inputs
        xs: "calc(var(--radius) - 6px)", // 6px  — chips, small buttons
      },

      boxShadow: {
        // Crisp, not floaty — the reference's three elevation steps.
        e1: "0 1px 2px rgba(10, 23, 56, 0.06)",
        e2: "0 1px 3px rgba(10, 23, 56, 0.07), 0 4px 14px rgba(10, 23, 56, 0.06)",
        pop: "0 4px 10px rgba(10, 23, 56, 0.09), 0 12px 32px rgba(10, 23, 56, 0.13)",
        // Legacy aliases, re-pointed at the same three steps.
        card: "0 1px 2px rgba(10, 23, 56, 0.06)",
        "card-lg":
          "0 1px 3px rgba(10, 23, 56, 0.07), 0 4px 14px rgba(10, 23, 56, 0.06)",
        "card-hover":
          "0 1px 3px rgba(10, 23, 56, 0.07), 0 4px 14px rgba(10, 23, 56, 0.06)",
        // The rail's active marker / unread row edge.
        rail: "inset 3px 0 0 var(--blue)",
        // Focus halo for text controls.
        focus: "0 0 0 3px rgba(3, 74, 239, 0.12)",
      },

      spacing: {
        // Reference control and row metrics Tailwind's default scale misses.
        4.5: "18px", // large button padding, form-section block padding
        5.25: "21px", // pill height
        6.5: "26px", // tag height, small avatar
        7.5: "30px", // small button / timeline icon
        8.5: "34px", // icon button, stat icon, topbar search
        9.5: "38px", // table header row
        10.5: "42px", // large button
        13: "52px", // xl avatar, OTP input
        topbar: "var(--topbar-h)", // 56px
        rail: "var(--rail-w)", // 232px
      },

      maxWidth: {
        page: "1560px", // .page__inner
        "page-narrow": "880px", // .page--narrow .page__inner
        prose: "68ch", // .prose
      },

      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "SF Pro Text",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        heading: [
          "var(--font-inter)",
          "Inter",
          "SF Pro Text",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        body: [
          "var(--font-inter)",
          "Inter",
          "SF Pro Text",
          "system-ui",
          "sans-serif",
        ],
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        // Slides a gradient highlight across text via background-position.
        // Used with `background-clip: text` for Claude-style "is thinking"
        // shimmer — distinct from the translateX `shimmer` keyframe above,
        // which is for skeleton overlay sweeps.
        "text-shimmer": {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        "ai-dot-pulse": {
          "0%, 80%, 100%": { transform: "scale(0.8)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
        "shimmer-skew": {
          "0%": { transform: "translateX(-100%) skewX(-12deg)" },
          "100%": { transform: "translateX(100%) skewX(-12deg)" },
        },
        // Landing gradient animation
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.2s infinite linear",
        "text-shimmer": "text-shimmer 2.5s linear infinite",
        "ai-dot-pulse": "ai-dot-pulse 1s infinite ease-in-out",
        "shimmer-skew": "shimmer-skew 2s infinite",
        "gradient-shift": "gradient-shift 8s linear infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("tailwind-scrollbar-hide"),
  ],
};
export default config;
