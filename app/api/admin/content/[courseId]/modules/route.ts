import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_CLERK_IDS } from "@/lib/constants";

export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { courseId } = await params;

    const body = await req.json();
    const { title, description, order } = body;

    if (!title || order == null) {
      return NextResponse.json({ error: "Missing required fields", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const module = await prisma.module.create({
      data: {
        courseId,
        title,
        description: description ?? "",
        order: Number(order),
        isActive: true,
      },
    });

    return NextResponse.json({ module }, { status: 201 });
  } catch (error) {
    console.error("Admin add module API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
