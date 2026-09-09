import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return <DashboardClient userName={user.name || user.email} />;
}
