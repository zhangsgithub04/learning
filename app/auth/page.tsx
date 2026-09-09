import { redirect } from "next/navigation";
import { GraduationCap, LockKeyhole } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "./auth-form";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="authShell">
      <section className="authPanel">
        <div className="authBrand">
          <span>
            <GraduationCap size={22} aria-hidden />
          </span>
          <div>
            <p className="eyebrow">Beginner Tutor Lab</p>
            <h1>Sign in to continue</h1>
          </div>
        </div>
        <p className="authCopy">
          Access is limited to users with the learning science verification code.
        </p>
        <AuthForm />
      </section>
      <section className="authAside" aria-label="Protected workspace summary">
        <LockKeyhole size={28} aria-hidden />
        <h2>Protected learning data</h2>
        <p>
          Student chats, readiness estimates, and dashboard patterns are only available after sign in.
        </p>
      </section>
    </main>
  );
}
