import type { Metadata } from "next";
import "./globals.css";
import { WhopIframeSdkProvider } from "@whop/react";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Musician — AI Music for Whop",
  description: "Generate hooks, loops, and stems in seconds.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0b12] text-white/90 antialiased">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-10%,#7b5cff20,transparent),radial-gradient(1200px_600px_at_10%_110%,#ff4d9d20,transparent),radial-gradient(1200px_600px_at_90%_110%,#35a1ff20,transparent)]" />
        <WhopIframeSdkProvider>
          <div className="min-h-screen mx-auto max-w-6xl px-4 py-8">
            {children}
          </div>
        </WhopIframeSdkProvider>
        <Analytics />
      </body>
    </html>
  );
}
