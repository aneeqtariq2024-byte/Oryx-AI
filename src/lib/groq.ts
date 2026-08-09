export const askGroq = async (prompt: string, apiKey: string) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
      }),
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response from Groq.';
  } catch (error) {
    console.error('Groq Error:', error);
    return 'Failed to generate response. Please check your Groq API key.';
  }
};
