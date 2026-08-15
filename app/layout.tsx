import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Curriculum Creation Engine — Lingocare",
  description: "Build and structure nursing curricula, manually or from a PDF via AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body bg-canvas text-ink-900 antialiased">{children}</body>
    </html>
  );
}
