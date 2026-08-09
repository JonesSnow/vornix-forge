import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { OnboardingAnswers } from "@/lib/types";
import { logger } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { goal, experience, markets, time, risk }: OnboardingAnswers = await req.json();

    const profile = await prisma.profile.upsert({
      where: { clerkId: userId },
      update: {
        goal,
        experienceLevel: experience,
        markets,
        dailyTime: time,
        riskTolerance: risk,
        onboardingDone: true,
      },
      create: {
        clerkId: userId,
        goal,
        experienceLevel: experience,
        markets,
        dailyTime: time,
        riskTolerance: risk,
        onboardingDone: true,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    logger.error("Profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}