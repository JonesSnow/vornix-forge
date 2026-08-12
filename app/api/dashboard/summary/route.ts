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

    const profile = await prisma.profile.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, onboardingDone: false },
      update: {},
    });

    const assessment = await prisma.assessment.findUnique({
      where: { clerkId: userId },
    });

    const modulesCompleted = await prisma.progress.count({
      where: { clerkId: userId, completed: true },
    });

    const portfolio = await prisma.simulatorPortfolio.findUnique({
      where: { clerkId: userId },
      include: {
        trades: {
          select: {
            id: true,
            symbol: true,
            side: true,
            status: true,
            pnl: true,
            openedAt: true,
            closedAt: true,
          },
        },
      },
    });

    const openPositions = portfolio?.trades.filter((t) => t.status === "open") ?? [];
    const tradeHistory = portfolio?.trades
      .filter((t) => t.status === "closed")
      .sort((a, b) => new Date(b.closedAt ?? b.openedAt).getTime() - new Date(a.closedAt ?? a.openedAt).getTime())
      .slice(0, 10);

    const totalPnl = portfolio?.trades.reduce((acc, t) => acc + (t.pnl ?? 0), 0) ?? 0;
    const closedTrades = portfolio?.trades.filter((t) => t.status === "closed") ?? [];
    const winRate = closedTrades.length > 0
      ? Math.round((closedTrades.filter((t) => (t.pnl ?? 0) > 0).length / closedTrades.length) * 100)
      : 0;

    const journalCount = await prisma.journal.count({
      where: { clerkId: userId },
    });

    const score = assessment?.score ?? 0;
    const level = assessment?.level ?? (score <= 40 ? 1 : score <= 60 ? 2 : score <= 80 ? 3 : 4);

    return NextResponse.json({
      profile,
      assessment: assessment ? { score: assessment.score, level: assessment.level } : null,
      modulesCompleted,
      openPositions,
      tradeHistory,
      totalPnl,
      winRate,
      journalCount,
      currentLevel: level,
      balance: portfolio?.balance ?? 500000,
    });
  } catch (error) {
    console.error("Dashboard summary API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
