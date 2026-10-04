document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || event.defaultPrevented) return;
  const path = new URL(form.action, window.location.href).pathname;
  if (form.method.toLowerCase() !== "post" || !path.startsWith("/app/") || !path.endsWith("/delete")) return;
  const reason = window.prompt("Why are you deleting this entry? Your reason will be saved in the Audit Trail.");
  if (!reason || !reason.trim() || reason.trim().length > 1000) {
    event.preventDefault();
    if (reason !== null) window.alert("Please enter a reason of up to 1,000 characters. The entry has not been deleted.");
    return;
  }
  let input = form.querySelector('input[name="deletion_reason"]');
  if (!input) {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = "deletion_reason";
    form.appendChild(input);
  }
  input.value = reason.trim();
});
