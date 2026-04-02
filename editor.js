const preview = document.getElementById("preview");
const htmlEditor = document.getElementById("htmlEditor");
const saveBtn = document.getElementById("saveBtn");
const toggleViewBtn = document.getElementById("toggleViewBtn");

let isHtmlMode = false;

const params = new URLSearchParams(window.location.search);
const fileId = params.get("fileId");

function enableVisualEditing() {
  const doc = preview.contentDocument;

  if (doc?.body) {
    doc.body.contentEditable = true;
    doc.body.style.cursor = "text";
    doc.body.addEventListener("paste", e => {
      const clipboardItems = e.clipboardData?.items ?? [];
      const hasImage = Array.from(clipboardItems).some(item =>
        item.type.startsWith("image/")
      );

      if (hasImage) {
        e.preventDefault();
        alert(
          "Directly pasting images is disabled to prevent timeouts. Please use a hosted image URL instead."
        );
      }
    });
  }
}

preview.addEventListener("load", enableVisualEditing);

function sanitizeEmailHtmlForBrowser(html) {
  html = html.replace(
    /href="\[(https?:\/\/[^\]]+)\]\([^)]+\)"/g,
    'href="$1"'
  );

  html = html.replace(
    /<img\b[^>]*\bsrc\s*=\s*["']\s*["'][^>]*>/gi,
    ""
  );

  html = html.replace(
    /<img\b[^>]*\bsrc\s*=\s*["']cid:[^"']*["'][^>]*>/gi,
    ""
  );

  return html;
}

function setEditorMode(nextIsHtmlMode) {
  if (nextIsHtmlMode) {
    const currentHtml = preview.contentDocument?.documentElement?.outerHTML;

    if (currentHtml) {
      htmlEditor.value = currentHtml;
    }
  } else {
    preview.srcdoc = htmlEditor.value;
  }

  isHtmlMode = nextIsHtmlMode;
  preview.style.display = isHtmlMode ? "none" : "block";
  htmlEditor.style.display = isHtmlMode ? "block" : "none";
  toggleViewBtn.textContent = isHtmlMode
    ? "Switch to Visual View"
    : "Switch to HTML View";
}

if (!fileId) {
  alert("No fileId provided.");
} else {
  const githubRawUrl = `https://raw.githubusercontent.com/mfackrell/sfm-newsletter-editor/main/${fileId}.html`;

  fetch(githubRawUrl)
    .then(res => {
      if (!res.ok) {
        throw new Error("Failed to load HTML");
      }

      return res.text();
    })
    .then(html => {
      const sanitizedHtml = sanitizeEmailHtmlForBrowser(html);
      preview.srcdoc = sanitizedHtml;
      htmlEditor.value = sanitizedHtml;
    })
    .catch(err => {
      console.error(err);
      alert("Error loading newsletter.");
    });
}

toggleViewBtn.addEventListener("click", () => {
  setEditorMode(!isHtmlMode);
});

saveBtn.addEventListener("click", () => {
  try {
    let updatedHtml = htmlEditor.value;

    if (!isHtmlMode) {
      const doc = preview.contentDocument;

      if (!doc?.documentElement) {
        throw new Error("Preview document not ready");
      }

      updatedHtml = doc.documentElement.outerHTML;
    }

    if (!updatedHtml.toLowerCase().startsWith("<!doctype")) {
      updatedHtml = `<!DOCTYPE html>\n${updatedHtml}`;
    }

    if (updatedHtml.includes('src="data:image/')) {
      alert(
        "This newsletter contains embedded Base64 images that are too large to save. Please replace them with hosted image URLs."
      );
      return;
    }

    const updatedHtmlSizeKb = new Blob([updatedHtml]).size / 1024;
    console.log(
      `Newsletter HTML size: ${updatedHtmlSizeKb.toFixed(2)} KB`
    );

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
        if (!res.ok) {
          throw new Error("Submission failed");
        }

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
