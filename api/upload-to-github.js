const GITHUB_API_BASE = "https://api.github.com";
const OWNER = "mfackrell";
const REPO = "sfm-newsletter-editor";
const BRANCH = "main";

function sanitizeFilename(filename) {
  return String(filename || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return res.status(500).json({ error: "Missing GITHUB_TOKEN" });
  }

  const { imageBase64, filename } = req.body || {};
  const safeFilename = sanitizeFilename(filename);

  if (!imageBase64 || !safeFilename) {
    return res.status(400).json({ error: "Missing imageBase64 or filename" });
  }

  const normalizedBase64 = String(imageBase64).includes(",")
    ? String(imageBase64).split(",").pop()
    : String(imageBase64);

  const apiUrl = `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/assets/${safeFilename}`;

  try {
    const githubRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Add uploaded asset ${safeFilename}`,
        content: normalizedBase64,
        branch: BRANCH
      })
    });

    const githubJson = await githubRes.json();

    if (!githubRes.ok) {
      return res.status(githubRes.status).json({
        error: "Failed to upload to GitHub",
        details: githubJson
      });
    }

    return res.status(200).json({
      success: true,
      download_url: githubJson?.content?.download_url,
      github: githubJson
    });
  } catch (err) {
    console.error("GitHub upload error:", err);

    return res.status(500).json({
      error: "Unexpected upload error",
      details: err.message
    });
  }
}
