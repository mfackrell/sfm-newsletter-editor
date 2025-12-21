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

saveBtn.addEventListener("click", async () => {
  const updatedHtml =
    preview.contentDocument.documentElement.outerHTML;

  const formData = new FormData();
  formData.append("fileId", fileId);
  formData.append("html", updatedHtml);

  try {
    await fetch(
      "https://hooks.zapier.com/hooks/catch/19867794/uaz4fae/",
      {
        method: "POST",
        body: formData,
        mode: "no-cors"
      }
    );

    // If we got here, Zapier received it
    alert("Newsletter saved successfully.");
  } catch (err) {
    console.error(err);
    alert("Error saving newsletter.");
  }
});

