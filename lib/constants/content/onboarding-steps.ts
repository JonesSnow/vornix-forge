export const onboardingSteps = [
  "What is your trading goal?",
  "What is your current experience level?",
  "Which markets interest you most?",
  "How much time can you dedicate daily?",
  "How would you describe your risk tolerance?",
] as const;

export const goalOptions = [
  "Build a full-time income from trading",
  "Supplement my existing income",
  "Learn trading as a skill",
  "Manage my own investments better",
] as const;

export const experienceOptions = [
  "Complete beginner — never traded",
  "Beginner — know basics but never traded real money",
  "Intermediate — traded but inconsistently",
  "Experienced — trading regularly but want structure",
] as const;

export const marketOptions = [
  "Indian Stocks and F&O",
  "Forex",
  "Crypto",
  "US and Global Stocks",
  "Commodities",
  "Not sure yet — I am still exploring",
] as const;

export const timeOptions = [
  "Less than 30 minutes",
  "30 minutes to 1 hour",
  "1 to 2 hours",
  "More than 2 hours",
] as const;

export const riskOptions = [
  "Safety first — I never want to lose my money",
  "Balanced — some losses are okay for good potential gains",
  "Aggressive — I am comfortable with big swings for bigger returns",
] as const;
