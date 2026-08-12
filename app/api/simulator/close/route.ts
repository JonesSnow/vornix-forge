import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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
    const tradeId = typeof body.tradeId === "string" ? body.tradeId.trim() : "";

    if (!tradeId) {
      return NextResponse.json(
        { error: "tradeId is required" },
        { status: 400 }
      );
    }

    const trade = await prisma.simulatorTrade.findUnique({
      where: { id: tradeId },
    });

    if (!trade || trade.clerkId !== userId) {
      return NextResponse.json(
        { error: "Trade not found" },
        { status: 404 }
      );
    }

    if (trade.status !== "open") {
      return NextResponse.json(
        { error: "Trade is already closed" },
        { status: 400 }
      );
    }

    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(trade.symbol)}?interval=1d&range=1d`;
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

    const exitPrice = meta.regularMarketPrice;
    const pnl =
      trade.side === "buy"
        ? (exitPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - exitPrice) * trade.quantity;

    const closedTrade = await prisma.simulatorTrade.update({
      where: { id: tradeId },
      data: {
        status: "closed",
        exitPrice,
        pnl,
        closedAt: new Date(),
      },
    });

    if (trade.side === "buy") {
      const positionValue = trade.entryPrice * trade.quantity;
      const returnValue = exitPrice * trade.quantity;
      const netReturn = returnValue + pnl;

      await prisma.simulatorPortfolio.update({
        where: { clerkId: userId },
        data: {
          balance: {
            increment: netReturn,
          },
        },
      });
    }

    return NextResponse.json({ trade: closedTrade });
  } catch (error) {
    console.error("Close trade API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
