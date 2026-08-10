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

    const body = await req.json();
    const { moduleId, lessonId } = body as {
      moduleId?: string;
      lessonId?: string;
    };

    if (!moduleId || typeof moduleId !== "string") {
      return NextResponse.json(
        { error: "moduleId is required" },
        { status: 400 }
      );
    }

    if (lessonId && typeof lessonId !== "string") {
      return NextResponse.json(
        { error: "lessonId must be a string" },
        { status: 400 }
      );
    }

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true },
    });

    if (!module) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    const progress = await prisma.progress.upsert({
      where: {
        clerkId_moduleId: {
          clerkId: userId,
          moduleId,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        clerkId: userId,
        moduleId,
        completed: true,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error("Progress API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
