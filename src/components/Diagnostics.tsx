"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json());

type DiagnosticsPayload = {
  userId?: string;
  accessLevel?: string;
  credits?: number | null;
  env?: { USE_MOCK_MUSIC?: boolean; S3_BUCKET?: boolean; S3_REGION?: boolean; S3_READY?: boolean };
};

export default function Diagnostics() {
  const { data } = useSWR<DiagnosticsPayload>("/api/diagnostics", fetcher);
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/80">
      <div className="font-medium mb-2">Diagnostics</div>
      <div>User: {data?.userId ?? "-"}</div>
      <div>Access: {data?.accessLevel ?? "-"}</div>
      <div>Credits: {data?.credits ?? "-"}</div>
      <div className="mt-2 opacity-80">S3: {data?.env?.S3_READY ? "Ready" : "Not ready"}</div>
      <div>Mock Music: {data?.env?.USE_MOCK_MUSIC ? "On" : "Off"}</div>
    </section>
  );
}


