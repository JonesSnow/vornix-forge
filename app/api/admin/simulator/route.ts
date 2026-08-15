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
            experienceLevel: true,
          },
        },
        trades: { orderBy: { openedAt: "desc" } },
      },
      orderBy: { balance: "desc" },
    });

    const totalPortfolioValue = portfolios.reduce((acc, p) => acc + p.balance, 0);

    const topTraders = portfolios
      .map((p) => {
        const trades = p.trades;
        const pnl = trades.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
        const closedTrades = trades.filter((t) => t.status === "closed");
        const winRate = closedTrades.length > 0
          ? Math.round((closedTrades.filter((t) => (t.pnl ?? 0) > 0).length / closedTrades.length) * 100)
          : 0;
        return {
          clerkId: p.clerkId,
          name: `${p.profile.firstName ?? ""} ${p.profile.lastName ?? ""}`.trim() || "Unknown",
          level: p.profile.experienceLevel ?? "N/A",
          balance: p.balance,
          pnl,
          trades: trades.length,
          winRate,
          openPositions: trades.filter((t) => t.status === "open").length,
        };
      })
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);

    const recentTrades = await prisma.simulatorTrade.findMany({
      orderBy: { openedAt: "desc" },
      take: 20,
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      totalPortfolioValue,
      topTraders,
      recentTrades: recentTrades.map((t) => ({
        id: t.id,
        clerkId: t.clerkId,
        name: `${t.profile.firstName ?? ""} ${t.profile.lastName ?? ""}`.trim() || "Unknown",
        symbol: t.symbol,
        side: t.side,
        quantity: t.quantity,
        entryPrice: t.entryPrice,
        pnl: t.pnl,
        status: t.status,
        openedAt: t.openedAt,
      })),
      portfolios: portfolios.map((p) => ({
        clerkId: p.clerkId,
        name: `${p.profile.firstName ?? ""} ${p.profile.lastName ?? ""}`.trim() || "Unknown",
        balance: p.balance,
        openPositions: p.trades.filter((t) => t.status === "open").length,
        totalPnl: p.trades.reduce((acc, t) => acc + (t.pnl ?? 0), 0),
      })),
    });
  } catch (error) {
    console.error("Admin simulator API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
