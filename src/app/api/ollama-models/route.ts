import { NextResponse } from 'next/server';

const OLLAMA_URL = 'http://localhost:11434';

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      return NextResponse.json({ models: [], running: false });
    }
    const data = await res.json();
    const models: string[] = (data?.models || []).map((m: any) => m.name || m.model);
    return NextResponse.json({ models, running: true });
  } catch {
    return NextResponse.json({ models: [], running: false });
  }
}
