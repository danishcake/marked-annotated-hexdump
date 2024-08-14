import { annotatedHex } from "../lib/index.cjs";
import { marked } from "../node_modules/marked/lib/marked.cjs";

marked.use(annotatedHex());

/**
 * Formats the markdown in the input element
 * and writes the output to the output element
 */
export function formatMarkdown() {
  const inputElement = document.getElementById("input");
  const outputElement = document.getElementById("output");

  try {
    outputElement.innerHTML = marked.parse(inputElement.value);
  } catch (error) {
    outputElement.innerHTML = error;
  }
}
