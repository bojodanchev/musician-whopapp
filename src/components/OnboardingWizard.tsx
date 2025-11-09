"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export type OnboardingSelection = {
  prompt: string;
  bpm: number;
  duration: number;
  structure: string;
};

type Props = {
  onClose: () => void;
  onComplete: (selection: OnboardingSelection) => void;
};

export default function OnboardingWizard({ onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [vibe, setVibe] = useState<string>("");
  const [style, setStyle] = useState<string>("");

  function next() { setStep((s) => s + 1); }
  function back() { setStep((s) => Math.max(0, s - 1)); }

  const stylePresets: Record<string, { bpm: number; duration: number; structure: string }> = {
    "Warm lofi": { bpm: 85, duration: 30, structure: "intro-loop" },
    "Modern cinematic": { bpm: 120, duration: 45, structure: "build-drop-outro" },
    "Trap energy": { bpm: 140, duration: 20, structure: "drop-outro" },
    "Indie pop": { bpm: 105, duration: 30, structure: "intro-drop-outro" },
    "Acoustic": { bpm: 95, duration: 35, structure: "intro-loop" },
    "EDM": { bpm: 128, duration: 60, structure: "build-drop-outro" },
  };

  function finish() {
    const parts = [occasion, style, vibe, name ? `with the name ${name}` : ""].filter(Boolean);
    const prompt = parts.join(", ");
    const preset = stylePresets[style] ?? { bpm: 110, duration: 30, structure: "intro-drop-outro" };
    onComplete({ prompt, ...preset });
    onClose();
  }

  useEffect(() => {
    // focus trapping omitted for brevity; modal is lightweight
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b0b12] p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-4"><Sparkles className="size-5"/><div className="font-semibold">Let’s craft your moment</div></div>
        {step === 0 && (
          <div>
            <div className="text-white/80 mb-3">What’s the occasion?</div>
            <div className="grid grid-cols-2 gap-2">
              {["Birthday song","Wedding entrance","Ad / Jingle","Reels background","Workout burst","Vlog / Copyright‑free"].map((o)=> (
                <button key={o} onClick={()=>{setOccasion(o); next();}} className={`rounded-2xl border border-white/10 px-4 py-3 text-left hover:bg-white/10 ${occasion===o?"bg-white/10":"bg-white/5"}`}>{o}</button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="text-white/80 mb-3">Any personal details?</div>
            <div className="grid grid-cols-1 gap-2">
              <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name(s) to include (optional)" className="rounded-xl bg-black/40 border border-white/10 px-3 py-2" />
              <input value={vibe} onChange={(e)=>setVibe(e.target.value)} placeholder="One line story / vibe (optional)" className="rounded-xl bg-black/40 border border-white/10 px-3 py-2" />
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <button onClick={back} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">Back</button>
              <button onClick={next} className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff]">Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="text-white/80 mb-3">Pick a music style</div>
            <div className="grid grid-cols-2 gap-2">
              {["Warm lofi","Modern cinematic","Trap energy","Indie pop","Acoustic","EDM"].map((s)=> (
                <button key={s} onClick={()=>setStyle(s)} className={`rounded-2xl border border-white/10 px-4 py-3 text-left hover:bg-white/10 ${style===s?"bg-white/10":"bg-white/5"}`}>{s}</button>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <button onClick={back} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">Back</button>
              <button onClick={next} disabled={!style} className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] disabled:opacity-60">Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/70 mb-2">Preview setup</div>
              <div className="text-sm">Occasion: <span className="text-white">{occasion || "-"}</span></div>
              <div className="text-sm">Style: <span className="text-white">{style || "-"}</span></div>
              <div className="text-sm">Details: <span className="text-white">{[name && `Name: ${name}`, vibe].filter(Boolean).join(" • ") || "-"}</span></div>
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <button onClick={back} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">Back</button>
              <button onClick={finish} className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff]">Create my song</button>
            </div>
            <div className="mt-2 text-xs text-white/60">One‑click download & license after generation.</div>
          </div>
        )}
      </div>
    </div>
  );
}

