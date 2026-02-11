const preview = document.getElementById("preview");
const saveBtn = document.getElementById("saveBtn");

const params = new URLSearchParams(window.location.search);
const fileId = params.get("fileId");

function sanitizeEmailHtmlForBrowser(html) {
  // Fix markdown-style href="[url](url)"
  html = html.replace(
    /href="\[(https?:\/\/[^\]]+)\]\([^)]+\)"/g,
    'href="$1"'
  );

  // Remove empty-src images
  html = html.replace(
    /<img\b[^>]*\bsrc\s*=\s*["']\s*["'][^>]*>/gi,
    ''
  );

  // Remove cid images (browser can't render them)
  html = html.replace(
    /<img\b[^>]*\bsrc\s*=\s*["']cid:[^"']*["'][^>]*>/gi,
    ''
  );

  return html;
}


if (!fileId) {
  alert("No fileId provided.");
} else {
  const githubRawUrl = `https://raw.githubusercontent.com/mfackrell/sfm-newsletter-editor/main/${fileId}.html`;

  fetch(githubRawUrl)
    .then(res => {
      if (!res.ok) throw new Error("Failed to load HTML");
      return res.text();
    })
    .then(html => {
      html = sanitizeEmailHtmlForBrowser(html);
      .then(html => {
    html = sanitizeEmailHtmlForBrowser(html);
  
    const doc = preview.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
  
    preview.onload = () => {
      const iframeDoc = preview.contentDocument;
      iframeDoc.body.contentEditable = true;
      iframeDoc.body.style.cursor = "text";
    };
  })


      preview.onload = () => {
        const doc = preview.contentDocument;
        doc.body.contentEditable = true;
        doc.body.style.cursor = "text";
      };
    })
    .catch(err => {
      console.error(err);
      alert("Error loading newsletter.");
    });
}

saveBtn.addEventListener("click", () => {
  try {
    const doc = preview.contentDocument;

    if (!doc || !doc.documentElement) {
      throw new Error("Preview document not ready");
    }

    let updatedHtml = doc.documentElement.outerHTML;

    if (!updatedHtml.toLowerCase().startsWith("<!doctype")) {
      updatedHtml = "<!DOCTYPE html>\n" + updatedHtml;
    }

    fetch("/api/zapier-submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fileId,
        html: updatedHtml
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("Submission failed");
      alert("Newsletter submitted successfully.");
    })
    .catch(err => {
      console.error(err);
      alert("Error saving newsletter.");
    });

  } catch (err) {
    console.error(err);
    alert("Error saving newsletter.");
  }
});

