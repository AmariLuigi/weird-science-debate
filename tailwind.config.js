/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand palette - teal to green
        brand: {
          dark: "#034159", // Deep teal - darkest
          teal: "#025951", // Teal
          sea: "#02735E", // Sea green
          green: "#038C3E", // Forest green
          mint: "#0CF25D", // Bright mint - accent
        },
        // Semantic aliases
        primary: "#0CF25D", // Bright mint for primary actions
        secondary: "#02735E", // Sea green for secondary elements
        accent: "#038C3E", // Forest green for accents
      },
      boxShadow: {
        "neon-mint":
          "0 0 20px rgba(12, 242, 93, 0.5), 0 0 40px rgba(12, 242, 93, 0.3)",
        "neon-teal":
          "0 0 20px rgba(2, 89, 81, 0.5), 0 0 40px rgba(2, 89, 81, 0.3)",
        "neon-green":
          "0 0 20px rgba(3, 140, 62, 0.5), 0 0 40px rgba(3, 140, 62, 0.3)",
        "neon-glow":
          "0 0 30px rgba(12, 242, 93, 0.4), 0 0 60px rgba(2, 115, 94, 0.2)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
      },
      backdropBlur: {
        glass: "16px",
      },
      animation: {
        breathing: "breathing 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        breathing: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.02)", opacity: "0.8" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow:
              "0 0 20px rgba(12, 242, 93, 0.5), 0 0 40px rgba(12, 242, 93, 0.3)",
          },
          "50%": {
            boxShadow:
              "0 0 30px rgba(12, 242, 93, 0.7), 0 0 60px rgba(12, 242, 93, 0.5)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":
          "linear-gradient(135deg, #034159 0%, #025951 25%, #02735E 50%, #038C3E 75%, #0CF25D 100%)",
        "gradient-mint": "linear-gradient(135deg, #02735E 0%, #0CF25D 100%)",
      },
    },
  },
  plugins: [],
};
