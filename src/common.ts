import { SparseByteArray } from './sparseByteArray';
import {
  BaseToken,
  DataToken,
  CommandToken,
  SetWidthCommand,
  SetAddressWidthCommand,
  SetCaseCommand,
  SetMissingCharacterCommand,
  HighlightCommand,
  SetBaseAddressCommand,
  NoteCommand,
  ITokenWithNote as ITokenWithText,
  DecodeCommand,
  SetDecodeGapCommand,
  SetDecodeControlCharacterCommand,
} from './inputTokens';
import { maxBigInt, minBigInt } from './bigint';
import cptable from 'codepage/dist/sbcs.full.js';
import escapeHtml from 'escape-html';

/**
 * Standard highlighting styles
 */
const STANDARD_STYLES: string[] = [
  'fill:#ff0000',
  'fill:#00ff00',
  'fill:#0000ff',
  'fill:#ffff00',
  'fill:#00ffff',
  'fill:#ff00ff',
  'fill:#ffffff',
  'fill:#000000',
  'fill:#ff7f7f',
  'fill:#7fff7f',
  'fill:#7f7fff',
  'fill:#FFFF7F',
  'fill:#FF7FFF',
  'fill:#7FFFFF',
  'fill:#7F7F7F',
  'fill:#bdb76b',
];

/**
 * Given the input code, extracts the tokens
 * @param code Input code, stripped of infostring
 * @returns An array of tokens to process
 */
export function extractTokens(code: string): BaseToken[] {
  // Now parse the input, build the hex output, and output the result
  const lines = code.split(/\r?\n/);
  const tokens: BaseToken[] = [];

  for (const line of lines) {
    // If line starts with #, ignore it
    // If line is blank, ignore it
    if (line.startsWith('#') || line === '') {
      continue;
    }

    // If it starts with numbers and consists of only numbers, store as an extent of data
    if (/^[0-9a-fA-F]/.test(line)) {
      tokens.push(new DataToken(line));
      continue;
    }

    // If it starts with /, store as a command
    if (line.startsWith('/')) {
      tokens.push(CommandToken.parseCommand(line));
      continue;
    }

    throw new Error(`Unexpected character: ${line}`);
  }

  return tokens;
}

/**
 * Extracted from the tokens, this represents how the hexdump will be rendered
 */
interface IProcessingConfiguration {
  lineWidth: number;
  addressWidth: number; // Units are bytes, not characters
  data: SparseByteArray;
  missingNo: string;
  decodeControlChar: string;
  upperCase: boolean;
  baseAddress: bigint;
  codePage: number | undefined;
  decodeGap: number;
  highlightTokens: HighlightCommand[];
  tokensWithText: ITokenWithText[];
}

/**
 * Processes the stream of tokens to extract configuration
 * @param tokens Sequence of tokens to process
 * @returns A ProcessingConfiguration
 */
function extractProcessingConfiguration(tokens: BaseToken[]): IProcessingConfiguration {
  const cfg: IProcessingConfiguration = {
    lineWidth: 16,
    addressWidth: 4,
    data: new SparseByteArray(),
    missingNo: ' ',
    decodeControlChar: '.',
    upperCase: true,
    baseAddress: BigInt(0),
    codePage: undefined,
    decodeGap: 1,
    highlightTokens: [],
    tokensWithText: [],
  };

  let offset = BigInt(0);

  // Action the tokens
  for (const token of tokens) {
    if (token instanceof SetWidthCommand) {
      cfg.lineWidth = token.width;
    }

    if (token instanceof SetAddressWidthCommand) {
      cfg.addressWidth = token.width;
    }

    if (token instanceof SetCaseCommand) {
      cfg.upperCase = token.upper;
    }

    if (token instanceof SetMissingCharacterCommand) {
      cfg.missingNo = token.missing;
    }

    if (token instanceof SetBaseAddressCommand) {
      cfg.baseAddress = token.baseAddress;
    }

    if (token instanceof DecodeCommand) {
      cfg.codePage = token.codepage;
    }

    if (token instanceof SetDecodeGapCommand) {
      cfg.decodeGap = token.gap;
    }

    if (token instanceof SetDecodeControlCharacterCommand) {
      cfg.decodeControlChar = token.control;
    }
  }

  for (const token of tokens) {
    if (token instanceof DataToken) {
      if (token.offset !== undefined) {
        offset = token.offset + cfg.baseAddress;
      }

      // Insert the actual data into the bytes array
      cfg.data.setBytes(offset, token.data);
      offset += BigInt(token.data.byteLength);
    }
  }

  // Detect if address width is too small
  if ((cfg.data.getEnd() - BigInt(1)).toString(16).length > cfg.addressWidth * 2) {
    throw new Error(`Data includes addresses too long for current /awidth of ${cfg.addressWidth}`);
  }

  // Detect no data
  if (cfg.data.getOrigin() - cfg.data.getEnd() === BigInt(0)) {
    throw new Error('No hex data provided');
  }

  cfg.highlightTokens = tokens.filter(
    (p) => p instanceof HighlightCommand,
  ) as HighlightCommand[];

  cfg.tokensWithText = tokens.filter(
    (p) => p instanceof NoteCommand || (p instanceof HighlightCommand && p.text !== undefined),
  ) as ITokenWithText[];

  return cfg;
}

/**
 * Translates an array of bytes (or undefined if missing) into a string, using the specified
 * code page. Control codes are replaced with decodeControlChar, and missing bytes are replaced with missingNo
 * @param codePage The codepage to use to translate the text. If undefined, an empty string is returned
 * @param missingNo Used to represent missing bytes
 * @param decodeControlChar Used to represent control codes
 * @param decodeGap The number of spaces to prefix the result with
 * @param cells The bytes forming a row of the hexdump
 * @returns A decoded string
 */
function decodeText(
  codePage: number | undefined,
  missingNo: string,
  decodeControlChar: string,
  decodeGap: number,
  cells: (number | null)[]): string {
  // If /codepage hasn't been called, skip the decoded text
  if (codePage === undefined) {
    return '';
  }

  return escapeHtml(' '.repeat(decodeGap) + cells
    .map(p => {
      if (p === null) {
        // Missing characters are changed to the missing character
        return missingNo;
      } else {
        // Otherwise use the codepage to translate, then replace any control characters
        const char = cptable[codePage].dec[p];
        const codepoint = char.codePointAt(0) ?? 0;
        // C0 control codes
        if (codepoint <= 0x1F || codepoint === 0x7F) {
          return decodeControlChar;
        }
        // C1 control codes
        if (codepoint >= 0x80 && codepoint <= 0x9F) {
          return decodeControlChar;
        }
        // We can safely ignore remaining unicode specific control codes,
        // as they should not occur in any code pages
        return char;
      }
    })
    .join(''));
}

/**
 * Processes the tokens, generating the output HTML
 * @param tokens Sequence of tokens to process
 * @returns HTML for the hexdump
 */
export function processTokens(tokens: BaseToken[]): string {
  const {
    lineWidth,
    addressWidth,
    data,
    missingNo,
    decodeControlChar,
    upperCase,
    baseAddress,
    codePage,
    decodeGap,
    highlightTokens,
    tokensWithText,
  } = extractProcessingConfiguration(tokens);

  // Determine the address of the first line
  let position = data.getOrigin();
  position = (position / BigInt(lineWidth)) * BigInt(lineWidth);

  // Build lines of data
  const highlightRects: string[] = [];
  const lines: string[] = [];
  let lastRowWasBlank = false;
  while (position < data.getEnd()) {
    const startPosition = position;
    const endPosition = startPosition + BigInt(lineWidth - 1);

    // Grab the row of bytes
    const cells: (number | null)[] = [];
    for (let column = 0; column < lineWidth; column++) {
      cells.push(data.getByte(position));
      position++;
    }

    if (cells.every((p) => p === null)) {
      // Row is entirely missing. We skip repeated instances of this
      if (!lastRowWasBlank) {
        const address = startPosition
          .toString(16)
          .padStart(addressWidth * 2, '0');
        const data = '...';
        lines.push(address + ' ' + data);
      }
      lastRowWasBlank = true;
    } else {
      const address = startPosition
        .toString(16)
        .padStart(addressWidth * 2, '0');
      const data = cells
        .map((p) => p?.toString(16).padStart(2, '0') ?? missingNo.repeat(2))
        .join(' ');
      const decoded = decodeText(codePage, missingNo, decodeControlChar, decodeGap, cells);

      // Normalise case for address and data
      const addressAndData = (() => {
        if (upperCase) {
          return (address + ' ' + data).toUpperCase();
        } else {
          return (address + ' ' + data).toLowerCase();
        }
      })();
      lines.push(addressAndData + decoded);
      lastRowWasBlank = false;

      // Now build the highlighted areas
      for (const tk of highlightTokens) {
        for (const range of tk.ranges) {
          // If this range encompasses elements in this row, add a new rect
          const lower = maxBigInt(range.start + baseAddress, startPosition);
          const upper = minBigInt(range.end + baseAddress, endPosition);

          // if there was some overlap, create the rectangle
          if (upper >= lower) {
            // Units are characters - ch in x and 1.2em in height
            const x0 = BigInt(addressWidth * 2 + 1) // The address component
            + (lower - startPosition) * BigInt(3); // The offset to the first highlighted byte
            const y0 = ((lines.length - 1) * 1.2).toFixed(1);
            const w = (upper - lower + BigInt(1)) * BigInt(3) - BigInt(1);
            const style = STANDARD_STYLES[tk.format];

            highlightRects.push(
              `<rect width="${w}ch" height="1.2em" x="${x0}ch" y="${y0}em" style="${style}"/>`,
            );

            // Apply same overlap to decoded text
            if (codePage !== undefined) {
              const dx0 = BigInt(addressWidth * 2 + 1) // The address component
              + BigInt(lineWidth * 3) + BigInt(decodeGap) - BigInt(1) // The data area
               + (lower - startPosition); // The offset to the first highlighted decoded text char
              const dw = upper - lower + BigInt(1);
              highlightRects.push(
                `<rect width="${dw}ch" height="1.2em" x="${dx0}ch" y="${y0}em" style="${style}"/>`,
              );
            }
          }
        }
      }
    }
  }

  // Add notes
  if (tokensWithText.length !== 0) {
    lines.push('');
  }

  for (const nk of tokensWithText) {
    lines.push(nk.text);
    const y0 = ((lines.length - 1) * 1.2).toFixed(1);
    const w = nk.text.length;
    const style = STANDARD_STYLES[nk.format];

    highlightRects.push(`<rect width="${w}ch" height="1.2em" x="0ch" y="${y0}em" style="${style}"/>`);
  }

  const svg = (() => {
    if (highlightRects.length === 0) {
      return '';
    }
    const svgHeight = (lines.length * 1.2).toFixed(1);
    // The SVG gets wrapped in an invisible code element so that it
    // inherits the correct fonts
    return (
      '<code class="language-annotated-hexdump-overlay" style="z-index:1; visibility: hidden; grid-area: container;">'
      + `<svg style="opacity: 0.3; visibility: visible; width: 100%; height: ${svgHeight}em;" xmlns="http://www.w3.oprg/2000/svg">`
      + highlightRects.join('')
      + '</svg></code>'
    );
  })();

  return `<pre style="display: grid; grid-template: 'container';"><code class="language-annotated-hexdump" style="grid-area: container; line-height: 1.2;">${lines.join('\n')}</code>${svg}</pre>`;
}
