export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileId, html } = req.body;

  if (!fileId || !html) {
    return res.status(400).json({ error: "Missing payload" });
  }

  try {
    const zapierRes = await fetch(
      "https://hooks.zapier.com/hooks/catch/19867794/uaz4d11/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileId,
          html,
          length: html.length
        })
      }
    );

    if (!zapierRes.ok) {
      const text = await zapierRes.text();
      throw new Error(`Zapier error: ${zapierRes.status} - ${text}`);
    }

    return res.status(200).json({
      success: true,
      size: html.length
    });

  } catch (err) {
    console.error("Zapier proxy error:", err);
    return res.status(500).json({
      error: "Failed to submit newsletter",
      details: err.message
    });
  }
}
