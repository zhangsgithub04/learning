import { NextResponse } from "next/server";
import { setSession, signUp } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await signUp({
      name: String(body.name || ""),
      email: String(body.email || ""),
      password: String(body.password || ""),
      code: String(body.code || "")
    });
    await setSession(user);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create account." }, { status: 400 });
  }
}
