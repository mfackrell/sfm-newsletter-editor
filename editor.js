const preview = document.getElementById("preview");
const htmlEditor = document.getElementById("htmlEditor");
const saveBtn = document.getElementById("saveBtn");
const toggleViewBtn = document.getElementById("toggleViewBtn");

let isHtmlMode = false;

const params = new URLSearchParams(window.location.search);
const fileId = params.get("fileId");


function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read pasted image"));

    reader.readAsDataURL(file);
  });
}

async function uploadImageToGithub(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const fileExt = (file.type && file.type.split("/")[1]) || "png";
  const filename = `pasted-${Date.now()}.${fileExt}`;

  const uploadRes = await fetch("/api/upload-to-github", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      imageBase64: dataUrl,
      filename
    })
  });

  const uploadJson = await uploadRes.json();

  if (!uploadRes.ok || !uploadJson?.download_url) {
    throw new Error(uploadJson?.error || "Image upload failed");
  }

  return uploadJson.download_url;
}

function enableVisualEditing() {
  const doc = preview.contentDocument;

  if (doc?.body) {
    doc.body.contentEditable = true;
    doc.body.style.cursor = "text";

    if (!doc.body.dataset.pasteHandlerAttached) {
      doc.body.dataset.pasteHandlerAttached = "true";

      doc.body.addEventListener("paste", async (event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type?.startsWith("image/"));

        if (!imageItem) {
          return;
        }

        event.preventDefault();

        try {
          const imageFile = imageItem.getAsFile();

          if (!imageFile) {
            throw new Error("Clipboard image unavailable");
          }

          const imageUrl = await uploadImageToGithub(imageFile);

          doc.execCommand(
            "insertHTML",
            false,
            `<img src="${imageUrl}" style="max-width:100%;">`
          );
        } catch (err) {
          console.error(err);
          alert("Error uploading pasted image.");
        }
      });
    }
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
    if (updatedHtml.toLowerCase().includes("data:image/")) {
      alert("Please wait for pasted images to finish uploading before saving.");
      return;
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
