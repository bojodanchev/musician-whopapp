"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Music, PlayCircle, Download, CreditCard, Layers, ArrowLeftRight, Mic, RefreshCw } from "lucide-react";
import { useIframeSdk } from "@whop/react";
import OnboardingWizard from "@/components/OnboardingWizard";
import PresetButtons, { PresetOption } from "@/components/PresetButtons";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const PLAN_CAPS = {
  STARTER: { maxDuration: 30, maxBatch: 2, allowStreaming: false, allowAdvanced: false, allowVocals: false, allowStems: false },
  PRO: { maxDuration: 60, maxBatch: 4, allowStreaming: true, allowAdvanced: true, allowVocals: true, allowStems: true },
  STUDIO: { maxDuration: 120, maxBatch: 10, allowStreaming: true, allowAdvanced: true, allowVocals: true, allowStems: true },
} as const;

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

  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(30);
  const [bpm, setBpm] = useState(120);
  const [batch, setBatch] = useState(1);
  const [isGenerating, setGenerating] = useState(false);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [items, setItems] = useState(
    [] as Array<{ id: string; title: string; bpm: number; key: string; duration: number; date: string; loopUrl: string; hasStems?: boolean; preview?: boolean }>
  );
  const [upgradeBanner, setUpgradeBanner] = useState<null | { requiredPlan: "PRO" | "STUDIO" }>(null);
  const [vocals, setVocals] = useState(false);
  const [reusePlan, setReusePlan] = useState(false);
  const [streamPreview, setStreamPreview] = useState(false);
  const [includeStems, setIncludeStems] = useState(false);
  const generateBtnRef = useRef<HTMLButtonElement | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [showDuration, setShowDuration] = useState(false);
  const variantsRef = useRef<HTMLDivElement | null>(null);
  const durationRef = useRef<HTMLDivElement | null>(null);
  const [plan, setPlan] = useState<"STARTER" | "PRO" | "STUDIO" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  type IframeSdk = { inAppPurchase?: (opts: { planId: string }) => Promise<void> } | null;
  const iframeSdk = (useIframeSdk?.() as unknown as IframeSdk) || null;

  function currentCaps() {
    if (!plan) return PLAN_CAPS.STARTER;
    return PLAN_CAPS[plan];
  }

  function ToggleChip({ enabled, onClick, label, icon: Icon, tooltip }: { enabled: boolean; onClick: () => void; label: string; icon: React.ComponentType<{ className?: string }>; tooltip: string }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group relative px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs ${enabled ? "bg-white/10 border-white text-white" : "bg-black/40 border-white/10 text-white/70 hover:bg-white/10"}`}
      >
        <Icon className="size-4" />
        <span>{label}</span>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] text-white/90 opacity-0 group-hover:opacity-100 transition">{tooltip}</span>
      </button>
    );
  }

  async function upgradeTo(target: "PRO" | "STUDIO") {
    try {
      if (iframeSdk && iframeSdk.inAppPurchase) {
        const planEnv = target === "PRO" ? process.env.NEXT_PUBLIC_WHOP_PLAN_PRO_ID : process.env.NEXT_PUBLIC_WHOP_PLAN_STUDIO_ID;
        if (planEnv) {
          await iframeSdk.inAppPurchase({ planId: planEnv });
          // Refresh diagnostics and caps after modal success; best effort
          const d = await fetch("/api/diagnostics", { credentials: "include" }).then((r) => r.json());
          if (d?.whopUser?.plan || d?.plan) setPlan((d?.whopUser?.plan ?? d?.plan) as "STARTER" | "PRO" | "STUDIO");
          return;
        }
      }
      window.location.assign(`/api/whop/subscribe?plan=${target}`);
    } catch {
      window.location.assign(`/api/whop/subscribe?plan=${target}`);
    }
  }

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
    // onboarding: show once per device
    const seen = localStorage.getItem("musician_onboarded");
    if (!seen) setShowOnboarding(true);
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (showVariants && variantsRef.current && !variantsRef.current.contains(t)) setShowVariants(false);
      if (showDuration && durationRef.current && !durationRef.current.contains(t)) setShowDuration(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showVariants, showDuration]);

  useEffect(() => {
    const caps = plan ? PLAN_CAPS[plan] : PLAN_CAPS.STARTER;
    if (!caps.allowStems) setIncludeStems(false);
  }, [plan]);

  const handlePresetPick = (preset: PresetOption) => {
    setPrompt(preset.prompt);
    setDuration(preset.duration);
    setBpm(preset.bpm);
    setTimeout(() => generateBtnRef.current?.focus(), 50);
  };

  const handlePreview = async () => {
    try {
      setGenerating(true);
      const resp = await fetch("/api/compose/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, duration: clamp(Number(duration) || 30, 5, 120) }),
      });
      if (!resp.ok || !resp.body) throw new Error(`Stream failed: ${resp.status}`);
      const arrayBuf = await resp.arrayBuffer();
      const blob = new Blob([arrayBuf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const id = `preview_${Date.now()}`;
      const item = { id, title: prompt || "Preview take", bpm, key: "-", duration, date: "Preview", loopUrl: url, hasStems: false, preview: true };
      setItems((cur) => [item, ...cur]);
      // Do not autoplay; wait for explicit user action
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      if (streamPreview) {
        await handlePreview();
        return;
      }
      const resp = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vibe: prompt,
          bpm,
          duration: clamp(Number(duration) || 30, 5, 120),
          structure: "intro-drop-outro",
          seed: undefined,
          batch: clamp(Number(batch) || 1, 1, 10),
          stems: includeStems,
          vocals,
          reusePlan,
          streamingPreview: streamPreview,
        }),
      });
      if (!resp.ok) {
        const err = (await resp.json().catch(() => ({}))) as { error?: string; requiredPlan?: "PRO" | "STUDIO" };
        if (resp.status === 403 && (err?.error === "FORBIDDEN_PAYWALL" || err?.error === "UPGRADE_REQUIRED")) {
          setUpgradeBanner({ requiredPlan: (err.requiredPlan || "PRO") as "PRO" | "STUDIO" });
          return;
        }
        throw new Error(err.error || `Compose failed: ${resp.status}`);
      }
      const result = await resp.json();

      if ("assets" in result) {
        const added = (result.assets as AssetOut[]).map((a, idx) => ({
          id: a.id ?? `${Date.now()}_${idx}`,
          title: prompt,
          bpm,
          key: "-",
          duration,
          date: "Just now",
          loopUrl: a.loopUrl,
          hasStems: Boolean(a.stemsZipUrl),
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
              bpm,
              key: "-",
              duration,
              date: "Just now",
              loopUrl: a.loopUrl,
              hasStems: Boolean((a as AssetOut).stemsZipUrl),
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

  async function saveFromPreview(previewId: string) {
    try {
      setGenerating(true);
      const resp = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vibe: prompt,
          bpm,
          duration: clamp(Number(duration) || 30, 5, 120),
          structure: "intro-drop-outro",
          batch: 1,
          stems: includeStems,
          vocals,
          reusePlan,
          streamingPreview: false,
        }),
      });
      if (!resp.ok) {
        const err = (await resp.json().catch(() => ({}))) as { error?: string; requiredPlan?: "PRO" | "STUDIO" };
        if (resp.status === 403 && (err?.error === "FORBIDDEN_PAYWALL" || err?.error === "UPGRADE_REQUIRED")) {
          setUpgradeBanner({ requiredPlan: (err.requiredPlan || "PRO") as "PRO" | "STUDIO" });
          return;
        }
        throw new Error(err.error || `Compose failed: ${resp.status}`);
      }
      const result = await resp.json();
      if (result?.assets && Array.isArray(result.assets) && result.assets.length > 0) {
        const a = result.assets[0] as AssetOut;
        setItems((cur) => cur.map((it) => (it.id === previewId ? { ...it, id: a.id ?? previewId, loopUrl: a.loopUrl, date: "Just now", preview: false, hasStems: Boolean(a.stemsZipUrl) } : it)));
      }
      try {
        const d = await fetch("/api/diagnostics", { credentials: "include" }).then((r) => r.json());
        if (typeof d?.credits === "number") setCreditsLeft(d.credits);
      } catch {}
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const d = await fetch("/api/diagnostics", { credentials: "include" }).then((r) => r.json());
        if (typeof d?.credits === "number") setCreditsLeft(d.credits);
      } catch {}
      // also get plan
      try {
        const d = await fetch("/api/diagnostics", { credentials: "include" }).then((r) => r.json());
        if (typeof d?.credits === "number") setCreditsLeft(d.credits);
        const p = (d?.whopUser?.plan ?? d?.plan) as string | undefined;
        if (p === "STARTER" || p === "PRO" || p === "STUDIO") setPlan(p);
      } catch {}
      // load recent assets
      try {
        const a = await fetch("/api/assets", { credentials: "include", cache: "no-store" }).then((r)=> r.json());
        if (Array.isArray(a?.assets)) {
          const mapped = (a.assets as Array<{ id: string; title: string; bpm?: number; key?: string | null; duration?: number; loopUrl: string; stemsZipUrl?: string | null }>)
            .map((asset) => ({ id: asset.id, title: asset.title, bpm: asset.bpm ?? 120, key: (asset.key ?? "-") as string, duration: asset.duration ?? 30, date: "Just now", loopUrl: asset.loopUrl, hasStems: Boolean(asset.stemsZipUrl) }));
          setItems(mapped);
        }
      } catch {}
      // Setup shared audio element for play/pause/progress
      if (!audioRef.current) {
        audioRef.current = new Audio();
        const a = audioRef.current;
        const onTime = () => {
          if (!a.duration || isNaN(a.duration)) { setProgress(0); return; }
          setProgress(a.currentTime / a.duration);
        };
        const onEnded = () => { setIsPlaying(false); setPlayingId(null); setProgress(0); };
        a.addEventListener("timeupdate", onTime);
        a.addEventListener("ended", onEnded);
      }
    })();
  }, []);

  function togglePlay(it: { id: string; loopUrl: string }) {
    const a = audioRef.current;
    if (!a) return;
    if (playingId === it.id) {
      if (isPlaying) { a.pause(); setIsPlaying(false); } else { void a.play(); setIsPlaying(true); }
      return;
    }
    a.src = it.loopUrl;
    a.currentTime = 0;
    setPlayingId(it.id);
    setProgress(0);
    void a.play();
    setIsPlaying(true);
  }

  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      {showOnboarding && (
        <OnboardingWizard
          onClose={() => { localStorage.setItem("musician_onboarded", "1"); setShowOnboarding(false); }}
          onComplete={(presetPrompt) => {
            setPrompt(presetPrompt);
            setTimeout(() => generateBtnRef.current?.focus(), 50);
          }}
        />
      )}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/30 border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-gradient-to-br from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] grid place-items-center">
            <Music className="size-5" />
          </div>
          <div className="font-semibold tracking-tight">Musician</div>
          <Link href={typeof window !== 'undefined' && window.top !== window.self ? "/experiences/app" : "/"} className="ml-3 text-xs px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">Home</Link>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2"><CreditCard className="size-4" /> Credits: <span className="font-semibold">{creditsLeft ?? "-"}</span></div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        {upgradeBanner && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm flex items-center justify-between">
            <div>
              Upgrade required to continue. This action needs {upgradeBanner.requiredPlan}.
            </div>
            <div className="flex gap-2">
              <button onClick={() => upgradeTo(upgradeBanner.requiredPlan)} className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff]">Upgrade</button>
              <button onClick={() => setUpgradeBanner(null)} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">Dismiss</button>
            </div>
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <div className="text-3xl md:text-5xl font-semibold">Begin your musical journey.</div>
            <div className="text-white/60 mt-2 text-sm">Describe your song and generate high‑quality hooks and loops.</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-3 md:p-4">
            <div className="flex flex-col gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your song..."
                rows={2}
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 md:py-4 focus:outline-none focus:ring-2 focus:ring-white/20 text-base min-h-[72px]"
              />
              <div>
                <div className="text-xs uppercase text-white/60 mb-1">Presets</div>
                <PresetButtons onPick={handlePresetPick} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-white/80 relative">
                {/* Variants trigger */}
                <div ref={variantsRef} className="relative">
                  <button
                    onClick={() => { setShowVariants((s) => !s); setShowDuration(false); }}
                    className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2 hover:bg-white/10"
                    aria-label="Number of variants"
                  >
                    <Layers className="size-4" /> {batch}
                  </button>
                  {showVariants && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: -6, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute -top-2 left-0 translate-y-[-100%] rounded-2xl border border-white/10 bg-[#0b0b12] shadow-2xl p-4 w-64"
                    >
                      <div className="font-medium mb-3">Number of Variants</div>
                      <div className="grid grid-cols-4 gap-2">
                        {[1,2,3,4].map((n)=> (
                          <button
                            key={n}
                            onClick={()=>{
                              const cap = currentCaps();
                              if (n > cap.maxBatch) { upgradeTo(n <= 4 ? "PRO" : "STUDIO"); return; }
                              setBatch(n); setShowVariants(false);
                            }}
                            className={`h-10 rounded-xl border ${batch===n?"bg-white/10 border-white":"bg-white/5 border-white/10 hover:bg-white/10"} ${n>currentCaps().maxBatch?"opacity-40 cursor-not-allowed":""}`}
                          >{n}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Duration trigger */}
                <div ref={durationRef} className="relative">
                  <button
                    onClick={() => { setShowDuration((s) => !s); setShowVariants(false); }}
                    className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2 hover:bg-white/10"
                    aria-label="Duration"
                  >
                    <ArrowLeftRight className="size-4" /> {Math.round(duration)}s
                  </button>
                  {showDuration && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: -6, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute -top-2 left-0 translate-y-[-100%] rounded-2xl border border-white/10 bg-[#0b0b12] shadow-2xl p-4 w-[22rem]"
                    >
                      <div className="font-medium mb-3">Duration</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[
                          {label:"Auto", val:30},
                          {label:"30s", val:30},
                          {label:"1m", val:60},
                          {label:"2m", val:120},
                        ].map((o)=> (
                          <button key={o.label} onClick={()=>{
                            const cap = currentCaps();
                            if (o.val > cap.maxDuration) { upgradeTo(o.val<=60?"PRO":"STUDIO"); return; }
                            setDuration(o.val); setShowDuration(false);
                          }} className={`px-3 h-10 rounded-xl border ${duration===o.val?"bg-white/10 border-white":"bg-white/5 border-white/10 hover:bg-white/10"} ${o.val>currentCaps().maxDuration?"opacity-40 cursor-not-allowed":""}`}>{o.label}</button>
                        ))}
                        {/* Coming soon items */}
                        {[
                          {label:"3m"},{label:"4m"}
                        ].map((o)=> (
                          <button key={o.label} disabled className="px-3 h-10 rounded-xl border bg-white/5 border-white/10 opacity-40 cursor-not-allowed">{o.label}</button>
                        ))}
                        <div className="ml-auto flex items-center gap-2">
                          <input
                            type="number"
                            min={5}
                            max={120}
                            value={duration}
                            onChange={(e)=> {
                              const val = clamp(Number(e.target.value)||30,5,120);
                              const cap = currentCaps();
                              if (val>cap.maxDuration) { upgradeTo(val<=60?"PRO":"STUDIO"); return; }
                              setDuration(val);
                            }}
                            className="w-20 bg-black/40 border border-white/10 rounded-xl px-2 py-1"
                          />
                          <span className="text-white/60 text-xs">Custom (s)</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                {/* Close inner controls row */}
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <label className="text-xs uppercase text-white/50">BPM</label>
                  <input
                    type="number"
                    min={40}
                    max={220}
                    value={bpm}
                    onChange={(e)=>setBpm(clamp(Number(e.target.value)||120,40,220))}
                    className="w-20 bg-black/40 border border-white/10 rounded-xl px-2 py-1"
                  />
                </div>
                {/* Pro/Studio toggles with upgrade-on-click behavior */}
                <div className="flex items-center gap-2">
                  {currentCaps().allowStems ? (
                    <ToggleChip enabled={includeStems} onClick={()=>setIncludeStems((v)=>!v)} label="Stems" icon={Download} tooltip="Return instrument stems as a ZIP." />
                  ) : (
                    <ToggleChip enabled={false} onClick={()=>upgradeTo("PRO")} label="Stems (Pro)" icon={Download} tooltip="Upgrade to download stem ZIPs." />
                  )}
                  {currentCaps().allowVocals ? (
                    <ToggleChip enabled={vocals} onClick={()=>setVocals((v)=>!v)} label="Vocals" icon={Mic} tooltip="Ask the model to include vocals and melodies." />
                  ) : (
                    <ToggleChip enabled={false} onClick={()=>upgradeTo("PRO")} label="Vocals (Pro)" icon={Mic} tooltip="Upgrade to enable vocal generation." />
                  )}
                  {currentCaps().allowAdvanced ? (
                    <ToggleChip enabled={reusePlan} onClick={()=>setReusePlan((v)=>!v)} label="Reuse last plan" icon={RefreshCw} tooltip="Create and reuse a composition plan for consistency across takes." />
                  ) : (
                    <ToggleChip enabled={false} onClick={()=>upgradeTo("PRO")} label="Reuse last plan (Pro)" icon={RefreshCw} tooltip="Upgrade to reuse composition plans for consistent tracks." />
                  )}
                  {currentCaps().allowStreaming ? (
                    <ToggleChip enabled={streamPreview} onClick={()=>setStreamPreview((v)=>!v)} label="Streaming preview" icon={PlayCircle} tooltip="Audition a quick streamed preview before saving." />
                  ) : (
                    <ToggleChip enabled={false} onClick={()=>upgradeTo("PRO")} label="Streaming preview (Pro)" icon={PlayCircle} tooltip="Upgrade to stream previews instantly." />
                  )}
                </div>
                <button
                  ref={generateBtnRef}
                  onClick={handleGenerate}
                  disabled={isGenerating || (typeof creditsLeft === "number" && creditsLeft <= 0)}
                  className="ml-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] shadow-lg disabled:opacity-60"
                >
                  {isGenerating ? "Generating…" : "Generate"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <div className="flex items-center gap-2 mb-4"><span className="text-lg font-semibold">Recent projects</span></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {items.map((it) => (
                <motion.div key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="font-medium truncate mb-1">{it.title}</div>
                  <div className="text-xs text-white/60">{it.duration}s • {it.bpm} BPM</div>
                  <div className="mt-4 flex items-center gap-2">
                    <button onClick={() => togglePlay(it)} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2 hover:bg-white/15">
                      <PlayCircle className="size-4" /> {playingId===it.id && isPlaying? "Pause" : "Play"}
                    </button>
                    <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-white/40" style={{ width: playingId===it.id ? `${Math.round(progress*100)}%` : "0%" }} />
                    </div>
                    {it.preview ? (
                      <button onClick={() => saveFromPreview(it.id)} className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] border border-white/10 flex items-center gap-2">Save</button>
                    ) : (
                      <>
                        <a href={`/api/assets/${encodeURIComponent(it.id)}/download?type=wav`} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2 hover:bg-white/15"><Download className="size-4" /> Download</a>
                        {it.hasStems && (
                          <a href={`/api/assets/${encodeURIComponent(it.id)}/download?type=stems`} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2 hover:bg-white/15"><Layers className="size-4" /> Stems</a>
                        )}
                      </>
                    )}
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
