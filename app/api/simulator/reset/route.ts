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

    const portfolio = await prisma.simulatorPortfolio.upsert({
      where: { clerkId: userId },
      update: { balance: 500000 },
      create: {
        clerkId: userId,
        balance: 500000,
      },
    });

    await prisma.simulatorTrade.deleteMany({
      where: { clerkId: userId },
    });

    return NextResponse.json({ success: true, balance: portfolio.balance });
  } catch (error) {
    console.error("Reset portfolio API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
