"use client";

import { FormEvent, useState } from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: "The server returned an unreadable response." };
  }
}

export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        code: form.get("code")
      })
    });
    const data = await readJson(response);
    setBusy(false);

    if (!response.ok) {
      setError(data.error || "Could not authenticate.");
      return;
    }

    window.location.href = "/";
  }

  return (
    <form className="authForm" onSubmit={submit}>
      <div className="authMode" role="tablist" aria-label="Authentication mode">
        <button
          aria-selected={mode === "signin"}
          className={mode === "signin" ? "active" : ""}
          onClick={() => setMode("signin")}
          type="button"
        >
          <LogIn size={16} aria-hidden />
          Sign in
        </button>
        <button
          aria-selected={mode === "signup"}
          className={mode === "signup" ? "active" : ""}
          onClick={() => setMode("signup")}
          type="button"
        >
          <UserPlus size={16} aria-hidden />
          Sign up
        </button>
      </div>

      {mode === "signup" ? (
        <label>
          Name
          <input name="name" autoComplete="name" placeholder="Your name" />
        </label>
      ) : null}

      <label>
        Email
        <input name="email" type="email" autoComplete="email" placeholder="you@example.edu" required />
      </label>

      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={8}
          placeholder="At least 8 characters"
          required
        />
      </label>

      {mode === "signup" ? (
        <label>
          Verification code
          <input name="code" type="password" autoComplete="one-time-code" placeholder="Required for signup" required />
        </label>
      ) : null}

      {error ? <p className="authError">{error}</p> : null}

      <button className="authSubmit" type="submit" disabled={busy}>
        {busy ? <Loader2 size={18} aria-hidden /> : mode === "signup" ? <UserPlus size={18} aria-hidden /> : <LogIn size={18} aria-hidden />}
        {mode === "signup" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
