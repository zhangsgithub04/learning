import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { cohortInsight } from "@/lib/session-store";

export async function GET() {
  try {
    await requireCurrentUser();
    return NextResponse.json(await cohortInsight());
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error && error.message === "Authentication required." ? error.message : "Could not build cohort insight." },
      { status: error instanceof Error && error.message === "Authentication required." ? 401 : 500 }
    );
  }
}
