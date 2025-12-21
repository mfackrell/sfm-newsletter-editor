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
      // Load HTML into iframe
      preview.srcdoc = html;

      // Wait for iframe to render
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
  const updatedHtml =
    preview.contentDocument.documentElement.outerHTML;

  console.log("UPDATED HTML:");
  console.log(updatedHtml);

  alert("Saved (console only for now)");
});
