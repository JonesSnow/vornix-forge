import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_CLERK_IDS } from "@/lib/constants";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const courses = await prisma.course.findMany({
      orderBy: { level: "asc" },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Admin content API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, level, order } = body;

    if (!title || !description || level == null || order == null) {
      return NextResponse.json({ error: "Missing required fields", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: { title, description, level: Number(level), order: Number(order), isActive: true },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Admin create course API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
