import { urlsToRegex, parseUrlsCsv } from "./lib/index.js";

const form = document.querySelector("#generator");
const input = document.querySelector("#urls");
const result = document.querySelector("#result");
const status = document.querySelector("#status");
const copy = document.querySelector("#copy");
const csv = document.querySelector("#csv");
const paths = document.querySelector("#paths");
let revision = 0;
function message(text, error = false) {
  status.textContent = text;
  status.dataset.error = String(error);
}
function clearResult() {
  revision++;
  result.value = "";
  copy.disabled = true;
  copy.textContent = "Copy pattern";
  message("Ready when you are.");
}
input.addEventListener("input", clearResult);
paths.addEventListener("change", clearResult);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearResult();
  try {
    const values = input.value.split(/\r\n|\r|\n/).filter(line => line.trim());
    result.value = urlsToRegex(values, { target: paths.checked ? "path" : "input" });
    copy.disabled = false;
    message(`${values.length} inputs → ${result.value.length} characters. Ready to copy.`);
  } catch (error) {
    message(error.message, true);
  }
});
csv.addEventListener("change", async () => {
  const file = csv.files?.[0];
  if (!file) return;
  clearResult();
  const current = revision;
  try {
    const values = parseUrlsCsv(await file.text());
    if (current !== revision) return;
    if (values.some(value => /[\r\n]/.test(value))) {
      throw new Error("CSV URLs must each fit on one line.");
    }
    input.value = values.join("\n");
    message(`Imported ${values.length} URLs or paths. Select Generate regex.`);
  } catch (error) {
    if (current === revision) message(error.message, true);
  } finally {
    csv.value = "";
  }
});
copy.addEventListener("click", async () => {
  if (!result.value) return;
  try {
    await navigator.clipboard.writeText(result.value);
    message("Pattern copied to clipboard.");
  } catch {
    result.focus();
    result.select();
    message("Select the pattern and copy it with Ctrl+C or ⌘C.");
  }
});
