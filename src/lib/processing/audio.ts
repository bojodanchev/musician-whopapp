// Placeholder processing functions for MVP. In production, hook up to an audio worker.
export async function normalizeLoudness(input: Buffer): Promise<Buffer> {
  return input; // no-op for MVP
}

export async function renderLoopVersion(input: Buffer): Promise<Buffer> {
  return input; // no-op for MVP
}

