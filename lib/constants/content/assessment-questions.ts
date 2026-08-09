export type Question = {
  id: number;
  topic: string;
  question: string;
  options: string[];
  correct: number;
};

export type PracticalTask = {
  id: number;
  title: string;
  description: string;
  options: string[];
  correct: number;
};

export const knowledgeQuestions: Question[] = [
  {
    id: 1,
    topic: "Market Knowledge",
    question: "What does a stock represent?",
    options: [
      "An ownership share in a company",
      "A loan you give to a company",
      "A currency of a specific country",
      "A commodity like gold or oil",
    ],
    correct: 0,
  },
  {
    id: 2,
    topic: "Market Knowledge",
    question: "Which asset class has the highest trading volume globally?",
    options: [
      "Cryptocurrencies",
      "Forex (Currency pairs)",
      "Stocks",
      "Commodities",
    ],
    correct: 1,
  },
  {
    id: 3,
    topic: "Market Knowledge",
    question: "What is the primary difference between F&O (Futures & Options) and Cash market?",
    options: [
      "F&O trades happen faster",
      "F&O requires leverage and expiry dates, cash market is spot settlement",
      "F&O is only for Indian markets",
      "There is no practical difference",
    ],
    correct: 1,
  },
  {
    id: 4,
    topic: "Market Knowledge",
    question: "In the context of Indian markets, what is the NSE?",
    options: [
      "The National Stock Exchange — India's primary stock exchange",
      "The National Savings Entity — a government savings scheme",
      "The Network Security Enforcement body",
      "A cryptocurrency trading platform",
    ],
    correct: 0,
  },
  {
    id: 5,
    topic: "Market Knowledge",
    question: "What does leverage mean in trading?",
    options: [
      "Trading with borrowed money to control larger positions",
      "Using only your own capital for trading",
      "Selling assets you already own",
      "Investing in multiple markets simultaneously",
    ],
    correct: 0,
  },
  {
    id: 6,
    topic: "Market Knowledge",
    question: "What is a 'bear market'?",
    options: [
      "A market where prices are rising consistently",
      "A market where prices are falling and sentiment is negative",
      "A market that trades only in the morning",
      "A market limited to specific industries",
    ],
    correct: 1,
  },
  {
    id: 7,
    topic: "Chart Reading",
    question: "What does a green candlestick typically indicate?",
    options: [
      "The market is about to crash",
      "The closing price is higher than the opening price",
      "The stock is a buy signal",
      "Trading volume increased",
    ],
    correct: 1,
  },
  {
    id: 8,
    topic: "Chart Reading",
    question: "What is support in technical analysis?",
    options: [
      "A price level where the asset tends to stop falling and bounce up",
      "The highest price an asset has ever reached",
      "The average price of the asset",
      "A broker who helps you trade",
    ],
    correct: 0,
  },
  {
    id: 9,
    topic: "Chart Reading",
    question: "What is resistance in technical analysis?",
    options: [
      "The lowest price an asset can reach",
      "A price level where the asset tends to stop rising and pull back",
      "A government policy affecting trading",
      "The most recent trading price",
    ],
    correct: 1,
  },
  {
    id: 10,
    topic: "Chart Reading",
    question: 'In candlestick charts, what does the long thin line (wick/shadow) represent?',
    options: [
      "The time duration of the candle",
      "The highest and lowest prices reached during the period",
      "The average price during the period",
      "The trading volume",
    ],
    correct: 1,
  },
  {
    id: 11,
    topic: "Chart Reading",
    question: "What is a trend?",
    options: [
      "A sudden spike in trading volume",
      "The general direction of price movement — uptrend, downtrend, or sideways",
      "An unusual price pattern that repeats daily",
      "A recommendation from market analysts",
    ],
    correct: 1,
  },
  {
    id: 12,
    topic: "Chart Reading",
    question: "What does 'higher highs and higher lows' indicate?",
    options: [
      "An uptrend is forming",
      "A downtrend is starting",
      "The market is consolidating",
      "Trading will stop soon",
    ],
    correct: 0,
  },
  {
    id: 13,
    topic: "Risk Management",
    question: "What is a stop loss?",
    options: [
      "A price level where you automatically sell to limit losses",
      "The minimum profit you want to make",
      "A strategy to avoid trading certain stocks",
      "A mechanism to stop trading after a certain time",
    ],
    correct: 0,
  },
  {
    id: 14,
    topic: "Risk Management",
    question: "What does 'risking 2% per trade' mean?",
    options: [
      "Investing 2% of your portfolio in each trade",
      "Only trading 2 hours per day",
      "Limiting your potential loss to 2% of your total capital per trade",
      "Expecting a 2% profit minimum",
    ],
    correct: 2,
  },
  {
    id: 15,
    topic: "Risk Management",
    question: "If you have ₹50,000 and risk only 1% per trade, what is your maximum loss per trade?",
    options: ["₹100", "₹500", "₹5,000", "₹50,000"],
    correct: 1,
  },
  {
    id: 16,
    topic: "Risk Management",
    question: "What is the primary purpose of position sizing in trading?",
    options: [
      "To ensure you trade the largest quantity possible",
      "To maximize profits on every trade",
      "To control the amount of capital at risk and protect your account from large losses",
      "To follow what other traders are doing",
    ],
    correct: 2,
  },
  {
    id: 17,
    topic: "Psychology",
    question: "What is FOMO in trading?",
    options: [
      "A technical indicator used to predict prices",
      "Fear Of Missing Out — entering trades impulsively due to fear of missing profit",
      "A regulatory requirement for all traders",
      "The feeling after making a profitable trade",
    ],
    correct: 1,
  },
  {
    id: 18,
    topic: "Psychology",
    question: "What is emotional trading?",
    options: [
      "Trading with friends or family",
      "Making trades based on fear or greed rather than a plan",
      "Trading during specific emotional events",
      "A type of automated trading",
    ],
    correct: 1,
  },
  {
    id: 19,
    topic: "Psychology",
    question: "What is the key to consistent trading returns?",
    options: [
      "Trading as often as possible",
      "Following a trading plan with discipline and risk management",
      "Always going with your gut feeling",
      "Copying trades from successful traders",
    ],
    correct: 1,
  },
  {
    id: 20,
    topic: "Psychology",
    question: "How should you respond when you hit your daily loss limit?",
    options: [
      "Keep trading to recover the loss immediately",
      "Take a break and review what went wrong",
      "Double your position size to make faster profits",
      "Switch to a riskier strategy",
    ],
    correct: 1,
  },
];

export const practicalTasks: PracticalTask[] = [
  {
    id: 1,
    title: "Chart Pattern Recognition",
    description:
      "You see a price chart where each successive candle has higher highs and higher lows. Is this an uptrend or downtrend?",
    options: ["Downtrend", "Uptrend", "Sideways / Consolidation", "Unable to determine"],
    correct: 1,
  },
  {
    id: 2,
    title: "Position Sizing",
    description:
      "You have ₹10,000 and decide to risk only 2% per trade. What is your maximum loss per trade?",
    options: ["₹50", "₹100", "₹200", "₹500"],
    correct: 2,
  },
  {
    id: 3,
    title: "Risk Management Scenario",
    description:
      "You bought a stock at ₹100. It has dropped to ₹92. You had set a 5% stop loss (exit at ₹95). What should you do?",
    options: [
      "Exit immediately — your stop loss has been hit",
      "Hold and wait for recovery",
      "Buy more to average down the price",
      "Move your stop loss to ₹90 to avoid the loss",
    ],
    correct: 0,
  },
];

export const correctAnswers = [1, 2, 0] as const;
