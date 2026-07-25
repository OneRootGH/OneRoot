(function () {
  const installButtons = Array.from(document.querySelectorAll("[data-install-app]"));
  let deferredPrompt = null;

  function toggleInstallButtons(show) {
    installButtons.forEach((button) => {
      button.hidden = !show;
    });
  }

  async function promptInstall() {
    if (!deferredPrompt) {
      window.location.href = "/operations/";
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    toggleInstallButtons(false);
  }

  installButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      void promptInstall();
    });
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    toggleInstallButtons(true);
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    toggleInstallButtons(false);
  });

  toggleInstallButtons(false);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    });
  }
})();
