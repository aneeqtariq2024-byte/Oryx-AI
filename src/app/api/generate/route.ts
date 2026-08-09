import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const {
      prompt,
      model = 'llama-3.3-70b-versatile',
      systemInstruction,
      history = [],
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const lowerPrompt = prompt.toLowerCase();

    // 1. IMAGE GENERATION INTENT DETECTOR
    if (
      lowerPrompt.startsWith('generate image') ||
      lowerPrompt.startsWith('draw') ||
      lowerPrompt.includes('create an image') ||
      lowerPrompt.includes('picture of')
    ) {
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(
        Math.random() * 1000000
      )}`;

      const imageHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-950 min-h-screen flex flex-col items-center justify-center p-4 text-white font-sans">
          <div class="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-center">
            <img src="${imageUrl}" alt="${prompt}" class="w-full h-auto rounded-xl object-cover shadow-lg border border-slate-800 mb-4" />
            <p class="text-xs text-slate-400 italic">"${prompt}"</p>
            <a href="${imageUrl}" target="_blank" download="generated-image.jpg" class="mt-3 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold rounded-lg transition-colors">Download Image</a>
          </div>
        </body>
        </html>
      `;

      return NextResponse.json({ text: imageHtml, html: imageHtml, type: 'image' });
    }

    // Default System Prompt
    const defaultSystemPrompt = `You are Oryx AI, a highly capable, intelligent, and helpful AI workspace assistant and expert web developer.
Answer user questions clearly, accurately, and professionally.
When asked to create a website, web app, or frontend interface, provide full, interactive code wrapped in triple backtick code blocks like \`\`\`html ... \`\`\`.
When answering general questions, chat, or coding queries, respond directly in clean, well-formatted text/markdown.`;

    const finalSystemPrompt = systemInstruction?.trim()
      ? `${defaultSystemPrompt}\n\nProject Specific Instructions:\n${systemInstruction}`
      : defaultSystemPrompt;

    // Build Messages Payload with History
    const messagesPayload: any[] = [{ role: 'system', content: finalSystemPrompt }];

    // Include recent history (last 10 messages max to stay within context)
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach((h: any) => {
        if (h.role && h.content) {
          messagesPayload.push({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.content,
          });
        }
      });
    }

    // Add current user prompt
    messagesPayload.push({ role: 'user', content: prompt });

    // Groq API Key
    const groqApiKey =
      process.env.GROQ_API_KEY ||
      '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';

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: messagesPayload,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    const groqData = await groqRes.json();

    if (!groqRes.ok || groqData.error) {
      console.error('Groq Error Details:', groqData.error || groqData);
      const errMsg = groqData.error?.message || `Groq API Error (${groqRes.status})`;
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    const generatedContent = groqData.choices?.[0]?.message?.content || '';

    if (!generatedContent.trim()) {
      return NextResponse.json(
        { error: 'Groq API returned empty response.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      text: generatedContent,
      html: generatedContent,
      type: 'chat',
    });
  } catch (err: any) {
    console.error('Generation Endpoint Error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error generating response' },
      { status: 500 }
    );
  }
}