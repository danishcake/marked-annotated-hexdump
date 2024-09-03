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
 * Processes the tokens, generating the output HTML
 * @param tokens Sequence of tokens to process
 * @returns HTML for the hexdump
 */
export function processTokens(tokens: BaseToken[]): string {
  let lineWidth = 16;
  let addressWidth = 4; // Units are bytes, not characters
  let offset = BigInt(0);
  const data = new SparseByteArray();
  let missingNo = ' ';
  let decodeControlChar = '.';
  let upperCase = true;
  let baseAddress = BigInt(0);
  let codePage: number | undefined;
  let decodeGap = 1;

  // Action the tokens
  for (const token of tokens) {
    if (token instanceof SetWidthCommand) {
      lineWidth = token.width;
    }

    if (token instanceof SetAddressWidthCommand) {
      addressWidth = token.width;
    }

    if (token instanceof SetCaseCommand) {
      upperCase = token.upper;
    }

    if (token instanceof SetMissingCharacterCommand) {
      missingNo = token.missing;
    }

    if (token instanceof SetBaseAddressCommand) {
      baseAddress = token.baseAddress;
    }

    if (token instanceof DecodeCommand) {
      codePage = token.codepage;
    }

    if (token instanceof SetDecodeGapCommand) {
      decodeGap = token.gap;
    }

    if (token instanceof SetDecodeControlCharacterCommand) {
      decodeControlChar = token.control;
    }
  }

  for (const token of tokens) {
    if (token instanceof DataToken) {
      if (token.offset !== undefined) {
        offset = token.offset + baseAddress;
      }

      // Insert the actual data into the bytes array
      data.setBytes(offset, token.data);
      offset += BigInt(token.data.byteLength);
    }
  }

  // Detect if address width is too small
  if ((data.getEnd() - BigInt(1)).toString(16).length > addressWidth * 2) {
    throw new Error(`Data includes addresses too long for current /awidth of ${addressWidth}`);
  }

  // Detect no data
  if (data.getOrigin() - data.getEnd() === BigInt(0)) {
    throw new Error('No hex data provided');
  }

  const highlightTokens: HighlightCommand[] = tokens.filter(
    (p) => p instanceof HighlightCommand,
  ) as HighlightCommand[];

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

      const decoded = (() => {
        // If /codepage hasn't been called, skip the decoded text
        if (codePage === undefined) {
          return '';
        }

        return ' '.repeat(decodeGap) + cells
          .map(p => {
            if (p === null) {
              // Missing characters are changed to the missing character
              return missingNo;
            } else if (p <= 31 || p === 127) {
              // Control characters are mapped to the control character substitution
              return decodeControlChar;
            } else {
              // Otherwise use the codepage to translate
              return cptable[codePage].dec[p];
            }
          })
          .join('');
      })();

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
  const tokensWithText: ITokenWithText[] = tokens.filter(
    (p) => p instanceof NoteCommand || (p instanceof HighlightCommand && p.text !== undefined),
  ) as ITokenWithText[];

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
      '<code style="z-index:1; visibility: hidden; grid-area: container;">'
      + `<svg style="opacity: 0.3; visibility: visible; width: 100%; height: ${svgHeight}em;" xmlns="http://www.w3.oprg/2000/svg">`
      + highlightRects.join('')
      + '</svg></code>'
    );
  })();

  return `<pre style="display: grid; grid-template: 'container';"><code class="language-annotated-hexdump" style="grid-area: container; line-height: 1.2;">${lines.join('\n')}</code>${svg}</pre>`;
}
