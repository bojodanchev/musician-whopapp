import React, { useState } from "react";
import { motion } from "framer-motion";
// NOTE: Some Lucide icons fail to load from certain CDNs in sandboxes.
// To avoid the waveform.js fetch error, we only import widely-available icons.
import {
  Music,
  Sparkles,
  Clock,
  Gauge,
  Download,
  PlayCircle,
  SlidersHorizontal,
  BookOpen,
  CreditCard,
  Shield,
} from "lucide-react";

// Whop‑native, elegant/dynamic UI scaffold for the "Musician" app.
// TailwindCSS + Framer Motion; production-ready structure with placeholder handlers.
// Replace placeholder data hooks with your actual API calls to ElevenLabs Music when wiring.

// --- Simple helpers we can test without API ---
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function simulateCreditDecrement(current, batch) {
  const b = Math.max(1, Number(batch) || 1);
  return Math.max(0, current - b);
}

export default function MusicianApp() {
  const [form, setForm] = useState({
    vibe: "Lofi Chill",
    bpm: 90,
    duration: 30,
    structure: "intro-drop-outro",
    seeds: "",
    batch: 3,
    stems: true,
  });
  const [isGenerating, setGenerating] = useState(false);
  const [creditsLeft, setCreditsLeft] = useState(150);
  const [items, setItems] = useState([
    { id: "t1", title: "Lofi Breeze #1", bpm: 90, key: "Amin", duration: 30, date: "Today", url: "#" },
    { id: "t2", title: "Trap Grind #2", bpm: 140, key: "Dmin", duration: 20, date: "Yesterday", url: "#" },
  ]);

  const presets = [
    { name: "Gym Trap 140", vibe: "Aggressive Trap", bpm: 140, duration: 20, structure: "drop-outro" },
    { name: "Cozy Lofi 85", vibe: "Warm Lofi", bpm: 85, duration: 30, structure: "intro-loop" },
    { name: "Cinematic Ad 120", vibe: "Modern Cinematic", bpm: 120, duration: 30, structure: "build-drop-outro" },
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    // TODO: Call backend /compose → ElevenLabs Music API
    setTimeout(() => {
      const id = `t${Date.now()}`;
      const safeBpm = clamp(Number(form.bpm) || 90, 40, 220);
      const safeDur = clamp(Number(form.duration) || 30, 5, 120);
      setItems([
        {
          id,
          title: `${form.vibe} – Take`,
          bpm: safeBpm,
          key: "Auto",
          duration: safeDur,
          date: "Just now",
          url: "#",
        },
        ...items,
      ]);
      setCreditsLeft((c) => simulateCreditDecrement(c, form.batch));
      setGenerating(false);
    }, 1200);
  };

  // --- Diagnostics & Test Cases (rendered in UI) ---
  const [testOutput, setTestOutput] = useState(null);
  function runTests() {
    const results = [];
    // Test 1: clamp boundaries
    results.push({
      name: "clamp low",
      pass: clamp(10, 40, 220) === 40,
      got: clamp(10, 40, 220),
      expected: 40,
    });
    results.push({
      name: "clamp high",
      pass: clamp(300, 40, 220) === 220,
      got: clamp(300, 40, 220),
      expected: 220,
    });

    // Test 2: credit decrement logic
    results.push({
      name: "credit decrement basic",
      pass: simulateCreditDecrement(10, 3) === 7,
      got: simulateCreditDecrement(10, 3),
      expected: 7,
    });
    results.push({
      name: "credit never below zero",
      pass: simulateCreditDecrement(2, 10) === 0,
      got: simulateCreditDecrement(2, 10),
      expected: 0,
    });
    results.push({
      name: "credit invalid batch -> 1",
      pass: simulateCreditDecrement(5, 0) === 4,
      got: simulateCreditDecrement(5, 0),
      expected: 4,
    });

    // Test 3: presets shape (sanity)
    results.push({
      name: "presets >= 3",
      pass: presets.length >= 3,
      got: presets.length,
      expected: ">=3",
    });

    setTestOutput(results);
  }

  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      {/* Top gradient bar (Whop‑native gradient: purple→pink→blue) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] blur-2xl opacity-25" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/30 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-gradient-to-br from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] grid place-items-center shadow-[0_0_40px_-10px_rgba(123,92,255,0.6)]">
            <Music className="size-5" />
          </div>
          <div className="font-semibold tracking-tight">Musician</div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2"><CreditCard className="size-4" /> Credits: <span className="font-semibold">{creditsLeft}</span></div>
            <button className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10">Upgrade</button>
            <button className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10">Docs</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator card */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="size-5" />
                <h2 className="text-lg font-semibold">Generate hooks, loops & stems</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70">Vibe / Style</label>
                  <input value={form.vibe} onChange={(e)=>setForm({...form, vibe:e.target.value})} placeholder="e.g. Warm Lofi, Aggressive Trap, Ad Cinematic" className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20" />
                </div>
                <div>
                  <label className="text-sm text-white/70">BPM</label>
                  <input type="number" value={form.bpm} onChange={(e)=>setForm({...form, bpm:Number(e.target.value)})} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm text-white/70">Duration (s)</label>
                  <input type="number" value={form.duration} onChange={(e)=>setForm({...form, duration:Number(e.target.value)})} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm text-white/70">Structure</label>
                  <select value={form.structure} onChange={(e)=>setForm({...form, structure:e.target.value})} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2">
                    <option>intro-drop-outro</option>
                    <option>intro-loop</option>
                    <option>build-drop-outro</option>
                    <option>loop-only</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-white/70">Optional seed (consistency)</label>
                  <input value={form.seeds} onChange={(e)=>setForm({...form, seeds:e.target.value})} placeholder="Enter a seed for repeatable vibe" className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm text-white/70">Batch</label>
                  <input type="number" value={form.batch} onChange={(e)=>setForm({...form, batch:Number(e.target.value)})} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2" />
                </div>
                <div className="flex items-center gap-2 mt-7">
                  <input id="stems" type="checkbox" checked={form.stems} onChange={(e)=>setForm({...form, stems:e.target.checked})} className="size-4" />
                  <label htmlFor="stems" className="text-sm">Return stems</label>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button onClick={handleGenerate} disabled={isGenerating || creditsLeft <= 0} className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] shadow-lg disabled:opacity-60">
                  {isGenerating ? "Generating…" : "Generate"}
                </button>
                <div className="text-sm text-white/60 flex items-center gap-2">
                  <Shield className="size-4" /> Broad commercial use on eligible plans. Avoid artist-name prompts.
                </div>
              </div>

              {/* Presets */}
              <div className="mt-8">
                <div className="text-sm text-white/70 mb-2">Quick presets</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {presets.map((p)=> (
                    <button key={p.name} onClick={()=>setForm({ ...form, vibe:p.vibe, bpm:p.bpm, duration:p.duration, structure:p.structure })} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-white/60">{p.vibe} • {p.bpm} BPM • {p.duration}s</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Status & Tips */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-3"><Gauge className="size-5" /><h3 className="font-semibold">Status</h3></div>
              <div className="text-sm text-white/70 flex items-center gap-2"><Clock className="size-4" /> {isGenerating ? "Composing… ~15–30s" : "Idle"}</div>
              <div className="mt-3 text-xs text-white/60">Credits auto‑decrement per batch. Files land in Library with looped version + license.txt.</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-3"><SlidersHorizontal className="size-5" /><h3 className="font-semibold">Export targets</h3></div>
              <div className="text-sm text-white/70">CapCut • DaVinci • Premiere • Shorts • Reels • TikTok</div>
            </div>

            {/* Diagnostics & Tests */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-3"><BookOpen className="size-5" /><h3 className="font-semibold">Diagnostics & Tests</h3></div>
              <button onClick={runTests} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15">Run tests</button>
              {testOutput && (
                <ul className="mt-3 space-y-1 text-xs">
                  {testOutput.map((t, i) => (
                    <li key={i} className={t.pass ? "text-green-400" : "text-red-400"}>
                      {t.pass ? "PASS" : "FAIL"} – {t.name} (got: {String(t.got)}; expected: {String(t.expected)})
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 text-[11px] text-white/50">If any icon fails to render in your environment, ensure a current <code>lucide-react</code> version is installed; this scaffold avoids the problematic <code>Waveform</code> icon.</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Library */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-center gap-2 mb-4"><BookOpen className="size-5" /><h2 className="text-lg font-semibold">Library</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((it) => (
            <motion.div key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Music className="size-5" />
                <div className="font-medium truncate">{it.title}</div>
              </div>
              <div className="text-xs text-white/60">{it.bpm} BPM • {it.key} • {it.duration}s • {it.date}</div>
              <div className="mt-4 flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2"><PlayCircle className="size-4" /> Play</button>
                <button className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2"><Download className="size-4" /> WAV</button>
                <button className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">Stems</button>
                <button className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">License</button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing strip */}
      <section className="border-t border-white/10 bg-white/5">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold">Plans</h3>
            <p className="text-white/70 text-sm">Whop entitlements map to credits and features</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{name:"Starter", price:"$29/mo", features:["150 credits","30s max","Loops" ]}, {name:"Pro", price:"$79/mo", features:["600 credits","Stems","Batch x10"]}, {name:"Studio", price:"$199/mo", features:["2000 credits","Team seats","Webhook/API"]}].map((p)=> (
              <div key={p.name} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="font-semibold">{p.name}</div>
                <div className="text-3xl mt-2">{p.price}</div>
                <ul className="mt-4 space-y-1 text-sm text-white/70 list-disc list-inside">
                  {p.features.map((f)=> <li key={f}>{f}</li>)}
                </ul>
                <button className="mt-5 w-full rounded-xl bg-white/10 border border-white/10 py-2 hover:bg-white/15">Choose {p.name}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-white/60">Musician • Powered by ElevenLabs Music • Whop‑native UI</div>
      </footer>
    </div>
  );
}
