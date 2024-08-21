import type MarkdownIt from 'markdown-it';
import { extractTokens, processTokens } from './common';

/**
 * Options for MarkdownIt plugin
 */
interface MarkdownItHexdumpConfig {
  /**
   * If set, errors in markdown are thrown. If not set, or false, errors are reported
   * in output instead.
   */
  strict?: boolean;
}

/**
 * Default options for the plugin
 */
const defaultConfig: MarkdownItHexdumpConfig = {
  strict: true,
};

/**
 * Given an initialised MarkdownIt instance, extends the highlighting support
 * with annotated hexdumps.
 *
 * This preserves existing highlighting, and delegates to it if it's not an annotated-hexdump
 * @param md Existing MarkdownIt instance. This is modified in place
 * @return The modified MarkdownIt instance
 */
export function extendMarkdownIt(
  md: MarkdownIt,
  config: MarkdownItHexdumpConfig | undefined,
) {
  // Merge options
  config = { ...defaultConfig, ...(config || {}) };

  // Save existing highlight. This may be undefined, but is most likely to
  // be highlight.js
  const extantHighlight = md.options.highlight;

  // Add ourselves as the highlight handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  md.options.highlight = (code: string, lang: string, attrs: any) => {
    if (lang && lang === 'annotated-hexdump') {
      try {
        const tokens = extractTokens(code);
        return processTokens(tokens);
      } catch (error) {
        if (config?.strict === true) {
          throw error;
        }

        return md.utils.escapeHtml(code) + '\n' + error;
      }
    }

    // If it's not an annotated hexdump then pass through to previous handler
    return extantHighlight?.(code, lang, attrs) ?? code;
  };
  return md;
}

/**
 * A plugin for MarkdownIt adding support for annotated hexdumps
 * @returns A 'use'able plugin for MarkdownIt
 */
export function annotatedHex(
  md: MarkdownIt,
  config: MarkdownItHexdumpConfig | undefined,
): void {
  // Merge options
  config = { ...defaultConfig, ...(config || {}) };

  // Add ourselves as the highlight handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  md.options.highlight = (code: string, lang: string, attrs: any) => {
    if (lang && lang === 'annotated-hexdump') {
      try {
        const tokens = extractTokens(code);
        return processTokens(tokens);
      } catch (error) {
        if (config?.strict === true) {
          throw error;
        }

        return md.utils.escapeHtml(code) + '\n' + error;
      }
    }

    return '';
  };
}
