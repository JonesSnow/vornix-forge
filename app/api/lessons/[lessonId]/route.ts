import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const lessonId = resolvedParams.lessonId;

    if (!lessonId || typeof lessonId !== "string") {
      return NextResponse.json(
        { error: "Invalid lesson ID" },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId, isActive: true },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
            lessons: {
              where: { isActive: true },
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                type: true,
                order: true,
                duration: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Lesson API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
