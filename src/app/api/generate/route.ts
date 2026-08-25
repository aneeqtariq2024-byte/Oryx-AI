// src/app/api/generate/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { routePrompt, isQuotaError, findModel } from '@/lib/models';
import { getKey } from '@/lib/keyStore';
import { needsWebSearch, searchWeb, formatSearchContext } from '@/lib/webSearch';

/**
 * Generate an image with Gemini (nano-banana class models) using the user's
 * GEMINI_API_KEY. Returns a served-from-disk URL (/generated/xxx.png) or null
 * on any failure (invalid key, quota, no image part) so the caller can fall
 * back to Pollinations.
 */
async function generateImageWithGemini(apiKey: string, imagePrompt: string): Promise<{ url: string | null; error?: string }> {
  const models = [
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-image-preview',
    'gemini-2.0-flash-preview-image-generation',
  ];
  let lastError: string | undefined;
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate an image: ${imagePrompt}` }] }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
          }),
        }
      );
      if (!res.ok) {
        const body = await res.text();
        lastError = `HTTP ${res.status}: ${body.slice(0, 150)}`;
        continue;
      }
      const data = await res.json();
      const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p) => p?.inlineData?.data);
      if (!imgPart) { lastError = 'No image part in response'; continue; }
      const { data: b64, mimeType } = imgPart.inlineData;
      const ext = (mimeType || 'image/png').includes('jpeg') ? 'jpg' : 'png';
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const dir = path.join(process.cwd(), 'public', 'generated');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, `${id}.${ext}`), Buffer.from(b64, 'base64'));
      return { url: `/generated/${id}.${ext}` };
    } catch (e: any) {
      lastError = e?.message || 'network error';
      continue;
    }
  }

  // ---- Imagen 3 (dedicated image model, :predict endpoint) ----
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict`,
      {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: imagePrompt }],
          parameters: { sampleCount: 1, aspectRatio: '1:1' },
        }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const pred = data?.predictions?.[0];
      if (pred?.bytesBase64Encoded) {
        const ext = (pred.mimeType || 'image/png').includes('jpeg') ? 'jpg' : 'png';
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const dir = path.join(process.cwd(), 'public', 'generated');
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, `${id}.${ext}`), Buffer.from(pred.bytesBase64Encoded, 'base64'));
        return { url: `/generated/${id}.${ext}` };
      }
      lastError = 'Imagen returned no image';
    } else {
      lastError = `Imagen HTTP ${res.status}`;
    }
  } catch (e: any) {
    lastError = `Imagen: ${e?.message || 'network error'}`;
  }

  return { url: null, error: lastError };
}

/**
 * POST /api/generate
 *
 * Boss Agent mode:
 *   model: 'auto'  → AI analyzes the prompt, picks the BEST model for the task,
 *                    and if that model's free tier / quota is exhausted
 *                    (429 / rate limit / credits), it AUTOMATICALLY fails over
 *                    to the next best model — across providers.
 *
 * Manual mode: pass any model id from src/lib/models.ts.
 *
 * Providers: Groq, Gemini, OpenRouter, NVIDIA (NIM).
 * Modes:
 *   stream: true  → SSE. First event: {"status":"model", model, provider}
 *                   then {"text": "..."} chunks, then {"status":"done","modelUsed"}, then [DONE]
 *   default       → JSON { text, html, type, modelUsed, routing? }
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const OLLAMA_URL = 'http://localhost:11434/api/chat';

const MAX_FAILOVERS = 4;

const DEFAULT_SYSTEM_PROMPT = `You are Oryx AI, a highly capable, intelligent, and helpful AI workspace assistant and expert full-stack web developer.
Answer user questions clearly, accurately, and professionally using clean markdown (headings, lists, code blocks).
When asked to create a website, web app, or frontend interface, ALWAYS provide a complete, production-ready, self-contained artifact wrapped in triple backticks like \`\`\`html ... \`\`\` (full HTML with inline CSS/JS, no lorem ipsum — real content).
When answering general questions, chat, or coding queries, respond directly in well-formatted markdown.`;

interface Target {
  provider: 'groq' | 'gemini' | 'openrouter' | 'nvidia' | 'anthropic' | 'ollama';
  url: string;
  apiKey?: string;
  actualModel: string;
}

function resolveTarget(modelId: string): Target {
  const m = modelId.toLowerCase();
  if (m.startsWith('claude/')) {
    return {
      provider: 'anthropic',
      url: ANTHROPIC_URL,
      actualModel: modelId.replace(/^claude\//i, ''),
      apiKey: getKey('ANTHROPIC_API_KEY'),
    };
  }
  if (m.startsWith('gemini-')) {
    return { provider: 'gemini', url: '', actualModel: modelId, apiKey: getKey('GEMINI_API_KEY') };
  }
  if (m.startsWith('openrouter/')) {
    return {
      provider: 'openrouter',
      url: OPENROUTER_URL,
      actualModel: modelId.replace(/^openrouter\//i, ''),
      apiKey: getKey('OPENROUTER_API_KEY'),
    };
  }
  if (m.startsWith('nvidia/')) {
    return {
      provider: 'nvidia',
      url: NVIDIA_URL,
      actualModel: modelId.replace(/^nvidia\//i, ''),
      apiKey: getKey('NVIDIA_API_KEY'),
    };
  }
  if (m.startsWith('ollama/')) {
    return {
      provider: 'ollama',
      url: OLLAMA_URL,
      actualModel: modelId.replace(/^ollama\//i, ''),
    };
  }
  return { provider: 'groq', url: GROQ_URL, actualModel: modelId, apiKey: getKey('GROQ_API_KEY') };
}

function buildMessages(finalSystemPrompt: string, history: any[], prompt: string) {
  const messagesPayload: any[] = [{ role: 'system', content: finalSystemPrompt }];
  if (Array.isArray(history) && history.length > 0) {
    history.slice(-12).forEach((h: any) => {
      if (h.role && h.content) {
        messagesPayload.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content });
      }
    });
  }
  messagesPayload.push({ role: 'user', content: prompt });
  return messagesPayload;
}

function modelLabel(id: string): string {
  const def = findModel(id);
  return def ? `${def.name} · ${def.provider}` : id;
}

function extractErrMessage(body: any, status: number, provider: string): string {
  return (
    body?.error?.message ||
    body?.message ||
    body?.detail ||
    `${provider} API error (${status})`
  );
}

// ── SSE stream builders (OpenAI-style: Groq / OpenRouter / NVIDIA) ────────
function sseStreamFromOpenAIStyle(upstreamRes: Response, announce?: object): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      if (announce) controller.enqueue(encoder.encode(`data: ${JSON.stringify(announce)}\n\n`));
      const reader = upstreamRes.body!.getReader();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`));
            } catch {
              // partial JSON — rest arrives in next chunk
            }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
  });
}

// ── SSE stream builder (Gemini streamGenerateContent?alt=sse) ─────────────
function sseStreamFromGemini(upstreamRes: Response, announce?: object): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      if (announce) controller.enqueue(encoder.encode(`data: ${JSON.stringify(announce)}\n\n`));
      const reader = upstreamRes.body!.getReader();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const json = JSON.parse(data);
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            } catch {
              // partial JSON — skip
            }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
  });
}

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  };
}

// ── One provider attempt (JSON mode) ──────────────────────────────────────
async function callOnce(
  target: Target,
  finalSystemPrompt: string,
  history: any[],
  prompt: string
): Promise<{ text: string }> {
  if (target.provider === 'anthropic') {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': target.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: target.actualModel,
        max_tokens: 4096,
        system: finalSystemPrompt,
        messages: [
          ...history
            .slice(-12)
            .filter((h: any) => h.role && h.content)
            .map((h: any) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
          { role: 'user', content: prompt },
        ],
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(extractErrMessage(body, res.status, 'Claude')), { status: res.status });
    const text = Array.isArray(body.content)
      ? body.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('')
      : '';
    return { text };
  }
  if (target.provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${target.actualModel}:generateContent?key=${target.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: finalSystemPrompt }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(extractErrMessage(body, res.status, 'Gemini')), { status: res.status });
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { text };
  }
  if (target.provider === 'ollama') {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: target.actualModel,
        messages: buildMessages(finalSystemPrompt, history, prompt),
        stream: false,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { const err = Object.assign(new Error(body?.error || `Ollama error (${res.status})`), { status: res.status }); throw err; }
    return { text: body?.message?.content || '' };
  }

  // OpenRouter rejects the whole request (402) when max_tokens exceeds the
  // account's remaining credit budget — keep it comfortably under that
  const maxTokens = target.provider === 'openrouter' ? 2000 : 4096;
  const res = await fetch(target.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${target.apiKey}`,
    },
    body: JSON.stringify({
      model: target.actualModel,
      messages: buildMessages(finalSystemPrompt, history, prompt),
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(extractErrMessage(body, res.status, target.provider)), { status: res.status });
  return { text: body.choices?.[0]?.message?.content || '' };
}

// ── SSE stream builder (Anthropic messages stream) ────────────────────────
function sseStreamFromAnthropic(upstreamRes: Response, announce?: object): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      if (announce) controller.enqueue(encoder.encode(`data: ${JSON.stringify(announce)}\n\n`));
      const reader = upstreamRes.body!.getReader();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const json = JSON.parse(data);
              // Anthropic streams content_block_delta events with text deltas
              const text = json?.delta?.text || json?.delta?.partial_json;
              if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            } catch {
              // partial JSON — skip
            }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
  });
}

// ── SSE stream builder (Ollama /api/chat — newline-delimited JSON) ───────
function sseStreamFromOllama(upstreamRes: Response, announce?: object): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      if (announce) controller.enqueue(encoder.encode(`data: ${JSON.stringify(announce)}\n\n`));
      const reader = upstreamRes.body!.getReader();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const json = JSON.parse(trimmed);
              const text = json?.message?.content;
              if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              if (json?.done) break;
            } catch {
              // partial JSON — skip
            }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
  });
}

// ── One provider attempt (streaming mode) ─────────────────────────────────
async function openStream(
  target: Target,
  finalSystemPrompt: string,
  history: any[],
  prompt: string,
  announce?: object
): Promise<Response> {
  if (target.provider === 'anthropic') {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': target.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: target.actualModel,
        max_tokens: 4096,
        system: finalSystemPrompt,
        stream: true,
        messages: [
          ...history
            .slice(-12)
            .filter((h: any) => h.role && h.content)
            .map((h: any) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => ({}));
      throw Object.assign(new Error(extractErrMessage(body, res.status, 'Claude')), { status: res.status });
    }
    return new Response(appendDone(sseStreamFromAnthropic(res, announce), modelLabelFromTarget(target)), {
      headers: sseHeaders(),
    });
  }
  if (target.provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${target.actualModel}:streamGenerateContent?alt=sse&key=${target.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: finalSystemPrompt }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    });
    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => ({}));
      throw Object.assign(new Error(extractErrMessage(body, res.status, 'Gemini')), { status: res.status });
    }
    // Wrap to append the done event with modelUsed
    return new Response(appendDone(sseStreamFromGemini(res, announce), modelLabelFromTarget(target)), {
      headers: sseHeaders(),
    });
  }
  if (target.provider === 'ollama') {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: target.actualModel,
        messages: buildMessages(finalSystemPrompt, history, prompt),
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => ({}));
      throw Object.assign(new Error(body?.error || `Ollama error (${res.status})`), { status: res.status });
    }
    return new Response(appendDone(sseStreamFromOllama(res, announce), modelLabelFromTarget(target)), {
      headers: sseHeaders(),
    });
  }

  // Same credit-budget constraint as callOnce — see note there
  const maxTokens = target.provider === 'openrouter' ? 2000 : 4096;
  const res = await fetch(target.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${target.apiKey}`,
    },
    body: JSON.stringify({
      model: target.actualModel,
      messages: buildMessages(finalSystemPrompt, history, prompt),
      temperature: 0.7,
      max_tokens: maxTokens,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(extractErrMessage(body, res.status, target.provider)), { status: res.status });
  }
  return new Response(appendDone(sseStreamFromOpenAIStyle(res, announce), modelLabelFromTarget(target)), {
    headers: sseHeaders(),
  });
}

function modelLabelFromTarget(target: Target): string {
  const def = ALL_LABELS[target.actualModel];
  return def || `${target.provider}:${target.actualModel}`;
}
const ALL_LABELS: Record<string, string> = {
  'claude-sonnet-4-20250514': 'Claude Sonnet 4 · Anthropic',
  'claude-3-5-haiku-20241022': 'Claude Haiku 3.5 · Anthropic',
  'openai/gpt-oss-120b': 'GPT OSS 120B · Groq',
  'qwen/qwen3.6-27b': 'Qwen 3.6 27B · Groq',
  'gemini-flash-latest': 'Gemini Flash · Google',
  'gemini-pro-latest': 'Gemini Pro · Google',
  'deepseek/deepseek-chat-v3-0324': 'DeepSeek V3 · OpenRouter',
  'meta-llama/llama-3.3-70b-instruct': 'Llama 3.3 70B · OpenRouter',
  'nvidia/llama-3.1-nemotron-70b-instruct': 'Nemotron 70B · NVIDIA',
  'qwen/qwen2.5-coder-32b-instruct': 'Qwen 2.5 Coder · NVIDIA',
  'deepseek-ai/deepseek-r1': 'DeepSeek R1 · NVIDIA',
  'meta/llama-3.3-70b-instruct': 'Llama 3.3 70B · NVIDIA',
  'llama3.1:8b': 'Llama 3.1 8B · Ollama',
  'llama3.1:70b': 'Llama 3.1 70B · Ollama',
  'gemma2:9b': 'Gemma 2 9B · Ollama',
  'mistral:7b': 'Mistral 7B · Ollama',
  'deepseek-r1:8b': 'DeepSeek R1 8B · Ollama',
  'qwen2.5-coder:7b': 'Qwen 2.5 Coder 7B · Ollama',
};

// Appends a {"status":"done","modelUsed":...} event before [DONE]
function appendDone(source: ReadableStream<Uint8Array>, modelUsed: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return source.pipeThrough(
    new TransformStream({
      flush(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'done', modelUsed })}\n\n`));
      },
    })
  );
}

export async function POST(req: Request) {
  try {
    const {
      prompt,
      model = 'auto',
      systemInstruction,
      history = [],
      stream = false,
      imageMode = false,
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // ----- Image generation shortcut (Pollinations) -----
    // Catches common phrasings: "generate an image of...", "draw a cat",
    // "make a picture of...", "create a logo...", "image banao...",
    // "poster banao", "sketch a house", "paint a sunset", Roman Urdu etc.
    // `imageMode: true` (the toggle in the input box) forces image generation.
    const wantsImage =
      imageMode ||
      /^\s*(please\s+)?(generate|create|make|draw|sketch|paint|render|design|banao|bana|banao|benao)\s+(me\s+)?(an?\s+|the\s+|some\s+)?(image|picture|photo|logo|art|artwork|drawing|wallpaper|poster|illustration|avatar|painting|sketch|icon|banner|thumbnail|anime|digital art)\b/i.test(prompt) ||
      /\b(picture|image|photo|wallpaper|poster|illustration|painting|avatar|drawing)\s+(of|banao|banana|generate|create|make|chahiye)\b/i.test(prompt) ||
      /\b(ka|ki)\s+(photo|picture|image|wallpaper|poster|painting)\b/i.test(prompt) ||
      /^\s*(please\s+)?(draw|sketch|paint)\s+(me\s+)?(a|an|the|some)?\s*\S/i.test(prompt) ||
      (prompt.trim().length <= 80 && /\b(avatar|wallpaper|poster|logo|portrait|painting|illustration|caricature|anime pic|digital art)s?\s*[.!]?$/i.test(prompt.trim())) ||
      /generate image/i.test(prompt);
    if (wantsImage) {
      // Strip the command words to get a clean image prompt
      const imagePrompt = prompt
        .replace(/^\s*(please\s+)?(generate|create|make|draw|sketch|paint|render|design|banao|bana|benao)\s+(me\s+)?(an?\s+|the\s+|some\s+)?(image|picture|photo|logo|art|artwork|drawing|wallpaper|poster|illustration|avatar|painting|sketch|icon|banner|thumbnail)\s*(of|for|me|do)?\s*/i, '')
        .replace(/^\s*(please\s+)?(draw|sketch|paint)\s+(me\s+)?(a|an|the|some)?\s*/i, '')
        .replace(/\s+(banao|banana|bana do|generate|create|make|please|chahiye)$/i, '')
        .replace(/\s+(ka|ki)\s+(photo|picture|image|wallpaper|poster|painting)$/i, '')
        .replace(/^\s*(please\s+)?(create|make|generate|design|render)\s+(me\s+)?(a|an|the|some)?\s*/i, '')
        .trim() || prompt;

      // 1) Try Gemini image generation (user's GEMINI_API_KEY) — high quality
      let imageUrl: string | null = null;
      let modelUsedLabel = 'Pollinations · Image Gen';
      let geminiError: string | undefined;
      const geminiKey = getKey('GEMINI_API_KEY');
      if (geminiKey) {
        const g = await generateImageWithGemini(geminiKey, imagePrompt);
        imageUrl = g.url;
        geminiError = g.error;
        if (imageUrl) modelUsedLabel = 'Gemini Image · Google';
      }
      if (!imageUrl) {
        let enhancedPrompt = imagePrompt;
        
        // Auto-enhance short prompts using available text models (Groq or OpenRouter)
        if (imagePrompt.length < 150) {
          const groqKey = getKey('GROQ_API_KEY');
          const orKey = getKey('OPENROUTER_API_KEY');
          
          let targetUrl = '';
          let targetKey = '';
          let targetModel = '';
          let provider = '';
          
          if (groqKey) {
            targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
            targetKey = groqKey;
            targetModel = 'llama-3.3-70b-versatile';
            provider = 'groq';
          } else if (orKey) {
            targetUrl = 'https://openrouter.ai/api/v1/chat/completions';
            targetKey = orKey;
            targetModel = 'meta-llama/llama-3.3-70b-instruct';
            provider = 'openrouter';
          }

          if (targetUrl) {
            try {
              const res = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${targetKey}`
                },
                body: JSON.stringify({
                  model: targetModel,
                  messages: [
                    { role: 'system', content: 'You are a prompt engineer for an image generation AI. The user will give you a short, vague idea. Expand it into a highly detailed, descriptive, and visually rich image prompt (max 400 chars). Focus on lighting, style, composition, and quality. Do NOT add any conversational text, just output the enhanced prompt itself.' },
                    { role: 'user', content: imagePrompt }
                  ],
                  temperature: 0.7,
                  max_tokens: 150
                })
              });
              if (res.ok) {
                const data = await res.json();
                const expanded = data.choices?.[0]?.message?.content?.trim();
                if (expanded && expanded.length > 20) {
                  enhancedPrompt = expanded;
                  modelUsedLabel = `Pollinations (Enhanced by ${provider === 'groq' ? 'Groq' : 'OpenRouter'})`;
                }
              }
            } catch (e) {
              // ignore enhancement error and use original
            }
          }
        }
        
        const encodedPrompt = encodeURIComponent(enhancedPrompt);
        imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=false&seed=${Math.floor(Math.random() * 1000000)}`;
      }
      const imageHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-[#212121] min-h-screen flex flex-col items-center justify-center p-4 text-white font-sans">
          <div class="max-w-xl w-full bg-[#2a2a2a] border border-white/10 rounded-2xl p-4 shadow-2xl text-center">
            <img src="${imageUrl}" alt="${imagePrompt}" class="w-full h-auto rounded-xl object-cover shadow-lg border border-white/10 mb-4" />
            <p class="text-xs text-[#afafaf] italic">"${imagePrompt}"</p>
            <a href="${imageUrl}" target="_blank" download="generated-image.jpg" class="mt-3 inline-block px-4 py-2 bg-white text-black text-xs font-semibold rounded-lg transition-colors hover:bg-white/90">Download Image</a>
          </div>
        </body>
        </html>
      `;
      return NextResponse.json({
        imageUrl,
        imagePrompt,
        text: imageHtml,
        html: imageHtml,
        type: 'image',
        modelUsed: modelUsedLabel,
        category: 'image',
        categoryLabel: 'Image Generation',
        geminiError,
      });
    }

    // ----- Boss Agent routing decision -----
    const isAuto = (model || '').toLowerCase() === 'auto';
    const decision = isAuto ? routePrompt(prompt) : null;
    const chainRaw = isAuto ? decision!.chain : [model];

    // Only attempt models whose provider key exists (Ollama is local — no key needed)
    const chain = chainRaw.filter((id) => {
      const t = resolveTarget(id);
      return t.provider === 'ollama' || !!t.apiKey;
    });
    if (chain.length === 0) {
      return NextResponse.json(
        { error: 'No API keys configured for any available provider. Open Settings → API Keys to add them, or set GROQ_API_KEY / GEMINI_API_KEY / OPENROUTER_API_KEY / NVIDIA_API_KEY / ANTHROPIC_API_KEY in .env.local. Ollama models also work locally without a key — make sure Ollama is running (ollama serve).' },
        { status: 500 }
      );
    }
    // If the ideal pick's provider key is missing, say so in the routing note
    if (decision && chain.length && chain[0] !== chainRaw[0]) {
      const ideal = findModel(chainRaw[0]);
      const actual = findModel(chain[0]);
      decision.reason += ` — ${ideal?.name}'s API key not set, using ${actual?.name} (${actual?.provider}) instead`;
    }

// ─────────────────────────────────────────────────────────────────────────
// BOSS AGENT TASK STYLES — each detected task type gets its own output
// style so the answer MATCHES the task (research → research, code → code,
// suggestion → suggestions, image → image).
// ─────────────────────────────────────────────────────────────────────────
const TASK_STYLES: Record<string, string> = {
  research: `TASK MODE: RESEARCH. You are acting as a research assistant.
- Answer with well-structured sections: a short direct answer first, then details under clear headings.
- Include key facts, dates, numbers, and background. Use bullet lists for facts.
- If comparing things, use a markdown table.
- Add a "Key takeaways" summary at the end.
- Do NOT write code unless the user explicitly asks for it.`,
  suggestion: `TASK MODE: SUGGESTIONS. You are acting as an advisor.
- Lead with a numbered list of 3-7 concrete, actionable suggestions.
- Each item: bold title + 1-2 line explanation.
- Order from best/most recommended to least.
- End with a one-line "My top pick" recommendation.
- Keep it concise — no code, no long essays unless asked.`,
  code: `TASK MODE: CODING. You are acting as a senior software engineer.
- Give complete, working, copy-paste-ready code FIRST in proper code blocks with language tags.
- Keep prose minimal: brief intro, the code, then short notes on how it works.
- Include edge cases and error handling where sensible.
- If it's a bug/debug question: identify the root cause clearly, then show the fixed code.`,
  web: `TASK MODE: WEB BUILDING. You are acting as an expert frontend developer.
- ALWAYS deliver a complete, self-contained artifact wrapped in \`\`\`html ... \`\`\` (full HTML with inline CSS/JS, real content — no lorem ipsum).
- The artifact must look modern, polished and responsive.
- Brief prose only — the artifact is the answer.`,
  reasoning: `TASK MODE: ANALYSIS. You are acting as an analytical thinker.
- Work through the problem step by step with clear numbered steps.
- Show the logic/reasoning, then give a clearly-marked final answer.
- Use math notation where helpful.`,
  writing: `TASK MODE: WRITING. You are acting as a professional writer.
- Deliver polished, ready-to-use text that matches the requested format/tone.
- Correct length as requested; no meta commentary about the writing process.`,
  longcontext: `TASK MODE: DOCUMENT PROCESSING. You are acting as a document analyst.
- Process the provided content thoroughly and completely.
- Structure: overview → key points → details. Never truncate important information.`,
  chat: `TASK MODE: CONVERSATION. Be natural, warm, and helpful. Answer directly and concisely. Use markdown formatting for readability.`,
};

const finalSystemPrompt = systemInstruction?.trim()
  ? `${DEFAULT_SYSTEM_PROMPT}\n\nProject Specific Instructions:\n${systemInstruction}`
  : DEFAULT_SYSTEM_PROMPT;

// ----- Boss Agent: LIVE WEB SEARCH -----
// When the task is research/search or needs fresh info (news, prices, dates),
// hit DuckDuckGo first and feed REAL results to the model so it answers with
// current facts + sources.
let searchContextBlock = '';
if (needsWebSearch(prompt) || decision?.category === 'research') {
  try {
    const results = await searchWeb(prompt, 5);
    if (results.length) {
      searchContextBlock = formatSearchContext(results);
      const note = ` — 🔍 live web search done (${results.length} sources)`;
      if (decision) decision.reason += note;
    }
  } catch {
    // search failed → answer without live data, no crash
  }
}

// Boss Agent detected a task category → apply its matching output style
const styledSystemPrompt =
  (decision && TASK_STYLES[decision.category]
    ? `${finalSystemPrompt}\n\n${TASK_STYLES[decision.category]}`
    : finalSystemPrompt) +
  (searchContextBlock
    ? `\n\n${searchContextBlock}\n\nINSTRUCTIONS: The above are REAL-TIME web search results fetched just now. Use them as your primary source for current facts, figures, and events. Weave them naturally into your answer and list the source links at the end under a "Sources" heading as markdown bullets. If the results don't fully answer the question, say what's missing.`
    : '');

    const failoverNotes: string[] = [];

    // ================= STREAMING MODE =================
    if (stream) {
      for (let i = 0; i < Math.min(chain.length, MAX_FAILOVERS); i++) {
        const modelId = chain[i];
        const target = resolveTarget(modelId);
        const announce = {
          status: 'model',
          model: findModel(modelId)?.name || modelId,
          provider: target.provider === 'anthropic' ? 'Claude' : target.provider,
          routing: decision && i === 0 ? decision.reason : undefined,
          category: decision?.category,
          categoryLabel: decision?.categoryLabel,
        };
        try {
          return await openStream(target, styledSystemPrompt, history, prompt, announce);
        } catch (err: any) {
          const quota = isQuotaError(err.status, err.message);
          failoverNotes.push(`${modelLabel(modelId)} failed (${quota ? 'free tier / quota finished' : err.message})`);
          console.warn(`[Boss] ${failoverNotes[failoverNotes.length - 1]} → trying next model`);
        }
      }
      return NextResponse.json(
        { error: `All models failed. ${failoverNotes.join(' | ')}` },
        { status: 502 }
      );
    }

    // ================= JSON MODE =================
    let lastErr: any = null;
    for (let i = 0; i < Math.min(chain.length, MAX_FAILOVERS); i++) {
      const modelId = chain[i];
      const target = resolveTarget(modelId);
      try {
        const { text } = await callOnce(target, styledSystemPrompt, history, prompt);
        if (!text.trim()) throw new Error('Empty response');
        const payload: any = {
          text,
          html: text,
          type: 'chat',
          modelUsed: modelLabel(modelId),
        };
        if (decision) {
          payload.routing = decision.reason;
          payload.category = decision.category;
          payload.categoryLabel = decision.categoryLabel;
        }
        if (failoverNotes.length) payload.failovers = failoverNotes;
        return NextResponse.json(payload);
      } catch (err: any) {
        lastErr = err;
        const quota = isQuotaError(err.status, err.message);
        failoverNotes.push(`${modelLabel(modelId)} failed (${quota ? 'free tier / quota finished' : err.message})`);
        console.warn(`[Boss] ${failoverNotes[failoverNotes.length - 1]} → trying next model`);
      }
    }
    return NextResponse.json(
      { error: `All models failed. ${failoverNotes.join(' | ') || lastErr?.message || 'Unknown error'}` },
      { status: 502 }
    );
  } catch (err: any) {
    console.error('Generation Endpoint Error:', err);
    return NextResponse.json({ error: err.message || 'Server error generating response' }, { status: 500 });
  }
}
