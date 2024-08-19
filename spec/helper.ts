const PRE_CODE =
  "<pre style=\"display: grid; grid-template: 'container';\">" +
  '<code class="language-annotated-hexdump" style="grid-area: container; line-height: 1.2;">';
const POST_CODE = "</code></pre>";
/**
 * Wraps output with fixed pre and code tags
 * @param data Input html
 */
export const TOP_AND_TAIL = (data) => `${PRE_CODE}${data}${POST_CODE}`;

/**
 * Wraps output with fixed pre and code tags, with an overlay SVG
 * @param data Input html
 */
export const TOP_AND_TAIL_SVG = (data: string, svg: string) => {
  const lineCount = (data.match(/\n/g) || []).length + 1;
  const preSvg =
    '<code style="z-index:1; visibility: hidden; grid-area: container;">' +
    `<svg style="opacity: 0.3; visibility: visible; width: 100%; height: ${
      1.2 * lineCount
    }em;" xmlns="http://www.w3.oprg/2000/svg">`;

  return `${PRE_CODE}${data}</code>${preSvg}${svg}</svg>${POST_CODE}`;
};
