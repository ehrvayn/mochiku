/** @type {import('tailwindcss').Config} */
/** Merge the `extend` block into your existing tailwind.config.js */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // surfaces
        cream: "#FFF8EC", // app background
        paper: "#FFFFFF", // cards
        line: "#F0E4CF", // warm borders
        night: "#0F0E13", // camera screen

        // text
        ink: "#2B2438",
        "ink-soft": "#6B647A",
        "ink-faint": "#A39DB0",

        // brand
        brand: "#FF8A4C",
        "brand-soft": "#FFE9DB",
        "brand-ink": "#C2531A", // orange text that stays readable
        "brand-deep": "#8A3A0D", // darkest orange, for text on bg-brand

        // urgency (these carry meaning, never use them as decoration)
        urgent: "#F25C54",
        "urgent-soft": "#FDE3E0",
        "urgent-ink": "#C73E37",
        soon: "#FFB020",
        "soon-soft": "#FFF0CC",
        "soon-ink": "#9A6400",
        calm: "#5CC9A7",
        "calm-soft": "#DDF5EC",
        "calm-ink": "#1F8A6B",
      },
      fontFamily: {
        display: ["Nunito_800ExtraBold"],
        heading: ["Nunito_700Bold"],
        body: ["DMSans_400Regular"],
        "body-medium": ["DMSans_500Medium"],
        "body-bold": ["DMSans_700Bold"],
      },
    },
  },
  plugins: [],
};