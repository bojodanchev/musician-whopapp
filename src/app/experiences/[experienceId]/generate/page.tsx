import MusicianApp from "@/components/MusicianApp";
import Diagnostics from "@/components/Diagnostics";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ExperienceGeneratePage() {
  const showDiagnostics = process.env.NEXT_PUBLIC_SHOW_DIAGNOSTICS === "1" || process.env.NODE_ENV !== "production";
  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      {/* Paywall note (if no credits) handled server-side, but provide links */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="text-xs text-white/60">
          Need more credits? <Link className="underline" href={`/api/whop/subscribe?plan=PRO`}>Upgrade to Pro</Link> or <Link className="underline" href={`/api/whop/subscribe?plan=STUDIO`}>Studio</Link>.
        </div>
      </div>
      <MusicianApp />
      {showDiagnostics && (
        <div className="mt-6 max-w-5xl mx-auto px-4"><Diagnostics /></div>
      )}
    </div>
  );
}


