import MusicianApp from "@/components/MusicianApp";
import Diagnostics from "@/components/Diagnostics";

export const dynamic = "force-dynamic";

export default function ExperienceGeneratePage() {
  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      <MusicianApp />
      <div className="mt-6 max-w-5xl mx-auto px-4"><Diagnostics /></div>
    </div>
  );
}


