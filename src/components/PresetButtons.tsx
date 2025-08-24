"use client";
export default function PresetButtons({ onPick }: { onPick?: (name: string) => void }) {
  const presets = ["Gym Trap 140", "Cozy Lofi 85", "Cinematic Ad 120"];
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => (
        <button key={p} onClick={()=>onPick?.(p)} className="text-xs px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15">{p}</button>
      ))}
    </div>
  );
}

