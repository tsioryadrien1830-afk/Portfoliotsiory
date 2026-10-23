/**
 * Snackbar Frontend JavaScript
 * Handles auto-close functionality and interactions
 */

document.addEventListener("DOMContentLoaded", function () {
  // Find all snackbar containers
  const snackbars = document.querySelectorAll(".aibui-snackbar-container");

  snackbars.forEach((snackbar) => {
    const globalAutoClose =
      snackbar.getAttribute("data-global-auto-close") === "1";
    const globalCloseDelay =
      parseInt(snackbar.getAttribute("data-global-close-delay")) || 5000;
    const buttonsData = JSON.parse(
      snackbar.getAttribute("data-buttons") || "[]"
    );
    const actionButtons = snackbar.querySelectorAll(
      ".aibui-snackbar-action-btn"
    );

    // Add click event listeners to action buttons
    actionButtons.forEach((button, index) => {
      button.addEventListener("click", function (e) {
        const buttonData = buttonsData[index];
        if (buttonData && buttonData.autoClose !== false) {
          // Close immediately when button is clicked
          closeSnackbar(snackbar);
        }
      });
    });

    // Add global auto-hide if enabled
    if (globalAutoClose && globalCloseDelay > 0) {
      setTimeout(() => {
        if (snackbar.style.display !== "none") {
          closeSnackbar(snackbar);
        }
      }, globalCloseDelay);
    }
  });

  function closeSnackbar(snackbar) {
    // Add closing animation class
    snackbar.classList.add("aibui-snackbar-closing");

    // Hide after animation completes
    setTimeout(() => {
      snackbar.style.display = "none";
      snackbar.classList.remove("aibui-snackbar-closing");
    }, 300);
  }

  // Add click outside to close functionality
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".aibui-snackbar-container")) {
      snackbars.forEach((snackbar) => {
        const globalAutoClose =
          snackbar.getAttribute("data-global-auto-close") === "1";
        const globalCloseDelay =
          parseInt(snackbar.getAttribute("data-global-close-delay")) || 5000;
        // Only close on outside click if auto-hide is enabled AND delay is greater than 0
        if (
          globalAutoClose &&
          globalCloseDelay > 0 &&
          snackbar.style.display !== "none"
        ) {
          closeSnackbar(snackbar);
        }
      });
    }
  });
});
