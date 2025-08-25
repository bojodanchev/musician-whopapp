"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json());

export default function Diagnostics() {
  const { data } = useSWR<{ userId?: string; accessLevel?: string; credits?: number }>("/api/diagnostics", fetcher);
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/80">
      <div className="font-medium mb-2">Diagnostics</div>
      <div>User: {data?.userId ?? "-"}</div>
      <div>Access: {data?.accessLevel ?? "-"}</div>
      <div>Credits: {data?.credits ?? "-"}</div>
    </section>
  );
}


