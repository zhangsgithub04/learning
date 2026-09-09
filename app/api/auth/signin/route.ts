import { NextResponse } from "next/server";
import { setSession, signIn } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await signIn(String(body.email || ""), String(body.password || ""));
    await setSession(user);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not sign in." }, { status: 401 });
  }
}
