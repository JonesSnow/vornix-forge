import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { clerkId: userId },
    });

    const assessment = await prisma.assessment.findUnique({
      where: { clerkId: userId },
    });

    return NextResponse.json({
      onboardingDone: profile?.onboardingDone ?? false,
      assessmentDone: !!assessment,
      level: assessment?.level ?? null,
    });
  } catch (error) {
    console.error("User status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
