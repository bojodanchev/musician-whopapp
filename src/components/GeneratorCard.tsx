"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";

export type GeneratorForm = { vibe: string; bpm: number; duration: number; structure: string; batch: number; stems: boolean };

export default function GeneratorCard({ onSubmit }: { onSubmit?: (f: GeneratorForm) => void }) {
  const [vibe, setVibe] = useState("");
  const [bpm, setBpm] = useState(120);
  const [duration, setDuration] = useState(30);
  const [structure, setStructure] = useState("");
  const [batch, setBatch] = useState(1);
  const [stems, setStems] = useState(false);
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium flex items-center gap-2"><Sparkles size={16}/> Generator</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm text-white/70">Vibe / Prompt</label>
          <input value={vibe} onChange={(e)=>setVibe(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" placeholder="e.g., cozy lofi coffee shop" />
        </div>
        <div>
          <label className="text-sm text-white/70">BPM</label>
          <input type="number" value={bpm} onChange={e=>setBpm(parseInt(e.target.value||"0"))} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-white/70">Duration (s)</label>
          <input type="number" value={duration} onChange={e=>setDuration(parseInt(e.target.value||"0"))} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2" />
        </div>
        <div className="col-span-2">
          <label className="text-sm text-white/70">Structure</label>
          <input value={structure} onChange={(e)=>setStructure(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2" placeholder="intro:4, hook:8, loop:8" />
        </div>
        <div>
          <label className="text-sm text-white/70">Batch</label>
          <input type="number" value={batch} onChange={e=>setBatch(parseInt(e.target.value||"0"))} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2" />
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input id="stems" type="checkbox" checked={stems} onChange={e=>setStems(e.target.checked)} className="size-4 rounded border-white/20 bg-black/30" />
          <label htmlFor="stems" className="text-sm text-white/70">Include stems</label>
        </div>
        <div className="col-span-2 flex items-center justify-between mt-2">
          <p className="text-xs text-white/60">By generating, you agree to the license terms.</p>
          <button onClick={()=>onSubmit?.({ vibe, bpm, duration, structure, batch, stems })} className="rounded-2xl px-4 py-2 bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] text-white font-medium shadow-[0_8px_30px_rgb(0,0,0,0.12)]">Generate</button>
        </div>
      </div>
    </section>
  );
}

