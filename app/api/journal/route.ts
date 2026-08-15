import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sanitizeString } from "@/lib/utils/sanitize";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const entries = await prisma.journal.findMany({
      where: { clerkId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        mood: true,
        aiFeedback: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Journal API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

const MAX_CONTENT_LENGTH = 5000;
const MOODS = ["Confident", "Neutral", "Anxious", "Frustrated", "Excited"];

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const title = sanitizeString(body.title);
    const content = sanitizeString(body.content);
    const mood = sanitizeString(body.mood);

    if (!title) {
      return NextResponse.json(
        { error: "Title is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (!content || content.length < 100) {
      return NextResponse.json(
        { error: "Content must be at least 100 characters", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Content must be less than ${MAX_CONTENT_LENGTH} characters`, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (!MOODS.includes(mood)) {
      return NextResponse.json(
        { error: "Invalid mood", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    await prisma.profile.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        onboardingDone: false,
      },
      update: {},
    });

    const entry = await prisma.journal.create({
      data: {
        clerkId: userId,
        title,
        content,
        mood,
      },
    });

    let aiFeedback = null;

    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 500,
          messages: [
            {
              role: "system",
              content: "You are a professional trading coach. Give specific, actionable feedback in 3-4 sentences focusing on mindset, risk management, and areas for improvement. Be direct and constructive.",
            },
            {
              role: "user",
              content: content,
            },
          ],
        }),
      });

      const responseText = await groqResponse.text();
      if (!groqResponse.ok) {
        console.error("Groq API error:", responseText);
        throw new Error("Groq API failed: " + groqResponse.status);
      }

      const data = JSON.parse(responseText);
      const aiFeedbackText = data.choices?.[0]?.message?.content ?? null;
      if (aiFeedbackText) {
        await prisma.journal.update({
          where: { id: entry.id },
          data: { aiFeedback: aiFeedbackText },
        });
      } else {
        console.error("Groq response missing content:", JSON.stringify(data));
      }
    } catch (aiError) {
      console.error("Groq API error:", aiError);
    }

    return NextResponse.json(
      { entry: { ...entry, aiFeedback } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Journal creation error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
