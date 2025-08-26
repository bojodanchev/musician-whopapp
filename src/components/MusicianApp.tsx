"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Music, PlayCircle, Download, CreditCard } from "lucide-react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function MusicianApp() {
  type AssetOut = {
    id: string;
    title: string;
    bpm: number;
    key: string | null;
    duration: number;
    wavUrl: string;
    loopUrl: string;
    stemsZipUrl?: string | null;
    licenseUrl: string;
  };

  type JobPollResponse =
    | { status: "queued" | "processing" }
    | { error: string }
    | { assets: AssetOut[] };

  const [prompt, setPrompt] = useState("Futuristic, High Energy");
  const [duration, setDuration] = useState(30);
  const [batch, setBatch] = useState(1);
  const [isGenerating, setGenerating] = useState(false);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [items, setItems] = useState(
    [] as Array<{ id: string; title: string; bpm: number; key: string; duration: number; date: string; url: string }>
  );
  const generateBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // pick up preset query string if present
    const url = new URL(window.location.href);
    const preset = url.searchParams.get("preset");
    if (preset) {
      setPrompt(preset);
      // focus the Generate button to nudge action
      setTimeout(() => {
        generateBtnRef.current?.focus();
      }, 50);
    }
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const resp = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vibe: prompt,
          bpm: 120,
          duration: clamp(Number(duration) || 30, 5, 120),
          structure: "intro-drop-outro",
          seed: undefined,
          batch: clamp(Number(batch) || 1, 1, 10),
          stems: false,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Compose failed: ${resp.status}`);
      }
      const result = await resp.json();

      if ("assets" in result) {
        const added = (result.assets as AssetOut[]).map((a, idx) => ({
          id: a.id ?? `${Date.now()}_${idx}`,
          title: prompt,
          bpm: 120,
          key: "-",
          duration,
          date: "Just now",
          url: a.loopUrl,
        }));
        setItems((cur) => [...added, ...cur]);
      } else if ("jobId" in result) {
        let done = false;
        while (!done) {
          await new Promise((r) => setTimeout(r, 1500));
          const st = await fetch(`/api/compose/${result.jobId}`, { credentials: "include" });
          const data = (await st.json()) as JobPollResponse;
          if ("status" in data && (data.status === "queued" || data.status === "processing")) continue;
          if ("error" in data) throw new Error(data.error);
          if ("assets" in data) {
            const added = data.assets.map((a, idx) => ({
              id: `${result.jobId}_${idx}`,
              title: prompt,
              bpm: 120,
              key: "-",
              duration,
              date: "Just now",
              url: a.loopUrl,
            }));
            setItems((cur) => [...added, ...cur]);
          }
          done = true;
        }
      }
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
      try {
        const d = await fetch("/api/diagnostics", { credentials: "include" }).then((r) => r.json());
        if (typeof d?.credits === "number") setCreditsLeft(d.credits);
      } catch {}
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const d = await fetch("/api/diagnostics", { credentials: "include" }).then((r) => r.json());
        if (typeof d?.credits === "number") setCreditsLeft(d.credits);
      } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/30 border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-gradient-to-br from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] grid place-items-center">
            <Music className="size-5" />
          </div>
          <div className="font-semibold tracking-tight">Musician</div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2"><CreditCard className="size-4" /> Credits: <span className="font-semibold">{creditsLeft ?? "-"}</span></div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <div className="text-3xl md:text-5xl font-semibold">Begin your musical journey.</div>
            <div className="text-white/60 mt-2 text-sm">Describe your song and generate high‑quality hooks and loops.</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-3 md:p-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your song..."
                className="flex-1 rounded-2xl bg-black/40 border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <div className="flex items-center gap-2 text-sm text-white/80">
                <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/10">
                  x
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={batch}
                    onChange={(e) => setBatch(clamp(Number(e.target.value) || 1, 1, 10))}
                    className="ml-1 w-12 bg-transparent focus:outline-none"
                    aria-label="Variations"
                  />
                </div>
                <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/10">
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={duration}
                    onChange={(e) => setDuration(clamp(Number(e.target.value) || 30, 5, 120))}
                    className="w-16 bg-transparent focus:outline-none"
                    aria-label="Duration seconds"
                  />
                  s
                </div>
              </div>
              <button
                ref={generateBtnRef}
                onClick={handleGenerate}
                disabled={isGenerating || (typeof creditsLeft === "number" && creditsLeft <= 0)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] shadow-lg disabled:opacity-60"
              >
                {isGenerating ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>

          <div className="mt-12">
            <div className="flex items-center gap-2 mb-4"><span className="text-lg font-semibold">Recent projects</span></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {items.map((it) => (
                <motion.div key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="font-medium truncate mb-1">{it.title}</div>
                  <div className="text-xs text-white/60">{it.duration}s • Just now</div>
                  <div className="mt-4 flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2"><PlayCircle className="size-4" /> Play</button>
                    <button className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2"><Download className="size-4" /> WAV</button>
                  </div>
                </motion.div>
              ))}
              {items.length === 0 && (
                <div className="text-sm text-white/60">No projects yet. Generate to see results here.</div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}


