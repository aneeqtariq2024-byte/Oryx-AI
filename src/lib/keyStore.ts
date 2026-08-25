// src/lib/keyStore.ts
// Central place for AI provider API keys.
// Reads: in-memory overrides (set via /api/keys) → falls back to process.env (.env.local).
// Writes: updates both the override map AND .env.local so keys survive restarts.

import fs from 'fs/promises';
import path from 'path';

export const PROVIDER_KEYS = {
  Claude: 'ANTHROPIC_API_KEY',
  Groq: 'GROQ_API_KEY',
  Gemini: 'GEMINI_API_KEY',
  OpenRouter: 'OPENROUTER_API_KEY',
  NVIDIA: 'NVIDIA_API_KEY',
  Ollama: 'OLLAMA_API_KEY', // not needed — Ollama is local & keyless
} as const;

export type ProviderName = keyof typeof PROVIDER_KEYS;

const overrides: Record<string, string> = {};

export function getKey(name: string): string | undefined {
  const o = overrides[name]?.trim();
  if (o) return o;
  const e = process.env[name]?.trim();
  return e || undefined;
}

export function keyStatuses(): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const [provider, envName] of Object.entries(PROVIDER_KEYS)) {
    // Ollama is local & keyless — always mark as available
    if (provider === 'Ollama') {
      out[provider] = true;
      continue;
    }
    out[provider] = !!getKey(envName);
  }
  return out;
}

export async function setKey(envName: string, value: string): Promise<void> {
  overrides[envName] = value;
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    let content = '';
    try {
      content = await fs.readFile(envPath, 'utf8');
    } catch {
      content = '';
    }
    // Normalize CRLF → LF so the per-line regex works reliably on Windows
    content = content.replace(/\r\n/g, '\n');
    // Replace the existing line (key=...) wherever it is; `[^\n]` instead of `.`
    // so a stray \r can never widen the match
    const re = new RegExp(`^\\s*${envName}=[^\\n]*$`, 'm');
    if (re.test(content)) {
      content = content.replace(re, `${envName}=${value}`);
    } else {
      const base = content.trimEnd();
      content = (base ? base + '\n' : '') + `${envName}=${value}\n`;
    }
    await fs.writeFile(envPath, content, 'utf8');
  } catch (e) {
    console.warn('[keyStore] Could not persist key to .env.local:', e);
  }
}
