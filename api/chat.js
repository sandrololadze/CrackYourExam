export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const CRAZYROUTER_KEY = process.env.CRAZYROUTER_API_KEY;
  if (!CRAZYROUTER_KEY) {
    return res.status(500).json({ error: { message: 'API key not configured on server.' } });
  }

  try {
    const { system, messages, max_tokens = 1000 } = req.body;

    // Build OpenAI-compatible messages array
    const openAiMessages = [];
    if (system) openAiMessages.push({ role: 'system', content: system });
    if (Array.isArray(messages)) openAiMessages.push(...messages);

    const upstream = await fetch('https://api.crazyrouter.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRAZYROUTER_KEY}`
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens,
        messages: openAiMessages
      })
    });

    const data = await upstream.json();

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    // Normalize to Anthropic-style shape that the frontend expects
    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (err) {
    return res.status(500).json({ error: { message: err.message || 'Server error' } });
  }
}
