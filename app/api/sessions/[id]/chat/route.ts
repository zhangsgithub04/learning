import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireCurrentUser } from "@/lib/auth";
import { analyzeLearningTurn } from "@/lib/learning";
import { getSession, saveSession } from "@/lib/session-store";
import type { Message } from "@/lib/types";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireCurrentUser();
    const { id } = await context.params;
    const body = await request.json();
    const text = String(body.text || "").trim();

    if (!text) {
      return NextResponse.json({ error: "Message text is required." }, { status: 400 });
    }

    const session = await getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Student session was not found." }, { status: 404 });
    }

    const analysis = await analyzeLearningTurn(session, text);
    const now = new Date().toISOString();
    const studentMessage: Message = {
      id: new ObjectId().toHexString(),
      role: "student",
      text,
      createdAt: now
    };
    const tutorMessage: Message = {
      id: new ObjectId().toHexString(),
      role: "tutor",
      text: analysis.tutorReply,
      createdAt: now
    };

    const updated = await saveSession({
      ...session,
      confidence: analysis.confidence,
      level: analysis.level,
      misconceptions: analysis.misconceptions,
      strengths: analysis.strengths,
      learningPattern: analysis.learningPattern,
      recommendedNextTopic: analysis.recommendedNextTopic,
      teachingMove: analysis.teachingMove,
      messages: [...session.messages, studentMessage, tutorMessage]
    });

    return NextResponse.json({ session: updated, source: analysis.source });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error && error.message === "Authentication required." ? error.message : "Could not process this learning turn." },
      { status: error instanceof Error && error.message === "Authentication required." ? 401 : 500 }
    );
  }
}
