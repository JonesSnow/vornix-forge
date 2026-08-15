import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_CLERK_IDS } from "@/lib/constants";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const portfolios = await prisma.simulatorPortfolio.findMany({
      include: {
        profile: {
          select: {
            clerkId: true,
            firstName: true,
            lastName: true,
          },
        },
        trades: {
          orderBy: { openedAt: "desc" },
          take: 20,
        },
      },
      orderBy: { balance: "desc" },
    });

    const totalPortfolioValue = portfolios.reduce((acc, p) => acc + p.balance, 0);

    const allTrades = await prisma.simulatorTrade.findMany({
      orderBy: { openedAt: "desc" },
      take: 50,
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const topTraders = portfolios
      .map((p) => ({
        clerkId: p.clerkId,
        name: `${p.profile.firstName ?? ""} ${p.profile.lastName ?? ""}`.trim() || "Unknown",
        balance: p.balance,
        pnl: p.trades.reduce((acc, t) => acc + (t.pnl ?? 0), 0),
        trades: p.trades.length,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);

    return NextResponse.json({
      totalPortfolioValue,
      topTraders,
      recentTrades: allTrades.map((t) => ({
        id: t.id,
        clerkId: t.clerkId,
        name: `${t.profile.firstName ?? ""} ${t.profile.lastName ?? ""}`.trim() || "Unknown",
        symbol: t.symbol,
        side: t.side,
        pnl: t.pnl,
        status: t.status,
        openedAt: t.openedAt,
      })),
    });
  } catch (error) {
    console.error("Admin simulator API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
