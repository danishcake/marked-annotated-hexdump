import type MarkdownIt from 'markdown-it';
import { extractTokens, processTokens } from './common';

/**
 * Given an initialised MarkdownIt instance, extends the highlighting support
 * with annotated hexdumps
 * @param md Existing MarkdownIt instance. This is modified in place
 * @return The modified MarkdownIt instance
 */
export function extendMarkdownIt(md: MarkdownIt) {
  // Save existing highlight. This may be undefined, but is most likely to
  // be highlight.js
  const extantHighlight = md.options.highlight;

  // Add ourselves as the highlight handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  md.options.highlight = (code: string, lang: string, attrs: any) => {
    if (lang && lang === 'annotated-hexdump') {
      const tokens = extractTokens(code);
      return processTokens(tokens);
    }

    // If it's not an annotated hexdump then pass through to previous handler
    return extantHighlight?.(code, lang, attrs) ?? code;
  };
  return md;
}
