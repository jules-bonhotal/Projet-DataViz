const sidebar = document.querySelector(".sidebar-menu");
const toggleButton = document.getElementById("toggle-sidebar");
const closeButton = document.getElementById("close-sidebar");

const main = document.getElementById("main-content");
main.addEventListener("click", () => {
  if (!sidebar.classList.contains("collapsed")) {
    sidebar.classList.toggle("collapsed");
  }
});

toggleButton.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});
