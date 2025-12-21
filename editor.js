const editor = document.getElementById("editor");
const saveBtn = document.getElementById("saveBtn");

// Load HTML from query param (?html=...)
const params = new URLSearchParams(window.location.search);
const html = params.get("html");

if (html) {
  editor.value = decodeURIComponent(html);
}

// TEMP: log instead of sending
saveBtn.addEventListener("click", () => {
  const updatedHtml = editor.value;

  console.log("UPDATED HTML:");
  console.log(updatedHtml);

  alert("Saved (console only for now)");
});
