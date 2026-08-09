import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const course = await prisma.course.create({
    data: {
      title: "Foundation — Understanding Markets",
      description:
        "Complete beginner foundation. Learn what trading is, how markets work, and place your first paper trade.",
      level: 1,
      order: 1,
    },
  });

  const module1 = await prisma.module.create({
    data: {
      title: "What is Trading",
      description:
        "Understand markets, exchanges, buyers, sellers and price discovery",
      order: 1,
      courseId: course.id,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        title: "What Is Trading and Who Does It",
        content:
          "Trading is the act of buying and selling financial instruments—such as stocks, currencies, or commodities—with the goal of profiting from short-term price movements. Unlike investing, which typically focuses on long-term growth and income, trading emphasizes timing, momentum, and risk management over shorter timeframes, from minutes to weeks. Traders come from all backgrounds: retail traders use personal capital, institutional traders manage large portfolios for firms, and market makers provide liquidity to keep markets running smoothly. Successful trading is not about getting lucky on a single trade; it is about developing a repeatable process, understanding why prices move, and managing emotions when the market moves against you.",
        type: "lesson",
        order: 1,
        duration: 15,
        moduleId: module1.id,
      },
      {
        title: "How Markets Operate",
        content:
          "Financial markets operate as organized meeting places—physical or digital—where buyers and sellers come together to exchange assets. Exchanges like the NYSE, NASDAQ, or forex platforms provide the infrastructure for these trades, matching orders through centralized systems or decentralized networks. Price discovery happens through supply and demand: when more buyers than sellers exist, prices rise; when more sellers than buyers exist, prices fall. Liquidity, or how easily an asset can be bought or sold without moving its price, is a critical factor for traders. Highly liquid markets, such as major forex pairs or large-cap stocks, tend to have tighter spreads and faster execution, making them ideal for active trading. Understanding these mechanics helps you choose the right market and the right strategy for your goals.",
        type: "lesson",
        order: 2,
        duration: 15,
        moduleId: module1.id,
      },
    ],
  });

  const module2 = await prisma.module.create({
    data: {
      title: "Types of Markets",
      description:
        "Stocks, forex, crypto, commodities and indices explained",
      order: 2,
      courseId: course.id,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        title: "Stock and Equity Markets",
        content:
          "Stock markets allow you to buy and sell shares of publicly listed companies, giving you partial ownership in businesses ranging from startups to multinational corporations. These markets are often divided by region—U.S. equities trade on NYSE or NASDAQ, European stocks on Euronext or LSE—and by company size, from large-cap giants like Apple to small-cap growth names. Stocks are influenced by earnings reports, interest rates, economic data, and investor sentiment. For traders, equities offer opportunities around earnings announcements, product launches, and market rotations. However, individual stocks can be volatile, and gaps overnight can create significant risk. Diversification and understanding sector dynamics are essential parts of managing that exposure.",
        type: "lesson",
        order: 1,
        duration: 15,
        moduleId: module2.id,
      },
      {
        title: "Forex, Crypto, Commodities and Indices",
        content:
          "The foreign exchange, or forex, market is the largest financial market in the world, with trillions of dollars traded daily across currency pairs like EUR/USD or GBP/JPY. Forex operates 24 hours a day across major financial centers, offering high liquidity and leverage, which amplifies both potential gains and losses. Cryptocurrency markets trade decentralized digital assets such as Bitcoin and Ethereum, often characterized by high volatility, continuous trading, and evolving regulatory landscapes. Commodities include physical goods like gold, oil, and agricultural products, and they are influenced by supply disruptions, geopolitical events, and seasonal demand. Indices, such as the S&P 500 or FTSE 100, track baskets of stocks and allow traders to speculate on the broader direction of an entire market rather than individual companies. Each market has unique hours, drivers, and risk profiles, so choosing where to trade should align with your schedule, capital, and risk tolerance.",
        type: "lesson",
        order: 2,
        duration: 15,
        moduleId: module2.id,
      },
    ],
  });

  const module3 = await prisma.module.create({
    data: {
      title: "Reading Charts",
      description:
        "Price, time, candlesticks, support and resistance basics",
      order: 3,
      courseId: course.id,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        title: "Candlesticks and Price Action",
        content:
          "A candlestick is a visual representation of price movement over a specific timeframe, showing the open, high, low, and close prices for that period. The body of the candle indicates where the price opened and closed, while the wicks show the extremes reached during the session. A green or white candle means the price closed higher than it opened; a red or black candle means it closed lower. By studying sequences of candlesticks, traders can spot patterns that suggest bullish or bearish momentum—such as hammers, engulfing bars, or dojis. Price action trading relies on these patterns without overcomplicating analysis with indicators, focusing instead on what the market itself is revealing through buying and selling pressure.",
        type: "lesson",
        order: 1,
        duration: 15,
        moduleId: module3.id,
      },
      {
        title: "Support, Resistance and Trend Basics",
        content:
          "Support is a price level where buyers have historically stepped in to prevent further declines, while resistance is a level where sellers have emerged to halt rallies. These levels form because market psychology repeats: traders remember previous turning points and react similarly when price returns. A support level that breaks can become resistance, and vice versa, a phenomenon known as role reversal. Trends describe the general direction of price movement—uptrends make higher highs and higher lows, downtrends make lower lows and lower highs, and sideways markets trade within a range. Trading in the direction of the trend improves probability because momentum tends to persist. Beginners should practice drawing these levels on charts and watching how price reacts before entering trades, as recognizing support and resistance is one of the most foundational skills in technical analysis.",
        type: "lesson",
        order: 2,
        duration: 15,
        moduleId: module3.id,
      },
    ],
  });

  const module4 = await prisma.module.create({
    data: {
      title: "Your First Trade",
      description:
        "Place your first paper trade, manage it and analyse the result",
      order: 4,
      courseId: course.id,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        title: "Planning and Risk Management",
        content:
          "Before entering any trade, a clear plan defines your edge. Start by identifying the reason for the trade—whether it is a breakout, a support bounce, or a trend continuation—and write it down. Next, decide your entry price, stop-loss level, and profit target. The stop-loss is the price at which you will exit to limit losses, and it should be based on market structure, not on how much money you are willing to lose. A common rule is to risk no more than one to two percent of your trading capital on a single trade. Position sizing then follows: if your stop distance is large, you take a smaller position; if it is tight, you can take a larger one. This discipline keeps losses manageable and protects your account from devastating drawdowns when the market inevitably moves against you.",
        type: "lesson",
        order: 1,
        duration: 15,
        moduleId: module4.id,
      },
      {
        title: "Executing and Reviewing a Paper Trade",
        content:
          "A paper trade is a simulated trade using real market data but virtual money, and it is the safest way to practice without risking capital. Choose a liquid market you understand, apply your trading plan, and record the trade in a journal including your rationale, entry, stop, target, and outcome. Once the trade is open, monitor it without emotional interference: avoid moving your stop further away because you hope the market will turn, and avoid taking profits too early out of fear. When the trade closes, review the result objectively. Did you follow your plan? Was the entry well-timed? Did risk management protect you? Over time, this habit builds the self-awareness needed to transition to live trading with confidence. The goal of your first paper trade is not to make money—it is to prove that you can execute a process consistently.",
        type: "lesson",
        order: 2,
        duration: 15,
        moduleId: module4.id,
      },
    ],
  });

  console.log("Seed created:", course.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
