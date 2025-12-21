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

        // Make ONLY text elements editable
        const editableSelectors = [
          "p",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "li",
          "span",
          "strong",
          "em",
          "a"
        ];

        editableSelectors.forEach(selector => {
          doc.querySelectorAll(selector).forEach(el => {
            el.setAttribute("contenteditable", "true");
            el.style.cursor = "text";
          });
        });
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
