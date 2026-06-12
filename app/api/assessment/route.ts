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

    const { score, level } = await req.json();

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
    console.error("Assessment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}