const PRE_CODE =
  "<pre style=\"display: grid; grid-template: 'container';\">"
  + '<code class="language-annotated-hexdump" style="grid-area: container; line-height: 1.2;">';
const POST_CODE = '</code></pre>';
const PRE_SVG =
  '<code style="z-index:1; visibility: hidden; grid-area: container;"><svg style="opacity: 0.3; visibility: visible; width: 100%; height: 100%;" xmlns="http://www.w3.oprg/2000/svg">';

/**
 * Wraps output with fixed pre and code tags
 * @param data Input html
 */
export const TOP_AND_TAIL = (data) => `${PRE_CODE}${data}${POST_CODE}`;

/**
 * Wraps output with fixed pre and code tags, with an overlay SVG
 * @param data Input html
 */
export const TOP_AND_TAIL_SVG = (data, svg) =>
  `${PRE_CODE}${data}</code>${PRE_SVG}${svg}</svg>${POST_CODE}`;