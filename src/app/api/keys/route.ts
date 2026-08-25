// src/app/api/keys/route.ts
// API key manager: GET → which provider keys are configured (booleans only,
// never secrets). POST → save a key (in-memory override + .env.local).

import { NextResponse } from 'next/server';
import { PROVIDER_KEYS, keyStatuses, setKey } from '@/lib/keyStore';

const VALID_ENV_NAMES = new Set(Object.values(PROVIDER_KEYS));

export async function GET() {
  return NextResponse.json({ statuses: keyStatuses() });
}

export async function POST(req: Request) {
  try {
    const { name, value } = await req.json();
    if (!name || !VALID_ENV_NAMES.has(name)) {
      return NextResponse.json({ error: 'Invalid key name' }, { status: 400 });
    }
    if (typeof value !== 'string' || value.trim().length < 8) {
      return NextResponse.json({ error: 'Key value looks too short to be valid' }, { status: 400 });
    }
    await setKey(name, value.trim());
    return NextResponse.json({ ok: true, statuses: keyStatuses() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save key' }, { status: 500 });
  }
}
