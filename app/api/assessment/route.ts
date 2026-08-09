import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { AssessmentResult } from "@/lib/types";
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

    const { score, level }: AssessmentResult = await req.json();

    const assessment = await prisma.assessment.upsert({
      where: { clerkId: userId },
      update: {
        score,
        level,
      },
      create: {
        clerkId: userId,
        score,
        level,
      },
    });

    return NextResponse.json(assessment);
  } catch (error) {
    logger.error("Assessment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}