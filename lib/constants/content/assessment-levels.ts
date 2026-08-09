export type LevelDescription = {
  level: number;
  range: string;
  title: string;
  desc: string;
};

export const levelDescriptions: LevelDescription[] = [
  {
    level: 1,
    range: "0-40%",
    title: "Foundation",
    desc: "You're just starting. Master the basics of market structure, candlesticks, and risk rules. Build unshakable fundamentals before scaling.",
  },
  {
    level: 2,
    range: "41-60%",
    title: "Beginner",
    desc: "You know the basics. Now focus on chart patterns, support/resistance, and real simulator practice. Develop consistent trading habits.",
  },
  {
    level: 3,
    range: "61-80%",
    title: "Intermediate",
    desc: "You have solid knowledge. Master advanced analysis, trade psychology, and portfolio management. Build a repeatable system.",
  },
  {
    level: 4,
    range: "81-100%",
    title: "Advanced",
    desc: "You're trading at a professional level. Specialize in your market, optimize your strategy, and build edge through discipline and data.",
  },
];
