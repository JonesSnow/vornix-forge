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

    const courses = await prisma.course.findMany({
      include: {
        modules: {
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: { lessons: true },
            },
          },
        },
      },
      orderBy: { level: "asc" },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Courses API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
