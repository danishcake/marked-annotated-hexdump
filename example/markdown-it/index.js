import { extendMarkdownIt } from '../../lib/markdown-it.cjs';
import markdownIt from '../../node_modules/markdown-it/dist/markdown-it'

const md = markdownIt()
extendMarkdownIt(md);


/**
 * Formats the markdown in the input element
 * and writes the output to the output element
 */
export function formatMarkdown() {
  const inputElement = document.getElementById('input');
  const outputElement = document.getElementById('output');
  const errorElement = document.getElementById('error');

  try {
    outputElement.innerHTML = md.render(inputElement.value);
    outputElement.classList.remove('output-with-error');
    errorElement.innerHTML = 'OK';
  } catch (error) {
    errorElement.innerHTML = error;
    outputElement.classList.add('output-with-error');
  }
}
