const preview = document.getElementById("preview");
const saveBtn = document.getElementById("saveBtn");

const params = new URLSearchParams(window.location.search);
const fileId = params.get("fileId");

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
      preview.srcdoc = html;

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

    const updatedHtml = doc.documentElement.outerHTML;

    const body = new URLSearchParams();
    body.append("fileId", fileId);
    body.append("html", updatedHtml);

    // Fire-and-forget — no preflight, no CORS error
    fetch("https://hooks.zapier.com/hooks/catch/19867794/uaz4fae/", {
      method: "POST",
      body: body
    });

    alert("Newsletter submitted successfully.");

  } catch (err) {
    console.error(err);
    alert("Error saving newsletter.");
  }
});

