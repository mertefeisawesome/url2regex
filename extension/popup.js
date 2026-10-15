import { urlsToRegex } from "./lib/index.js";

const form = document.querySelector("#generator");
const result = document.querySelector("#result");
const status = document.querySelector("#status");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  result.value = "";
  try {
    const values = document.querySelector("#urls").value.split(/\r?\n/).filter(line => line.trim());
    result.value = urlsToRegex(values, {
      target: document.querySelector("#paths").checked ? "path" : "input",
    });
    status.textContent = `Generated ${result.value.length} characters.`;
  } catch (error) {
    status.textContent = error.message;
  }
});
