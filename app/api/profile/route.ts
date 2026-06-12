import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { firstName, lastName, goal, experienceLevel, markets, dailyTime, riskTolerance } = await req.json();

    const profile = await prisma.profile.upsert({
      where: { clerkId: userId },
      update: {
        firstName,
        lastName,
        goal,
        experienceLevel,
        markets,
        dailyTime,
        riskTolerance,
        onboardingDone: true,
      },
      create: {
        clerkId: userId,
        firstName,
        lastName,
        goal,
        experienceLevel,
        markets,
        dailyTime,
        riskTolerance,
        onboardingDone: true,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
