import { runFfmpeg } from "@/lib/processing/ffmpeg";

function withFallback(buffer: Buffer, task: () => Promise<Buffer>): Promise<Buffer> {
  return task().catch(() => buffer);
}

export async function normalizeLoudness(input: Buffer): Promise<Buffer> {
  return withFallback(
    input,
    () =>
      runFfmpeg(
        [
          "-hide_banner",
          "-loglevel",
          "error",
          "-i",
          "pipe:0",
          "-af",
          "loudnorm=I=-14:TP=-1.5:LRA=11",
          "-f",
          "mp3",
          "pipe:1",
        ],
        input,
      ),
  );
}

export async function renderLoopVersion(input: Buffer, fadeSeconds = 0.35): Promise<Buffer> {
  const fade = Math.max(0.05, Math.min(1, fadeSeconds));
  const filter = `afade=t=in:d=${fade},afade=t=out:st=duration-${fade}:d=${fade}`;
  return withFallback(
    input,
    () =>
      runFfmpeg(
        [
          "-hide_banner",
          "-loglevel",
          "error",
          "-i",
          "pipe:0",
          "-filter:a",
          filter,
          "-f",
          "mp3",
          "pipe:1",
        ],
        input,
      ),
  );
}
