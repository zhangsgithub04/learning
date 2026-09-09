import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beginner Tutor Lab",
  description: "A prototype for diagnosing student level and cohort learning patterns through guided GPT-style chat."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
