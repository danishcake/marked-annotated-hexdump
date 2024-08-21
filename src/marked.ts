import type { Tokens } from 'marked';
import { extractTokens, processTokens } from './common';
import escapeHtml from 'escape-html';

/**
 * Options for Marked plugin
 */
interface MarkedHexdumpConfig {
  /**
   * If set, errors in markdown are thrown. If not set, or false, errors are reported
   * in output instead.
   */
  strict?: boolean;
}

/**
 * Default options for the plugin
 */
const defaultConfig: MarkedHexdumpConfig = {
  strict: true,
};

export function annotatedHex(config: MarkedHexdumpConfig | undefined) {
  // Merge options
  config = { ...defaultConfig, ...(config || {}) };

  return {
    renderer: {
      code: (code: Tokens.Code | string, infostring: string | undefined) => {
        // More modern versions of markedjs use an object here
        /* istanbul ignore next */
        if (typeof code === 'object') {
          infostring = code.lang;
          code = code.text;
        }

        if (infostring !== 'annotated-hexdump') {
          /* istanbul ignore next */
          return false;
        }
        try {
          const tokens = extractTokens(code);
          return processTokens(tokens);
        } catch (error) {
          if (config?.strict === true) {
            throw error;
          }

          return '<pre><code class="language-annotated-hexdump">' + escapeHtml(code) + '\n\n' + error + '</code></pre>\n';
        }
      },
    },
  };
}
