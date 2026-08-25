// src/lib/models.ts
// Shared model registry + Boss Agent auto-routing brain.
// Used by BOTH the frontend (ModelSelector) and the backend (/api/generate),
// so what the user sees is exactly what the router can pick.

export type Provider = 'Claude' | 'Groq' | 'Gemini' | 'OpenRouter' | 'NVIDIA' | 'Ollama';

export interface ModelDef {
  id: string;          // wire id sent to /api/generate
  name: string;
  provider: Provider;
  description: string;
  speed: 'Lightning' | 'Fast' | 'Power';
  context: string;
  icon: 'Zap' | 'Cpu' | 'Layers' | 'Sparkles' | 'Brain' | 'Rocket';
  strengths: ModelStrength[];
}

export type ModelStrength =
  | 'code'        // writing / debugging code
  | 'web'         // building websites & UI
  | 'reasoning'   // math, logic, analysis
  | 'research'    // search, facts, information lookup, deep-dives
  | 'suggestion'  // ideas, recommendations, advice, tips
  | 'writing'     // copywriting, creative, professional text
  | 'longcontext' // huge documents / summaries
  | 'chat';       // general fast Q&A

export interface BossModelOption {
  id: 'auto';
  name: string;
  description: string;
  speed: string;
  context: string;
  icon: string;
  provider?: undefined;
  isBoss: true;
}

export const BOSS_MODEL: BossModelOption = {
  id: 'auto',
  name: 'Boss Agent',
  description: 'AI auto-analyzes your task & picks the best model — with free-tier failover',
  speed: 'Smart',
  context: '∞',
  icon: 'Brain',
  isBoss: true,
};

export const ALL_MODELS: ModelDef[] = [
  // ── Claude / Anthropic ─────────────────────────────────────────────────
  { id: 'claude/claude-sonnet-4-20250514',    name: 'Claude Sonnet 4',     provider: 'Claude',     description: 'Anthropic · Elite coding, polished writing & agentic tasks', speed: 'Power',     context: '200k', icon: 'Sparkles', strengths: ['code', 'web', 'writing', 'reasoning', 'research', 'suggestion'] },
  { id: 'claude/claude-3-5-haiku-20241022',   name: 'Claude Haiku 3.5',    provider: 'Claude',     description: 'Anthropic · Fast & efficient everyday assistant',            speed: 'Fast',      context: '200k', icon: 'Zap',      strengths: ['chat', 'writing', 'research', 'suggestion'] },
  // ── Groq (free tier: rate-limited daily) ──────────────────────────────
  { id: 'openai/gpt-oss-120b',              name: 'GPT OSS 120B',        provider: 'Groq',       description: 'Groq · Fast reasoning & high throughput',       speed: 'Lightning', context: '128k', icon: 'Zap',      strengths: ['chat', 'web', 'writing', 'code'] },
  { id: 'qwen/qwen3.6-27b',                 name: 'Qwen 3.6 27B',        provider: 'Groq',       description: 'Groq · Ultra-fast open reasoning & code',      speed: 'Lightning', context: '128k',  icon: 'Cpu',     strengths: ['reasoning', 'code', 'web'] },
  // ── Google Gemini (generous free tier) ────────────────────────────────
  { id: 'gemini-flash-latest',               name: 'Gemini Flash',         provider: 'Gemini',     description: 'Google · Latest fast multimodal (auto-updates)', speed: 'Fast',      context: '1M',   icon: 'Sparkles', strengths: ['chat', 'longcontext', 'web', 'research'] },
  { id: 'gemini-pro-latest',                 name: 'Gemini Pro',           provider: 'Gemini',     description: 'Google · Latest advanced long-context (auto-updates)', speed: 'Power',  context: '2M',   icon: 'Sparkles', strengths: ['longcontext', 'reasoning', 'writing', 'research'] },
  // ── OpenRouter (free models with daily caps) ──────────────────────────
  { id: 'openrouter/deepseek/deepseek-chat-v3-0324',    name: 'DeepSeek V3',     provider: 'OpenRouter', description: 'OpenRouter · Latest DeepSeek chat model', speed: 'Fast',  context: '64k',  icon: 'Cpu',    strengths: ['code', 'reasoning', 'chat'] },
  { id: 'openrouter/meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B',   provider: 'OpenRouter', description: 'OpenRouter · Meta flagship instruct',     speed: 'Fast',  context: '128k', icon: 'Layers', strengths: ['chat', 'writing', 'web', 'suggestion'] },
  // ── NVIDIA NIM (free API credits) ─────────────────────────────────────
  { id: 'nvidia/nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B',     provider: 'NVIDIA', description: 'NVIDIA · Precision-tuned reasoning engine',   speed: 'Power',     context: '128k', icon: 'Brain',  strengths: ['reasoning', 'writing', 'research'] },
  { id: 'nvidia/qwen/qwen2.5-coder-32b-instruct',        name: 'Qwen 2.5 Coder',  provider: 'NVIDIA', description: 'NVIDIA · Elite code generation specialist',   speed: 'Fast',      context: '32k',  icon: 'Rocket', strengths: ['code'] },
  { id: 'nvidia/deepseek-ai/deepseek-r1',                name: 'DeepSeek R1',     provider: 'NVIDIA', description: 'NVIDIA · Deep chain-of-thought reasoning',    speed: 'Power',     context: '64k',  icon: 'Cpu',    strengths: ['reasoning', 'code'] },
  { id: 'nvidia/meta/llama-3.3-70b-instruct',            name: 'Llama 3.3 70B',   provider: 'NVIDIA', description: 'NVIDIA · Meta flagship on NIM',               speed: 'Fast',      context: '128k', icon: 'Layers', strengths: ['chat', 'web', 'writing'] },
  // ── Ollama (local, free, no API key) ───────────────────────────────────
  { id: 'ollama/llama3.1:8b',              name: 'Llama 3.1 8B',       provider: 'Ollama',    description: 'Ollama · Local · Fast general-purpose LLM',              speed: 'Fast',      context: '128k', icon: 'Cpu',      strengths: ['chat', 'writing'] },
  { id: 'ollama/llama3.1:70b',             name: 'Llama 3.1 70B',      provider: 'Ollama',    description: 'Ollama · Local · Powerful open-source LLM',               speed: 'Power',     context: '128k', icon: 'Brain',    strengths: ['chat', 'reasoning', 'writing', 'code'] },
  { id: 'ollama/gemma2:9b',               name: 'Gemma 2 9B',          provider: 'Ollama',    description: 'Ollama · Local · Google lightweight model',              speed: 'Fast',      context: '8k',    icon: 'Sparkles', strengths: ['chat', 'writing', 'suggestion'] },
  { id: 'ollama/mistral:7b',              name: 'Mistral 7B',         provider: 'Ollama',    description: 'Ollama · Local · Efficient French-made LLM',             speed: 'Fast',      context: '32k',  icon: 'Zap',      strengths: ['chat', 'code', 'writing'] },
  { id: 'ollama/deepseek-r1:8b',          name: 'DeepSeek R1 8B',     provider: 'Ollama',    description: 'Ollama · Local · Chain-of-thought reasoning',             speed: 'Fast',      context: '128k', icon: 'Brain',    strengths: ['reasoning', 'code'] },
  { id: 'ollama/qwen2.5-coder:7b',        name: 'Qwen 2.5 Coder 7B',  provider: 'Ollama',    description: 'Ollama · Local · Elite local code generation',             speed: 'Fast',      context: '32k',  icon: 'Rocket',   strengths: ['code'] },
];

export function findModel(id: string): ModelDef | undefined {
  return ALL_MODELS.find((m) => m.id === id);
}

// ─────────────────────────────────────────────────────────────────────────
// BOSS AGENT ROUTER — analyzes the prompt and returns a RANKED chain of
// models. The backend tries #1 first; if its free tier / quota is finished
// (429 / rate limit / credits exhausted), it automatically fails over to
// the next model in the chain — across providers.
// ─────────────────────────────────────────────────────────────────────────

interface TaskCategory {
  key: ModelStrength;
  label: string;
  patterns: RegExp;
}

const CATEGORIES: TaskCategory[] = [
  {
    key: 'code',
    label: 'Coding & Debugging',
    patterns: /code|coding|debug|error|bug|function|class|api|script|python|javascript|typescript|react|node|sql|regex|algorithm|refactor|compile|program|kaise banaye code|code banao/i,
  },
  {
    key: 'web',
    label: 'Website & UI Building',
    patterns: /website|web ?app|landing ?page|html|css|tailwind|dashboard|ui|frontend|portfolio|hero section|navbar|portfolio site|clone (of|a)? ?(website|site)|website banao|site banao/i,
  },
  {
    key: 'research',
    label: 'Research & Information Search',
    patterns: /\b(search|research|find (out|information|info)|look up|who is|who was|what is|what are|when (did|was|is)|where (is|was)|history of|facts about|information about|tell me about|latest|news|define|meaning of|difference between|kya hai|kaun hai|kab|kahan|batao|maloom|history|background|overview of|deep dive)\b/i,
  },
  {
    key: 'suggestion',
    label: 'Suggestions & Recommendations',
    patterns: /\b(suggest|suggestion|suggest karo|recommend|recommendation|advice|advise|ideas?|tips?|should i|best way|best (tool|app|method|approach)|help me (choose|decide|pick)|options for|ways to|kya karu|kya karna chahiye|raay|tajweez|ideas do|list of)\b/i,
  },
  {
    key: 'reasoning',
    label: 'Deep Reasoning & Analysis',
    patterns: /analy[sz]e|analysis|why|explain how|math|calculat|solve|logic|compare|pros and cons|strategy|step.by.step|prove|evaluate|decide/i,
  },
  {
    key: 'writing',
    label: 'Professional Writing',
    patterns: /write|email|essay|blog|article|post|caption|story|letter|resume|cover letter|rewrite|polish|proofread|summar/i,
  },
  {
    key: 'longcontext',
    label: 'Long Document Processing',
    patterns: /document|pdf|transcript|entire|whole (book|file|text)|chapter|thousand words|paste|summarize (this|the) (doc|document|text)/i,
  },
];

/**
 * Boss Agent specialized modes. Every detected task type gets its own
 * agent identity (emoji badge shown in UI) + a specialized system prompt
 * so the picked model answers in the right style for that task.
 */
export const TASK_META: Record<string, { emoji: string; label: string; systemHint: string }> = {
  code: {
    emoji: '💻',
    label: 'Coding Agent',
    systemHint:
      'MODE: CODING AGENT. Focus entirely on the code: correct, complete, production-ready. Use fenced code blocks with the language tag. Explain briefly before/after the code only — no filler. Include how to run it and edge cases.',
  },
  web: {
    emoji: '🌐',
    label: 'Web Builder Agent',
    systemHint:
      'MODE: WEB BUILDER AGENT. Deliver a complete, self-contained website in ONE ```html artifact (inline CSS/JS, real content, no lorem ipsum). Modern design, responsive, working interactions.',
  },
  research: {
    emoji: '🔍',
    label: 'Research Agent',
    systemHint:
      'MODE: RESEARCH AGENT. Answer like a research assistant: accurate facts, structured with headings, cover key aspects (what/who/when/why), include dates & numbers when known, short TL;DR at the top. Clearly say if something is uncertain.',
  },
  suggestion: {
    emoji: '💡',
    label: 'Advisor Agent',
    systemHint:
      'MODE: ADVISOR AGENT. Give recommendations like an expert advisor: a clear top pick first, then 3-5 ranked options with one-line pros/cons each, then a short "what would I do" verdict. Be decisive.',
  },
  reasoning: {
    emoji: '🧠',
    label: 'Deep Thinker Agent',
    systemHint:
      'MODE: DEEP THINKER AGENT. Reason step by step. Show the logic chain, verify the math/logic, then give the final answer clearly marked. Double-check calculations before answering.',
  },
  writing: {
    emoji: '✍️',
    label: 'Writer Agent',
    systemHint:
      'MODE: WRITER AGENT. Write professionally with the right tone for the format (email/essay/blog/etc). Well-structured paragraphs, natural flow, no robotic phrasing. Provide the final piece ready to copy-paste.',
  },
  longcontext: {
    emoji: '📄',
    label: 'Doc Analyst Agent',
    systemHint:
      'MODE: DOC ANALYST AGENT. Process the provided document thoroughly: summary first, then key points, entities, action items, and any notable data. Do not skip parts of the text.',
  },
  chat: {
    emoji: '💬',
    label: 'Chat Agent',
    systemHint: 'MODE: CHAT AGENT. Be warm, concise and helpful. Answer directly, use light markdown when useful.',
  },
  image: {
    emoji: '🖼️',
    label: 'Image Agent',
    systemHint: 'MODE: IMAGE AGENT. Generate the described image.',
  },
};

export interface RoutingDecision {
  category: ModelStrength;
  categoryLabel: string;
  reason: string;
  chain: string[]; // ranked model ids, best first
}

export function routePrompt(prompt: string): RoutingDecision {
  const text = prompt || '';

  // Score each category by pattern hits
  let best: TaskCategory | null = null;
  let bestScore = 0;
  for (const cat of CATEGORIES) {
    const matches = text.match(cat.patterns);
    const score = matches ? Math.min(matches.length, 3) : 0;
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }

  const category: ModelStrength = best ? best.key : 'chat';
  const categoryLabel = best ? best.label : 'General Conversation';
  const promptLength = text.length;

  // Rank models purely by task fit (provider-agnostic — Boss spreads
  // usage across providers; speed is only a tiebreaker via registry order).
  const ranked = [...ALL_MODELS]
    .map((m) => {
      let score = 0;
      if (m.strengths.includes(category)) score += 10;
      if (promptLength > 12000 && m.strengths.includes('longcontext')) score += 8;
      if (promptLength > 30000 && m.provider === 'Gemini') score += 6;
      if (category === 'code' && m.name.includes('Coder')) score += 5;
      if (category === 'reasoning' && /nemotron|r1/i.test(m.name)) score += 4;
      if (category === 'research' && /gemini pro|sonnet|nemotron/i.test(m.name)) score += 4;
      if (category === 'suggestion' && /sonnet|llama/i.test(m.name)) score += 2;
      return { m, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m.id);

  // Interleave providers so failover lands on a DIFFERENT provider
  // (a dead free tier on Groq shouldn't fail over to Groq again).
  const byProvider = new Map<string, string[]>();
  for (const id of ranked) {
    const p = findModel(id)!.provider;
    if (!byProvider.has(p)) byProvider.set(p, []);
    byProvider.get(p)!.push(id);
  }
  const chain: string[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const list of byProvider.values()) {
      if (list.length) {
        chain.push(list.shift()!);
        added = true;
      }
    }
  }

  const top = findModel(chain[0]);
  return {
    category,
    categoryLabel,
    reason: `Detected: ${categoryLabel} → best pick ${top?.name} (${top?.provider}), with ${chain.length - 1} backup model${chain.length - 1 === 1 ? '' : 's'} across providers`,
    chain,
  };
}

// Errors that mean "free tier / quota finished" → failover to next model
export function isQuotaError(status: number | undefined, message: string | undefined): boolean {
  const msg = (message || '').toLowerCase();
  return (
    status === 429 ||
    status === 402 ||
    /rate.?limit|quota|exceeded|exhaust|free tier|insufficient|credit|too many requests|usage limit|billing|payment required/.test(msg)
  );
}
