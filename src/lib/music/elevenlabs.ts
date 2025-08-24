import { env, isMockMusic } from "@/lib/env";

export type GenerateRequest = {
  prompt: string;
  bpm: number;
  duration: number;
  structure: string;
  seed?: string;
  stems: boolean;
  variations: number;
};

export type JobInfo = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  error?: string;
  assets?: Array<{
    wavUrl: string;
    stemsUrls?: string[];
  }>;
};

export interface MusicClient {
  createGenerateJob(req: GenerateRequest): Promise<{ jobId: string }>;
  getJob(jobId: string): Promise<JobInfo>;
}

class ElevenLabsRealClient implements MusicClient {
  private readonly baseUrl = "https://api.elevenlabs.io/v1/music";

  async createGenerateJob(req: GenerateRequest): Promise<{ jobId: string }> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": env.ELEVENLABS_API_KEY ?? "",
      },
      body: JSON.stringify({
        prompt: req.prompt,
        bpm: req.bpm,
        duration: req.duration,
        structure: req.structure,
        seed: req.seed,
        stems: req.stems,
        variations: req.variations,
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`);
    }
    const data = (await response.json()) as { id: string };
    return { jobId: data.id };
  }

  async getJob(jobId: string): Promise<JobInfo> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
      headers: {
        "xi-api-key": env.ELEVENLABS_API_KEY ?? "",
      },
    });
    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`);
    }
    const data = (await response.json()) as {
      id: string;
      status: "queued" | "processing" | "completed" | "failed";
      error?: string;
      assets?: Array<{ wavUrl: string; stemsUrls?: string[] }>;
    };
    return {
      id: data.id,
      status: data.status,
      error: data.error,
      assets: data.assets,
    };
  }
}

class ElevenLabsMockClient implements MusicClient {
  async createGenerateJob(req: GenerateRequest): Promise<{ jobId: string }> {
    // include variations in id to avoid unused var lint
    return { jobId: `mock_${req.variations}_${Math.random().toString(36).slice(2)}` };
  }

  async getJob(jobId: string): Promise<JobInfo> {
    // Return completed after a brief simulated processing
    return {
      id: jobId,
      status: "completed",
      assets: [
        {
          wavUrl: `https://example.com/audio/${jobId}.wav`,
          stemsUrls: [
            `https://example.com/audio/${jobId}_drums.wav`,
            `https://example.com/audio/${jobId}_bass.wav`,
          ],
        },
      ],
    };
  }
}

export function getMusicClient(): MusicClient {
  if (isMockMusic) return new ElevenLabsMockClient();
  return new ElevenLabsRealClient();
}

