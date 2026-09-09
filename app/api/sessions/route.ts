import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { createSession, listSessions } from "@/lib/session-store";

export async function GET() {
  try {
    await requireCurrentUser();
    return NextResponse.json(await listSessions());
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error && error.message === "Authentication required." ? error.message : "Could not load student sessions." },
      { status: error instanceof Error && error.message === "Authentication required." ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireCurrentUser();
    const body = await request.json();
    const session = await createSession(String(body.name || ""), String(body.subject || ""));
    return NextResponse.json({ session });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error && error.message === "Authentication required." ? error.message : "Could not create a student session." },
      { status: error instanceof Error && error.message === "Authentication required." ? 401 : 500 }
    );
  }
}
