import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const portfolio = await prisma.simulatorPortfolio.findUnique({
      where: { clerkId: userId },
      include: {
        trades: {
          where: { status: "open" },
          orderBy: { openedAt: "desc" },
        },
      },
    });

    if (!portfolio) {
      const newPortfolio = await prisma.simulatorPortfolio.create({
        data: {
          clerkId: userId,
          balance: 500000,
        },
        include: {
          trades: {
            where: { status: "open" },
            orderBy: { openedAt: "desc" },
          },
        },
      });
      return NextResponse.json({ portfolio: newPortfolio });
    }

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error("Portfolio API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const VALID_SYMBOLS = ["RELIANCE.NS", "TCS.NS", "BTC-USD", "ETH-USD", "EUR-USD"];
const VALID_SIDES = ["buy", "sell"];
const VALID_ORDER_TYPES = ["market", "limit"];

function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[<>]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const symbol = sanitizeString(body.symbol);
    const side = sanitizeString(body.side).toLowerCase();
    const quantity = Number(body.quantity);
    const orderType = sanitizeString(body.orderType).toLowerCase();
    const limitPrice = body.limitPrice !== undefined ? Number(body.limitPrice) : null;
    const stopLoss = body.stopLoss !== undefined ? Number(body.stopLoss) : null;
    const takeProfit = body.takeProfit !== undefined ? Number(body.takeProfit) : null;

    if (!VALID_SYMBOLS.includes(symbol)) {
      return NextResponse.json(
        { error: "Invalid symbol" },
        { status: 400 }
      );
    }

    if (!VALID_SIDES.includes(side)) {
      return NextResponse.json(
        { error: "Invalid side" },
        { status: 400 }
      );
    }

    if (!VALID_ORDER_TYPES.includes(orderType)) {
      return NextResponse.json(
        { error: "Invalid order type" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    }

    let entryPrice = 0;

    if (orderType === "limit") {
      entryPrice = Number(limitPrice);
    } else {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
      const res = await fetch(yahooUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: "Failed to fetch market price" },
          { status: 502 }
        );
      }

      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const meta = result?.meta;

      if (!meta?.regularMarketPrice) {
        return NextResponse.json(
          { error: "Market price unavailable" },
          { status: 502 }
        );
      }

      entryPrice = meta.regularMarketPrice;
    }

    if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
      return NextResponse.json(
        { error: "Invalid entry price" },
        { status: 400 }
      );
    }

    if (stopLoss !== null && (!Number.isFinite(stopLoss) || stopLoss <= 0)) {
      return NextResponse.json(
        { error: "Invalid stop loss" },
        { status: 400 }
      );
    }

    if (takeProfit !== null && (!Number.isFinite(takeProfit) || takeProfit <= 0)) {
      return NextResponse.json(
        { error: "Invalid take profit" },
        { status: 400 }
      );
    }

    const portfolio = await prisma.simulatorPortfolio.findUnique({
      where: { clerkId: userId },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    const positionValue = entryPrice * quantity;

    if (side === "buy" && portfolio.balance < positionValue) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const trade = await prisma.simulatorTrade.create({
      data: {
        clerkId: userId,
        portfolioId: portfolio.id,
        symbol,
        side,
        quantity,
        entryPrice,
        stopLoss: stopLoss ?? undefined,
        takeProfit: takeProfit ?? undefined,
        status: "open",
      },
    });

    if (side === "buy") {
      await prisma.simulatorPortfolio.update({
        where: { clerkId: userId },
        data: {
          balance: {
            decrement: positionValue,
          },
        },
      });
    }

    return NextResponse.json({ trade }, { status: 201 });
  } catch (error) {
    console.error("Trade API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
