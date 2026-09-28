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
        canvas: "var(--canvas)",
        surface: {
          DEFAULT: "var(--surface)",
          sub: "var(--surface-sub)",
          sunken: "var(--surface-sunken)",
        },
        // ─── Ink ───
        ink: {
          DEFAULT: "var(--ink)",
          body: "var(--ink-body)",
          muted: "var(--ink-muted)",
          faint: "var(--ink-faint)",
        },
        // ─── Lines ───
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
        // ─── Brand ───
        blue: {
          DEFAULT: "var(--blue)",
          deep: "var(--blue-deep)",
          ink: "var(--blue-ink)",
        },
        tint: {
          DEFAULT: "var(--tint)",
          strong: "var(--tint-strong)",
        },
        sky: "var(--sky)",
        navy: {
          DEFAULT: "var(--navy)",
          2: "var(--navy-2)",
          3: "var(--navy-3)",
        },
        rail: {
          ink: "var(--rail-ink)",
          dim: "var(--rail-ink-dim)",
        },
        // ─── Semantic ───
        ok: {
          DEFAULT: "var(--ok)",
          bg: "var(--ok-bg)",
          line: "var(--ok-line)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          bg: "var(--warn-bg)",
          line: "var(--warn-line)",
        },
        bad: {
          DEFAULT: "var(--bad)",
          bg: "var(--bad-bg)",
          line: "var(--bad-line)",
        },
        info: {
          DEFAULT: "var(--info)",
          bg: "var(--info-bg)",
          line: "var(--info-line)",
        },
        violet: {
          DEFAULT: "var(--violet)",
          bg: "var(--violet-bg)",
          line: "var(--violet-line)",
        },
        neutral: {
          DEFAULT: "var(--neutral)",
          bg: "var(--neutral-bg)",
          line: "var(--neutral-line)",
        },

        /**
         * Legacy `brand-*` scale, re-pointed at the reference tokens. Existing
         * call sites keep working and pick up the reference palette unchanged.
         */
        brand: {
          navy: "var(--navy)",
          primary: "var(--blue)",
          secondary: "var(--blue-ink)",
          blue: "var(--blue-ink)",
          sky: "var(--sky)",
          ice: "var(--tint-strong)",
          slate: "var(--ink-body)",
          gray: "var(--ink-muted)",
          "gray-light": "var(--ink-faint)",
          line: "var(--line)",
          tint: "var(--tint)",
        },

        // ─── shadcn/ui tokens (defined on :root in globals.css) ───
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
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
