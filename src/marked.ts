import type { Tokens } from 'marked';
import {extractTokens, processTokens} from './common';

export function annotatedHex() {
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
  
          const tokens = extractTokens(code);
          return processTokens(tokens);
        },
      },
    };
  }
  