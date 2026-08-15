import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingL1 = await prisma.course.findFirst({ where: { level: 1 } });
  if (!existingL1) {
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

    console.log("Seeded Level 1:", course.title);
  } else {
    console.log("Level 1 already exists, skipping");
  }

  const existingL2 = await prisma.course.findFirst({ where: { level: 2 } });
  if (!existingL2) {
    const courseL2 = await prisma.course.create({
      data: {
        title: "Technical Analysis — Reading the Market",
        description:
          "Master chart reading, key indicators, and pattern recognition to identify high-probability trade setups.",
        level: 2,
        order: 2,
      },
    });

    const mod1 = await prisma.module.create({
      data: {
        title: "Support and Resistance",
        description:
          "Identify key levels, trade bounces and breakouts with confidence",
        order: 1,
        courseId: courseL2.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: "Identifying Support and Resistance Zones",
          content:
            "Support and resistance are the foundation of technical analysis. Support is a price level where buyers have historically stepped in to prevent further decline — think of it as a floor. Resistance is where sellers consistently appear to cap upward moves — a ceiling. These levels form because of market memory: traders who bought at a level and saw price rise remember that price, and when price returns they buy again. Similarly, traders trapped in losing positions wait for price to return to their entry to exit, creating selling pressure at resistance. To identify strong zones look for multiple touches over different time periods. A level touched three or more times across weeks or months is far more significant than one touched twice in a single day. The more time between touches the stronger the level. Also note the left side of the chart — old resistance often becomes new support once price breaks above it, and old support becomes resistance after a breakdown. This flip concept is one of the most powerful tools in technical analysis.",
          type: "lesson",
          order: 1,
          duration: 15,
          moduleId: mod1.id,
        },
        {
          title: "Trading Bounces and Breakouts",
          content:
            "Once you identify support and resistance zones you have two primary trade types: the bounce and the breakout. A bounce trade assumes the level holds — you buy near support expecting price to rise, or sell near resistance expecting price to fall. The key to bounce trades is patience and confirmation. Do not buy the moment price touches support. Wait for a rejection candle — a hammer, bullish engulfing, or strong close off the level — that shows buyers are actually stepping in. Enter after confirmation with a stop just below the support zone. Breakout trades assume the level fails. When price breaks above resistance or below support with strong momentum and volume, the broken level becomes the new support or resistance. The classic breakout entry is on the retest — wait for price to break the level, pull back to test it from the other side, then enter in the direction of the break. This approach filters out false breakouts which are extremely common. A false breakout occurs when price briefly pierces a level then snaps back — these are traps designed to take out stops before the real move. Always look for volume expansion on a true breakout and volume contraction on a false one.",
          type: "lesson",
          order: 2,
          duration: 15,
          moduleId: mod1.id,
        },
      ],
    });

    const mod2 = await prisma.module.create({
      data: {
        title: "Candlestick Patterns",
        description:
          "Single and multi-candle patterns that reveal market psychology",
        order: 2,
        courseId: courseL2.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: "Single Candlestick Patterns",
          content:
            "Candlesticks tell you the story of a single time period's battle between buyers and sellers. The body shows where price opened and closed. The wicks show how far price traveled before reversing. A large body with small wicks means one side dominated completely. Large wicks with a small body — called a doji or spinning top — means neither side won decisively, signaling indecision and potential reversal. The hammer is one of the most important single candle patterns. It has a small body at the top and a long lower wick at least twice the body length. It forms when sellers drive price down aggressively but buyers recover most of the loss by close. At support this signals buyers are defending the level strongly. The shooting star is the mirror image — small body at bottom, long upper wick — forming at resistance and signaling sellers rejected the highs. The key rule with all single candle patterns is context. A hammer in the middle of a trend means nothing. A hammer at a key support level after a significant decline means everything. Always ask where the pattern is forming before giving it weight.",
          type: "lesson",
          order: 1,
          duration: 15,
          moduleId: mod2.id,
        },
        {
          title: "Multi-Candlestick Patterns",
          content:
            "Multi-candle patterns provide stronger signals than single candles because they show a shift in momentum over multiple periods. The engulfing pattern is the most reliable. A bullish engulfing occurs when a bearish candle is followed by a bullish candle whose body completely engulfs the previous body. This shows buyers overpowered sellers so completely that they erased all of the previous session's losses and added more. At support after a downtrend this is a powerful reversal signal. The bearish engulfing is the mirror at resistance. The morning star is a three-candle reversal pattern at bottoms. First a large bearish candle showing selling pressure. Then a small-bodied indecision candle showing selling is exhausting. Then a large bullish candle confirming buyers have taken control. The evening star is the bearish equivalent at tops. Three white soldiers — three consecutive bullish candles each closing near their highs — signal strong buying momentum but use caution as this pattern often appears late in a move after most of the gain has occurred. The critical principle for all multi-candle patterns is that they must appear at significant price levels to be meaningful. A bullish engulfing at random in the middle of a chart is noise. The same pattern at a six-month support level is a genuine signal worth trading.",
          type: "lesson",
          order: 2,
          duration: 15,
          moduleId: mod2.id,
        },
      ],
    });

    const mod3 = await prisma.module.create({
      data: {
        title: "Moving Averages",
        description:
          "SMA vs EMA, period selection, crossovers and common mistakes",
        order: 3,
        courseId: courseL2.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: "Simple and Exponential Moving Averages",
          content:
            "A moving average smooths price action by calculating the average price over a set number of periods. The simple moving average gives equal weight to every period. The exponential moving average gives more weight to recent prices making it more responsive to current conditions. Traders use specific period settings because they align with natural market cycles. The 20-period MA represents roughly one month of trading days — short-term trend. The 50-period represents a quarter — medium-term trend. The 200-period represents a full year — long-term trend. When price is above the 200 MA the long-term trend is up and you should look for buying opportunities. Below the 200 MA look for selling. The MA also acts as dynamic support and resistance. In a strong uptrend price often bounces off the 20 or 50 MA on pullbacks before continuing higher. These pullback-to-MA entries are among the highest probability setups in trending markets. The EMA reacts faster to price changes making it more useful for short-term traders. The SMA smooths out noise better making it more useful for identifying long-term trend direction. Most professional traders use both — EMA for entries and SMA for trend context.",
          type: "lesson",
          order: 1,
          duration: 15,
          moduleId: mod3.id,
        },
        {
          title: "Moving Average Crossovers and Strategies",
          content:
            "The golden cross occurs when a shorter-period MA crosses above a longer-period MA — typically the 50 crossing above the 200. This signals a potential shift from bearish to bullish trend and is one of the most widely watched signals in markets. The death cross is the opposite: 50 crossing below 200, signaling potential bearish shift. These signals are powerful but lagging — by the time the cross occurs price has often already moved significantly. Using crossovers as entry signals often means buying after a large portion of the move has happened. A better approach is to use the cross to define your bias then wait for price to pull back to the MA itself for a lower-risk entry. The most common mistake traders make with moving averages is using them in ranging or choppy markets. When price is oscillating above and below the MA repeatedly the indicator generates endless false signals. MAs work best in trending conditions. Before applying MA strategies identify whether the market is trending or ranging. If price is moving in a clear direction with higher highs and higher lows MAs are useful. If price is moving sideways in a box use support and resistance levels instead.",
          type: "lesson",
          order: 2,
          duration: 15,
          moduleId: mod3.id,
        },
      ],
    });

    const mod4 = await prisma.module.create({
      data: {
        title: "Key Indicators",
        description:
          "RSI, MACD and Bollinger Bands for momentum and volatility",
        order: 4,
        courseId: courseL2.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: "RSI and Momentum",
          content:
            "The Relative Strength Index measures the speed and magnitude of price movements on a scale of 0 to 100. Above 70 is traditionally considered overbought — price has risen too far too fast and may be due for a pullback. Below 30 is oversold — price has fallen too far too fast. However using RSI purely as an overbought and oversold signal is one of the most common and costly mistakes in trading. In a strong trend RSI can stay above 70 for weeks or below 30 for weeks while price continues moving. Buying because RSI is oversold in a downtrend is fighting the trend. The most powerful RSI signal is divergence. Bullish divergence occurs when price makes a lower low but RSI makes a higher low — showing that selling momentum is weakening even as price falls. This often precedes reversals at key support levels. Bearish divergence is price making higher highs while RSI makes lower highs — weakening buying momentum at resistance. RSI works best in ranging markets where overbought and oversold readings are more reliable, and divergence works best at significant support and resistance levels. Never use RSI in isolation — always combine with price structure.",
          type: "lesson",
          order: 1,
          duration: 15,
          moduleId: mod4.id,
        },
        {
          title: "MACD and Bollinger Bands",
          content:
            "The MACD consists of two lines and a histogram. The MACD line is the difference between the 12 and 26 period EMAs. The signal line is a 9-period EMA of the MACD line. When the MACD line crosses above the signal line it suggests bullish momentum. When it crosses below it suggests bearish momentum. The histogram shows the difference between these two lines — growing bars mean momentum is increasing, shrinking bars mean it is fading. Like all indicators MACD is most useful for confirming what you already see in price action rather than generating standalone signals. Bollinger Bands place a standard deviation envelope around a 20-period moving average. The bands expand when volatility is high and contract when volatility is low. The squeeze — when bands contract to their narrowest — signals that a significant move is coming though not the direction. When price touches the upper band it is statistically extended to the upside. When it touches the lower band it is extended to the downside. In trending markets price can walk along the bands for extended periods. The most reliable Bollinger Band signal is the W-bottom: price touches the lower band, bounces, pulls back to near the lower band but does not touch it, then rallies — showing that selling pressure is exhausting. These two indicators complement each other well: use Bollinger Bands for volatility context and potential reversal zones, MACD for momentum confirmation.",
          type: "lesson",
          order: 2,
          duration: 15,
          moduleId: mod4.id,
        },
      ],
    });

    console.log("Seeded Level 2:", courseL2.title);
  } else {
    console.log("Level 2 already exists, skipping");
  }

  const existingL3 = await prisma.course.findFirst({ where: { level: 3 } });
  if (!existingL3) {
    const courseL3 = await prisma.course.create({
      data: {
        title: "Risk and Money Management — Protecting Your Capital",
        description:
          "The difference between traders who last and those who blow up. Master position sizing, stop losses, and the psychology of risk.",
        level: 3,
        order: 3,
      },
    });

    const mod1 = await prisma.module.create({
      data: {
        title: "Position Sizing",
        description:
          "1% rule, Kelly criterion, scaling in and out",
        order: 1,
        courseId: courseL3.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: "The 1% Rule and Fixed Risk",
          content:
            "Position sizing is the single most important skill in trading yet it receives almost no attention in popular trading education. Most traders focus obsessively on entry signals while completely ignoring how much they risk on each trade. This is backwards. Your entry determines your opportunity. Your position size determines your survival. The 1% rule states that you should never risk more than 1 to 2 percent of your total trading capital on any single trade. If you have a ₹5 lakh account you risk ₹5000 to ₹10000 per trade maximum. This sounds conservative but consider the math of losing streaks. Even a good trading system will have losing streaks of 8 to 10 trades in a row. At 1% risk per trade a 10-trade losing streak costs you 10% of your account. Painful but survivable. At 10% risk per trade the same streak wipes out your entire account. To calculate your position size you need three numbers: your account size, your risk percentage, and your stop loss distance in rupees per share. Divide your risk amount by your stop distance to get your position size. If you have ₹5 lakh, risk 1% which is ₹5000, and your stop is ₹50 away from entry, you buy 100 shares. This mathematical approach removes emotion from sizing decisions and ensures a single loss can never be catastrophic.",
          type: "lesson",
          order: 1,
          duration: 15,
          moduleId: mod1.id,
        },
        {
          title: "Advanced Position Sizing",
          content:
            "Once you understand fixed risk position sizing you can explore more sophisticated approaches. Scaling in means entering a position in multiple pieces rather than all at once. You might enter half your intended position at the initial setup, then add the second half if price confirms your thesis by breaking a key level. This approach reduces risk on trades that fail immediately while allowing full exposure on trades that show early confirmation. Scaling out means taking partial profits at different levels. If your target is ₹100 away you might close half the position at ₹60, move your stop to breakeven on the remainder, and let the rest run to full target. This locks in some profit while giving the trade room to reach maximum potential. The Kelly Criterion is a mathematical formula for optimal position sizing based on your win rate and average win-loss ratio. While the full Kelly is too aggressive for most traders half Kelly or quarter Kelly provides a theoretically optimal approach to growing capital while managing drawdown. The most important advanced concept is correlation risk. If you have three open trades all in Nifty 50 stocks that move together your actual risk is far higher than 1% per trade suggests. In a market selloff all three will lose simultaneously. Always consider whether your open positions are correlated and reduce individual size accordingly when they are.",
          type: "lesson",
          order: 2,
          duration: 15,
          moduleId: mod1.id,
        },
      ],
    });

    const mod2 = await prisma.module.create({
      data: {
        title: "Stop Loss Mastery",
        description:
          "Types of stops, placement strategy, and volatility-based stops",
        order: 2,
        courseId: courseL3.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: "Types of Stop Losses",
          content:
            "A stop loss is your predetermined exit point if a trade moves against you. It is not optional. Trading without a stop loss is not trading — it is gambling with unlimited downside. There are several types of stop losses each suited to different situations. A hard stop is a fixed price level entered as an actual order with your broker. It executes automatically regardless of whether you are watching the screen. This is the most disciplined approach and the one professionals use. A mental stop is a price level you intend to exit at but have not placed as an actual order. Mental stops almost always fail because when price reaches them emotions override discipline and traders convince themselves to give the trade more room. Never use mental stops. A trailing stop moves with price in your favor, locking in profits as the trade moves your way. If you are long and price rises ₹50, a ₹30 trailing stop moves up ₹50 with it protecting ₹30 of your profit. The ATR-based stop uses the Average True Range indicator to set stops at a distance proportional to recent volatility. In a volatile market your stop needs to be wider to avoid being stopped out by normal price movement. One ATR to two ATR below your entry is a common ATR-based stop placement. Time stops exit a trade if it has not moved in your favor within a set time period. If a trade is not working within your expected timeframe exit and redeploy capital into a better opportunity.",
          type: "lesson",
          order: 1,
          duration: 15,
          moduleId: mod2.id,
        },
        {
          title: "Stop Loss Placement Strategy",
          content:
            "Where you place your stop loss is as important as whether you use one. Poor stop placement leads to being stopped out of perfectly good trades before they move in your direction. The most important principle is to place stops beyond market structure — beyond levels where price would have to move to prove your trade thesis wrong. If you buy at support your stop goes below the support zone not at it. Price often dips slightly below support before reversing — a phenomenon called a liquidity sweep or stop hunt where institutions push price to obvious stop levels to fill their own large orders before the real move begins. Placing your stop just below the zone rather than at the exact level gives the trade room to breathe through these sweeps. Avoid round numbers. If support is at 2800 everyone places their stops at 2799 or 2800. Sophisticated traders know this and push price to 2795 to trigger those stops before reversing. Place your stop at 2788 or 2785 — below where the crowd stops. The relationship between your stop distance and your position size is critical. Wider stops require smaller positions. If the only place your stop makes structural sense is ₹200 away but you want to risk only ₹5000 then you trade 25 shares. Never widen your stop to accommodate a larger position. Size down to fit the structure.",
          type: "lesson",
          order: 2,
          duration: 15,
          moduleId: mod2.id,
        },
      ],
    });

    const mod3 = await prisma.module.create({
      data: {
        title: "Risk-Reward and Expectancy",
        description:
          "Understand why risk-reward beats win rate and measure expectancy",
        order: 3,
        courseId: courseL3.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: "Understanding Risk-Reward Ratios",
          content:
            "Risk-reward ratio compares how much you stand to lose on a trade to how much you stand to gain. A 1:2 risk-reward means for every ₹1 you risk you aim to make ₹2. This simple concept has profound implications for long-term profitability. Consider two traders. Trader A wins 70% of trades but only makes ₹1 for every ₹1.50 they risk — a 1:0.67 ratio. Trader B wins only 40% of trades but makes ₹3 for every ₹1 they risk — a 1:3 ratio. Over 100 trades Trader A makes 70 wins at ₹1 minus 30 losses at ₹1.50 equals ₹70 minus ₹45 equals ₹25 net. Trader B makes 40 wins at ₹3 minus 60 losses at ₹1 equals ₹120 minus ₹60 equals ₹60 net. Trader B makes more than twice as much with less than half the win rate. This is the power of risk-reward. The minimum acceptable risk-reward for most professional traders is 1:2. At 1:2 you only need to be right 34% of the time to break even. At 1:3 you break even winning just 25% of trades. This means you can be wrong most of the time and still make money as long as your winners are significantly larger than your losers.",
          type: "lesson",
          order: 1,
          duration: 15,
          moduleId: mod3.id,
        },
        {
          title: "Building Positive Expectancy",
          content:
            "Expectancy is the average amount you expect to make per rupee risked over many trades. It combines your win rate with your average win size and loss size into a single number that tells you whether your system makes money over time. The formula is: Expectancy equals win rate multiplied by average win minus loss rate multiplied by average loss. If you win 45% of trades with an average win of ₹3000 and lose 55% of trades with an average loss of ₹1000 your expectancy is 0.45 times 3000 minus 0.55 times 1000 equals 1350 minus 550 equals ₹800 per trade. A positive expectancy means your system is profitable over a large sample. Negative expectancy means it loses money regardless of how good any individual trade feels. The critical insight is that you cannot determine whether your system has positive expectancy from 10 or 20 trades. You need a minimum of 50 trades ideally 100 or more to get a statistically meaningful reading. This is why keeping a detailed trade journal is not optional — it is how you measure and prove your edge. Many traders abandon profitable systems after short losing streaks because they have no data proving the system works. Traders who track their expectancy religiously have the confidence to continue executing during inevitable drawdowns because they know the math works in their favor.",
          type: "lesson",
          order: 2,
          duration: 15,
          moduleId: mod3.id,
        },
      ],
    });

    const mod4 = await prisma.module.create({
      data: {
        title: "Trading Psychology Foundation",
        description:
          "Emotional cycle, revenge trading, and process over outcome",
        order: 4,
        courseId: courseL3.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: "The Emotional Cycle of Trading",
          content:
            "Every trader experiences a predictable emotional cycle that destroys profitability if left unmanaged. Understanding this cycle intellectually is the first step to breaking it. The cycle begins with optimism when you enter a trade. If the trade moves in your favor optimism becomes excitement then euphoria. In the euphoric state traders hold winners too long hoping for more, ignore their profit targets, and eventually give back gains. If the trade moves against you optimism becomes anxiety then fear. Fear causes premature exits — cutting winners short or refusing to let a trade develop. After a loss comes disappointment. A string of losses produces despondency and hopelessness. At peak despondency many traders abandon their system entirely — often right before it would have started working. After a period away optimism returns and the cycle repeats. Revenge trading is one of the most destructive emotional responses. After a loss the ego demands to recover that money immediately. The trader enters a new trade not because the setup is good but because they need to win. This trade is typically oversized, poorly planned, and results in another loss. The solution is to build rules that activate after losses: mandatory break after two consecutive losses, reduced position size after a losing day, no trading for the rest of the session after hitting a daily loss limit.",
          type: "lesson",
          order: 1,
          duration: 15,
          moduleId: mod4.id,
        },
        {
          title: "Building Process Over Outcome",
          content:
            "The most important mindset shift in trading is separating process from outcome. A good process can produce a losing trade. A bad process can produce a winning trade by luck. Evaluating your performance based on individual trade outcomes rather than decision quality leads to reinforcing bad habits when lucky trades win and abandoning good habits when unlucky trades lose. Process focus means asking after every trade not did I make money but did I follow my rules. Did I wait for my setup? Did I size correctly? Did I place my stop where my plan said? Did I exit according to my rules? If the answer to all these questions is yes then the trade was a success regardless of whether it made money. Over hundreds of trades a good process produces good outcomes. Outcomes on individual trades are partially random. Building a pre-trade routine creates the conditions for process-focused trading. Before every trade write down your setup criteria and whether this trade meets them, your entry price, your stop level, your target, your position size, and your rationale. This five minute exercise forces deliberate thinking and prevents impulsive entries. Post-trade review is equally important. After closing every trade record what actually happened versus your plan. Over time patterns emerge — you might discover you exit winning trades too early on Fridays, or that your best trades come from one specific setup type. This data is more valuable than any indicator or system.",
          type: "lesson",
          order: 2,
          duration: 15,
          moduleId: mod4.id,
        },
      ],
    });

    console.log("Seeded Level 3:", courseL3.title);
  } else {
    console.log("Level 3 already exists, skipping");
  }

  const existingL4 = await prisma.course.findFirst({ where: { level: 4 } });
  if (!existingL4) {
    const courseL4 = await prisma.course.create({
      data: {
        title: "Advanced Trading — Professional Setups and Systems",
        description:
          "Chart patterns, volume analysis, multi-timeframe trading, and building a complete professional trading system.",
        level: 4,
        order: 4,
      },
    });

    const mod1 = await prisma.module.create({
      data: {
        title: "Chart Patterns",
        description:
          "Reversal and continuation patterns with measured move targets",
        order: 1,
        courseId: courseL4.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: "Reversal Patterns",
          content:
            "Chart patterns are formations in price action that repeat across markets and timeframes because they reflect recurring human psychology. Reversal patterns signal that the current trend is ending and a new trend in the opposite direction is beginning. The head and shoulders is the most reliable reversal pattern in technical analysis. It forms at market tops with three peaks: a left shoulder, a higher head, and a right shoulder roughly equal to the left. The neckline connects the lows between these peaks. When price breaks below the neckline the pattern is confirmed and the measured target is the distance from the head to the neckline projected downward from the break point. Volume typically decreases on the right shoulder and expands on the neckline break confirming institutional selling. The inverse head and shoulders forms at bottoms and signals bullish reversal. The double top forms when price makes two peaks at approximately the same level separated by a trough. It signals that buyers attempted twice to push price higher but failed both times. Confirmation comes on the break below the trough between the peaks. The double bottom is the mirror image at lows. The rounding bottom or saucer forms over extended periods and signals a gradual shift from selling to buying pressure. It lacks a specific trigger point making it harder to trade but the gradual change in momentum it represents is significant.",
          type: "lesson",
          order: 1,
          duration: 15,
          moduleId: mod1.id,
        },
        {
          title: "Continuation Patterns",
          content:
            "Continuation patterns form during pauses in an existing trend before price resumes in the original direction. They represent periods of consolidation where the market digests gains or losses before continuing. Flags and pennants are the most common and reliable continuation patterns. A bull flag forms after a sharp upward move — the flagpole — followed by a rectangular consolidation with slightly downward sloping parallel lines — the flag. The pattern completes when price breaks above the upper boundary of the flag. The measured target is the length of the flagpole added to the breakout point. A pennant is similar but the consolidation forms converging lines creating a small symmetrical triangle rather than a rectangle. Wedges can be continuation or reversal patterns depending on context. A rising wedge in an uptrend is a bearish continuation signal — the narrowing price action shows weakening buying pressure. A falling wedge in a downtrend is bullish continuation. Rectangles or boxes form when price oscillates between a clear support and resistance level. In a trending market these boxes represent resting periods before continuation. The measured target for most continuation patterns equals the size of the previous move projected from the breakout point. Volume analysis is critical for all pattern trading — genuine breakouts from continuation patterns occur with expanding volume confirming institutional participation in the move.",
          type: "lesson",
          order: 2,
          duration: 15,
          moduleId: mod1.id,
        },
      ],
    });

    const mod2 = await prisma.module.create({
      data: {
        title: "Volume Analysis",
        description:
          "Reading volume, volume profile and VWAP",
        order: 2,
        courseId: courseL4.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: "Reading Volume",
          content:
            "Volume is the number of shares or contracts traded in a given period. It is the most honest indicator available because it cannot be faked — it represents actual money changing hands. The cardinal rule of volume analysis is that volume confirms price. When price rises on high volume the move has institutional backing and is more likely to continue. When price rises on low volume the move is weak and likely to reverse. Climax volume occurs when volume reaches extreme levels — often five to ten times normal — after an extended move. Buying climax: a rapid price surge accompanied by extreme volume at the end of an uptrend. Sophisticated traders recognize this as institutional distribution — large players selling their positions to retail traders who are buying in a frenzy. The price often peaks on or near the climax volume bar. Selling climax is the mirror: extreme volume after a prolonged decline signals institutional accumulation. Volume divergence is a powerful warning signal. If price makes new highs but volume is declining institutions are not participating in the move. They are selling into retail buying. This frequently precedes reversals. Similarly price making lower lows on declining volume suggests selling is exhausting and a reversal may be near. Always compare current volume to the average volume over the past 20 periods. Volume only becomes meaningful in relation to what is normal for that stock or instrument.",
          type: "lesson",
          order: 1,
          duration: 15,
          moduleId: mod2.id,
        },
        {
          title: "Volume Profile and VWAP",
          content:
            "Volume Profile shows the distribution of trading volume at each price level over a selected period rather than across time. It reveals where the most trading activity has occurred creating a profile that shows high volume nodes and low volume nodes. The Point of Control is the price level with the highest volume — where the most trading has occurred. Price tends to be attracted to the Point of Control and often returns to it after moving away. The Value Area contains 70% of all trading volume and represents fair value for the instrument during the period. Price inside the value area is considered fairly valued. Price outside the value area is considered extended and more likely to revert toward it. Low Volume Nodes are price areas where little trading occurred. Price tends to move through these levels quickly because there is little historical interest at those prices making them useful for projecting how far a move will travel. The Volume Weighted Average Price is the average price weighted by volume. It is the institutional benchmark for trade execution — large funds judge their performance against VWAP. In intraday trading price above VWAP is considered bullish and below is bearish. VWAP resets daily making it most useful for intraday traders. Price bouncing off VWAP on pullbacks in a trending day provides high probability entry opportunities aligned with institutional order flow.",
          type: "lesson",
          order: 2,
          duration: 15,
          moduleId: mod2.id,
        },
      ],
    });

    const mod3 = await prisma.module.create({
      data: {
        title: "Multi-Timeframe Analysis",
        description:
          "Top-down analysis, confluence and high probability setups",
        order: 3,
        courseId: courseL4.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: "Timeframe Hierarchy",
          content:
            "Markets exist simultaneously across multiple timeframes and each timeframe tells a different part of the story. Professional traders always analyze from the highest relevant timeframe down to their entry timeframe — a top-down approach that ensures they are trading in alignment with the dominant trend rather than fighting it. The weekly chart defines the macro trend and major support and resistance levels. If the weekly trend is clearly down any trade taken on lower timeframes should be short or at minimum cautious about long positions. The daily chart defines the intermediate trend and provides the most reliable support and resistance levels for swing traders. It filters out intraday noise and shows the true structure of price movement. The four-hour chart shows the short-term trend within the context of the daily. It reveals swing highs and lows that are not visible on the daily but more significant than intraday levels. The one-hour and fifteen-minute charts are entry timeframes — where you find specific patterns and price action signals to time your entry. The principle is: use higher timeframes for direction and bias, lower timeframes for precise entry. A long trade on the fifteen-minute chart should align with bullish structure on the four-hour and daily charts. When all timeframes align the probability of success is highest. When timeframes conflict it is often best to stand aside and wait for clarity.",
          type: "lesson",
          order: 1,
          duration: 15,
          moduleId: mod3.id,
        },
        {
          title: "Confluence and High Probability Setups",
          content:
            "Confluence is the alignment of multiple independent factors pointing to the same trade conclusion. Every additional confirming factor reduces the probability that you are seeing a random coincidence and increases the probability of a genuine setup. A trade with a single reason to enter — RSI is oversold for example — is a low quality trade. A trade where price is at a weekly support level, the daily trend is bullish, there is a bullish engulfing candle on the daily, RSI shows bullish divergence, and VWAP is just below as additional support — this is a high confluence setup where multiple independent factors agree. Building a confluence checklist helps you evaluate setup quality objectively before entering. Rate each factor as present or absent and require a minimum score before taking a trade. Example checklist: higher timeframe trend alignment, price at significant support or resistance, candle pattern confirmation, indicator confirmation, volume confirmation. Requiring three or more factors present before entering will dramatically reduce trade frequency but significantly increase win rate and risk-reward quality. High probability trading is not about trading often — it is about being extremely selective and sizing confidently when all factors align. Professional traders often make their best returns from just a handful of perfectly aligned setups per month, not from trading every day.",
          type: "lesson",
          order: 2,
          duration: 15,
          moduleId: mod3.id,
        },
      ],
    });

    const mod4 = await prisma.module.create({
      data: {
        title: "Building Your Trading System",
        description:
          "Entry rules, exit rules, position sizing and backtesting",
        order: 4,
        courseId: courseL4.id,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          title: "Components of a Complete Trading System",
          content:
            "A trading system is a complete set of rules that defines every decision you make as a trader — from when to look for trades to when to exit and everything in between. Without a system you are not trading, you are reacting emotionally to price movement. A complete system has six components. First: market selection. What instruments do you trade? Indian equities, Nifty options, forex pairs? Defining your universe prevents you from chasing random opportunities in unfamiliar markets. Second: market conditions. Under what market conditions does your strategy perform? Trending markets, ranging markets, high volatility or low? Define when NOT to trade as clearly as when to trade. Third: entry rules. Exact criteria that must be met before entering. Not vague conditions like looks bullish but specific: price is above 50-day MA, there is a bullish engulfing at support, RSI is below 60, volume is above average. Fourth: position sizing. Exactly how much to risk per trade calculated from account size and stop distance. Fifth: exit rules. Both stop loss placement rules and profit target rules. Trailing stop criteria if used. What causes early exit before stop or target. Sixth: trade management. What do you do while in a trade? Move stop to breakeven after X points profit? Scale out at first target? The more specific your rules the less room for emotional decisions and the more consistent your execution.",
          type: "lesson",
          order: 1,
          duration: 15,
          moduleId: mod4.id,
        },
        {
          title: "Backtesting and Forward Testing",
          content:
            "Before trading real money with any system you must test it on historical data to determine whether it has positive expectancy. Backtesting is the process of applying your trading rules to past price data to see how the system would have performed. Manual backtesting involves scrolling through historical charts and identifying every instance where your entry criteria were met, recording the trade outcome, and calculating statistics. While more time-consuming than automated backtesting it forces deep familiarity with how your system behaves across different market conditions. To backtest properly you need a minimum sample of 100 trades across different market environments — trending up, trending down, and sideways. A system that only works in bull markets will destroy capital when conditions change. Key metrics to track during backtesting: win rate, average win size, average loss size, maximum consecutive losses, maximum drawdown percentage, and total return. Be ruthless about eliminating hindsight bias — the tendency to only count trades that worked out and ignore ones you would have struggled to take in real time. Forward testing or paper trading applies your system in real-time without real money. This is what the Vornix Forge simulator is designed for. Forward testing reveals psychological challenges that backtesting cannot — how it feels to watch a position go against you, the temptation to deviate from rules in real-time. Only after successful forward testing over at least 50 trades should you consider trading with real capital.",
          type: "lesson",
          order: 2,
          duration: 15,
          moduleId: mod4.id,
        },
      ],
    });

    console.log("Seeded Level 4:", courseL4.title);
  } else {
    console.log("Level 4 already exists, skipping");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
