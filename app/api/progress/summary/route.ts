import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
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

    const completedModules = await prisma.progress.findMany({
      where: { clerkId: userId, completed: true },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
            order: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    const portfolio = await prisma.simulatorPortfolio.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        balance: 500000,
      },
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

    const journalCount = await prisma.journal.count({
      where: { clerkId: userId },
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

    const score = assessment?.score ?? 0;
    const level = assessment?.level ?? (score <= 40 ? 1 : score <= 60 ? 2 : score <= 80 ? 3 : 4);

    const completedLessons = await prisma.lessonProgress.findMany({
      where: { clerkId: userId, completed: true },
      select: { lessonId: true },
    });

    const radarData = [
      { skill: "Technical Analysis", value: Math.min(100, score + 5) },
      { skill: "Fundamental Analysis", value: Math.min(100, score - 5) },
      { skill: "Risk Management", value: Math.min(100, score + 10) },
      { skill: "Psychology", value: Math.min(100, score - 10) },
      { skill: "Chart Reading", value: Math.min(100, score + 8) },
      { skill: "Strategy", value: Math.min(100, score - 8) },
      { skill: "Execution", value: Math.min(100, score + 3) },
      { skill: "Market Knowledge", value: Math.min(100, score - 3) },
    ];

    return NextResponse.json({
      profile,
      assessment: assessment ? { score: assessment.score, level: assessment.level } : null,
      completedModules,
      completedLessons,
      openPositions,
      tradeHistory,
      totalPnl,
      winRate,
      journalCount,
      radarData,
      currentLevel: level,
      balance: portfolio?.balance ?? 500000,
    });
  } catch (error) {
    console.error("Progress summary API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
