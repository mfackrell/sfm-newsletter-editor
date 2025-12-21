const editor = document.getElementById("editor");
const saveBtn = document.getElementById("saveBtn");

// Read fileId from URL (?fileId=...)
const params = new URLSearchParams(window.location.search);
const fileId = params.get("fileId");

if (!fileId) {
  editor.value = "No fileId provided in URL.";
} else {
  const githubRawUrl = `https://raw.githubusercontent.com/mfackrell/sfm-newsletter-editor/main/${fileId}.html`;

  fetch(githubRawUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to load HTML from GitHub");
      }
      return response.text();
    })
    .then(html => {
      editor.value = html;
    })
    .catch(error => {
      console.error(error);
      editor.value = "Error loading newsletter HTML.";
    });
}

// TEMP: log instead of sending
saveBtn.addEventListener("click", () => {
  const updatedHtml = editor.value;

  console.log("UPDATED HTML:");
  console.log(updatedHtml);

  alert("Saved (console only for now)");
});
