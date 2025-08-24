import archiver from "archiver";
import { PassThrough } from "stream";

export async function zipBuffers(files: Array<{ name: string; data: Buffer }>): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", (err) => reject(err));

    archive.pipe(stream);
    for (const f of files) {
      archive.append(f.data, { name: f.name });
    }
    archive.finalize().catch(reject);
  });
}

