import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const VALID_SYMBOLS = ["RELIANCE.NS", "TCS.NS", "BTC-USD", "ETH-USD", "EUR-USD"];
const VALID_SIDES = ["buy", "sell"];
const VALID_ORDER_TYPES = ["market", "limit"];

function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[<>]/g, "");
}

function getMarketPrice(symbol: string): number {
  const prices: Record<string, number> = {
    "RELIANCE.NS": 2850,
    "TCS.NS": 3950,
    "BTC-USD": 67000,
    "ETH-USD": 3500,
    "EUR-USD": 1.08,
  };
  return prices[symbol] ?? 100;
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.profile.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        onboardingDone: false,
      },
      update: {},
    });

    const portfolio = await prisma.simulatorPortfolio.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, balance: 500000 },
      update: {},
    });

    const openPositions = await prisma.simulatorTrade.findMany({
      where: { clerkId: userId, status: "open" },
      orderBy: { openedAt: "desc" },
    });

    const tradeHistory = await prisma.simulatorTrade.findMany({
      where: { clerkId: userId, status: "closed" },
      orderBy: { closedAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      balance: portfolio.balance,
      openPositions,
      tradeHistory,
    });
  } catch (error) {
    console.error("Portfolio API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
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

    await prisma.profile.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        onboardingDone: false,
      },
      update: {},
    });

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

    const entryPrice = orderType === "limit" ? Number(limitPrice) : getMarketPrice(symbol);

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

    const portfolio = await prisma.simulatorPortfolio.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        balance: 500000,
      },
    });

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
    console.error("Trade placement error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
