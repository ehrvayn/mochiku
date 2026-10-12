/** @type {import('tailwindcss').Config} */
/** Merge the `extend` block into your existing tailwind.config.js */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // surfaces
        cream: token("cream"), // app background
        paper: token("paper"), // cards
        line: token("line"), // warm borders
        night: token("night"), // camera screen

        // text
        ink: token("ink"),
        "ink-soft": token("ink-soft"),
        "ink-faint": token("ink-faint"),

        // brand
        brand: token("brand"),
        "brand-soft": token("brand-soft"),
        "brand-ink": token("brand-ink"), // orange text that stays readable
        "brand-deep": token("brand-deep"), // darkest orange, for text on bg-brand

        // urgency (these carry meaning, never use them as decoration)
        urgent: token("urgent"),
        "urgent-soft": token("urgent-soft"),
        "urgent-ink": token("urgent-ink"),
        soon: token("soon"),
        "soon-soft": token("soon-soft"),
        "soon-ink": token("soon-ink"),
        calm: token("calm"),
        "calm-soft": token("calm-soft"),
        "calm-ink": token("calm-ink"),
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