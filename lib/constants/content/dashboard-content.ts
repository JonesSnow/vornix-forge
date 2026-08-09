export const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Learn", href: "/learn" },
  { label: "Simulator", href: "/simulator" },
  { label: "Journal", href: "/journal" },
  { label: "Progress", href: "/progress" },
  { label: "Community", href: "/community" },
] as const;

export type NavItem = (typeof navItems)[number];

export const skillLabels = [
  "Technical Analysis",
  "Fundamental Analysis",
  "Risk Management",
  "Psychology",
  "Chart Reading",
  "Strategy",
  "Execution",
  "Market Knowledge",
] as const;

export type LevelCopyEntry = {
  name: string;
  description: string;
  learn: string[];
  progress: number;
};

export const levelCopy: Record<number, LevelCopyEntry> = {
  1: {
    name: "Level 1 - Foundation",
    description:
      "You are at the starting line. Focus on market structure, chart basics, and strict risk rules before taking on live complexity.",
    learn: [
      "What stocks, forex, and crypto are",
      "Candlestick reading basics",
      "Simple risk rules and stop losses",
    ],
    progress: 25,
  },
  2: {
    name: "Level 2 - Beginner",
    description:
      "You know some fundamentals but still need structure. This level builds consistency through guided practice and setup recognition.",
    learn: [
      "Support and resistance",
      "Basic simulator execution",
      "Trading habits and journaling",
    ],
    progress: 50,
  },
  3: {
    name: "Level 3 - Intermediate",
    description:
      "You have a workable base. Now the goal is to refine execution, improve risk control, and connect market context to your decisions.",
    learn: [
      "Setup selection and confirmation",
      "Risk-reward planning",
      "Trade review and pattern refinement",
    ],
    progress: 75,
  },
  4: {
    name: "Level 4 - Advanced",
    description:
      "You show strong command of the basics and can work on specialization, strategy consistency, and professional decision-making.",
    learn: [
      "Specialized strategy development",
      "Advanced execution planning",
      "Portfolio and system optimization",
    ],
    progress: 100,
  },
};

export type NextModule = {
  title: string;
  description: string;
  time: string;
};

export const nextModules: Record<number, NextModule> = {
  1: {
    title: "Module 1.1: Market Basics",
    description:
      "Learn how stocks, forex, and crypto markets work before moving into chart reading and risk control.",
    time: "15 min",
  },
  2: {
    title: "Module 2.1: Support and Resistance",
    description:
      "Build the habit of identifying structure on charts and using it to plan better entries and exits.",
    time: "20 min",
  },
  3: {
    title: "Module 3.1: Trade Planning",
    description:
      "Improve setup selection, trade journaling, and risk-reward discipline with repeatable planning.",
    time: "25 min",
  },
  4: {
    title: "Module 4.1: Strategy Refinement",
    description:
      "Focus on execution quality, optimization, and consistency for a professional trading workflow.",
    time: "30 min",
  },
};
