export const colors = {
  bg: {
    primary: "#0A0A0A",
    surface: "#0F0F0F",
    input: "#111111",
    progress: "#151515",
  },
  text: {
    primary: "#F2F0EB",
    muted: "#888888",
    label: "#999999",
    secondary: "#AAAAAA",
    dim: "#444444",
    footer: "#333333",
    empty: "#8D8D8D",
  },
  border: {
    primary: "#1E1E1E",
    subtle: "#161616",
  },
  accent: {
    primary: "#E8A020",
    subtleBg: "rgba(232, 160, 32, 0.08)",
    subtleBorder: "rgba(232, 160, 32, 0.35)",
  },
  danger: "#ef4444",
  tooltip: {
    border: "#2A2A2A",
  },
  shadow: "rgba(0, 0, 0, 0.6)",
} as const;

export type Colors = typeof colors;
