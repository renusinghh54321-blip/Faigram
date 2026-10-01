// This runs on the server (Vercel), so your API key stays secret.
// Visitors to your website never see it.

const PERSONALITY =
  "You are Faigram, a friendly and helpful personal assistant. " +
  "Give clear, short answers unless the user asks for more detail.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key is not set on the server" });
  }

  const messages = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages sent" });
  }

  // Keep only the last 20 messages to control cost
  const recent = messages.slice(-20);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        max_tokens: 1024,
        system: PERSONALITY,
        messages: recent,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "AI request failed" });
    }

    const reply = data.content?.[0]?.text || "(no reply)";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
