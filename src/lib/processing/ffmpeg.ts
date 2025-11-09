import { spawn } from "child_process";
import ffmpegStatic from "ffmpeg-static";

function getFfmpegBinary() {
  return ffmpegStatic || "ffmpeg";
}

export function runFfmpeg(args: string[], input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const binary = getFfmpegBinary();
    const proc = spawn(binary, args, { stdio: ["pipe", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    proc.stdout.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    proc.stderr.on("data", (chunk) => errChunks.push(Buffer.from(chunk)));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        const stderr = Buffer.concat(errChunks).toString("utf8");
        reject(new Error(stderr || `ffmpeg exited with code ${code}`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });

    proc.stdin.write(input);
    proc.stdin.end();
  });
}
