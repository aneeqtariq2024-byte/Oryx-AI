// src/lib/webSearch.ts
// Free real-time web search via DuckDuckGo's HTML endpoint (no API key needed).
// Boss Agent uses this when the user's prompt needs fresh/live information,
// then feeds the results to the LLM so it can answer with real sources.

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/** Does this prompt need live info from the web? */
export function needsWebSearch(prompt: string): boolean {
  return (
    /\b(latest|news|today|right now|currently|current|recent|recently|this (week|month|year)|2024|2025|2026|price of|stock|weather|who won|score|match|released|release date|trending|viral|update(s)? on|abhi|aaj|kal|naya|nayi|taaza)\b/i.test(
      prompt
    ) || /\b(search|google it|look it up|find out|khojo|dhoondo|search karo)\b/i.test(prompt)
  );
}

function decodeHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** DDG wraps targets in a redirect: //duckduckgo.com/l/?uddg=<encoded>&rut=... */
function cleanUrl(href: string): string {
  try {
    if (href.includes('uddg=')) {
      const m = href.match(/uddg=([^&]+)/);
      if (m) return decodeURIComponent(m[1]);
    }
    return href.startsWith('//') ? `https:${href}` : href;
  } catch {
    return href;
  }
}

/** Scrape DuckDuckGo HTML for the top organic results. */
export async function searchWeb(query: string, count = 5): Promise<SearchResult[]> {
  try {
    // Hard 8s timeout — if DDG hangs or is blocked, skip live search instead
    // of stalling the whole chat response.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const html = await res.text();

    const snippets: string[] = [];
    const snippetRe = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
    let sm: RegExpExecArray | null;
    while ((sm = snippetRe.exec(html)) !== null && snippets.length < count) {
      snippets.push(decodeHtml(sm[1]));
    }

    const results: SearchResult[] = [];
    const linkRe = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let lm: RegExpExecArray | null;
    while ((lm = linkRe.exec(html)) !== null && results.length < count) {
      const title = decodeHtml(lm[2]);
      const url = cleanUrl(lm[1]);
      if (!title || !url || url.includes('duckduckgo.com')) continue;
      results.push({ title, url, snippet: snippets[results.length] || '' });
    }
    return results;
  } catch {
    return [];
  }
}

/** Format results as a compact context block for the LLM. */
export function formatSearchContext(results: SearchResult[]): string {
  if (!results.length) return '';
  const lines = results.map(
    (r, i) => `[${i + 1}] ${r.title}\n    ${r.snippet}\n    Source: ${r.url}`
  );
  return `WEB SEARCH RESULTS (live from DuckDuckGo, most relevant first):\n${lines.join('\n\n')}`;
}
