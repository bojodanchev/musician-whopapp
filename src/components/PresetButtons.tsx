"use client";

export type PresetOption = {
  name: string;
  prompt: string;
  bpm: number;
  duration: number;
  structure?: string;
  description: string;
};

const presets: PresetOption[] = [
  {
    name: "Gym Trap 140",
    prompt: "Aggressive trap hook with distorted 808s, energy for a gym montage",
    bpm: 140,
    duration: 20,
    structure: "drop-outro",
    description: "Adrenaline hit for edits",
  },
  {
    name: "Cozy Lofi 85",
    prompt: "Warm lofi coffee shop vibe with vinyl crackle and soft keys",
    bpm: 85,
    duration: 30,
    structure: "intro-loop",
    description: "Background for focus reels",
  },
  {
    name: "Cinematic Ad 120",
    prompt: "Modern cinematic swell into percussion-heavy ad hook",
    bpm: 120,
    duration: 45,
    structure: "build-drop-outro",
    description: "High-gloss product launch",
  },
];

export default function PresetButtons({ onPick }: { onPick?: (preset: PresetOption) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <button
          key={preset.name}
          onClick={() => onPick?.(preset)}
          className="text-xs px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 text-left"
        >
          <div className="font-medium">{preset.name}</div>
          <div className="text-[10px] text-white/70">{preset.description}</div>
        </button>
      ))}
    </div>
  );
}
