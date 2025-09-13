"use client";
import { useEffect, useState } from "react";

type Props = {
  plan: "STARTER" | "PRO" | "STUDIO";
  title: string;
  price: string;
  features: string[];
  generateHref: string; // where to go if user already has this plan
};

export default function PlanCard({ plan, title, price, features, generateHref }: Props) {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [href, setHref] = useState<string>(`/api/whop/subscribe?plan=${plan}`);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/whop/paywall?plan=${plan}`, { credentials: "include" });
        if (!res.ok) throw new Error("paywall");
        const data: { hasAccess?: boolean; experienceAccess?: boolean } = await res.json();
        if (!cancelled) {
          const subHasAccess = Boolean(data?.experienceAccess);
          setHasAccess(subHasAccess);
          setHref(subHasAccess ? generateHref : `/api/whop/subscribe?plan=${plan}`);
        }
      } catch {
        if (!cancelled) setHref(`/api/whop/subscribe?plan=${plan}`);
      }
    })();
    return () => { cancelled = true; };
  }, [plan, generateHref]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="font-semibold">{title}</div>
      <div className="text-3xl mt-2">{price}</div>
      <ul className="mt-4 space-y-1 text-sm text-white/70 list-disc list-inside">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <button onClick={() => { window.location.assign(href); }} className="mt-5 w-full rounded-xl bg-white/10 border border-white/10 py-2 hover:bg-white/15">
        {hasAccess ? `Open ${title}` : `Choose ${title}`}
      </button>
    </div>
  );
}


