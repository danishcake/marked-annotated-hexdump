import { Tokens } from "marked";
import { SparseByteArray } from "./sparseByteArray";
import {
  BaseToken,
  DataToken,
  CommandToken,
  SetWidthCommand,
  SetAddressWidthCommand,
  SetCaseCommand,
  SetMissingCharacterCommand,
  HighlightCommand,
} from "./inputTokens";

/**
 * Standard highlighting styles
 */
const STANDARD_STYLES: string[] = [
  "fill:#ff0000;fill-opacity:0.3;",
  "fill:#00ff00;fill-opacity:0.3;",
  "fill:#0000ff;fill-opacity:0.3;",
  "fill:#ffff00;fill-opacity:0.3;",
  "fill:#00ffff;fill-opacity:0.3;",
  "fill:#ff00ff;fill-opacity:0.3;",
  "fill:#ffffff;fill-opacity:0.3;",
  "fill:#000000;fill-opacity:0.3;",
  "fill:#ff7f7f;fill-opacity:0.4;",
  "fill:#7fff7f;fill-opacity:0.4;",
  "fill:#7f7fff;fill-opacity:0.4;",
  "fill:#FFFF7F;fill-opacity:0.4;",
  "fill:#FF7FFF;fill-opacity:0.4;",
  "fill:#7FFFFF;fill-opacity:0.4;",
  "fill:#7F7F7F;fill-opacity:0.4;",
  "fill:#bdb76b;fill-opacity:0.4;",
];

/**
 * Given the input code, extracts the tokens
 * @param code Input code, stripped of infostring
 * @returns An array of tokens to process
 */
function extractTokens(code: string): BaseToken[] {
  // Now parse the input, build the hex output, and output the result
  const lines = code.split(/\r?\n/);
  const tokens: BaseToken[] = [];

  for (const line of lines) {
    // If line starts with #, ignore it
    // If line is blank, ignore it
    if (line.startsWith("#") || line === "") {
      continue;
    }

    // If it starts with numbers and consists of only numbers, store as an extent of data
    if (/^[0-9]/.test(line)) {
      tokens.push(new DataToken(line));
      continue;
    }

    // If it starts with /, store as a command
    if (line.startsWith("/")) {
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
function processTokens(tokens: BaseToken[]): string {
  let lineWidth = 16;
  let addressWidth = 4; // Units are bytes, not characters
  let offset = 0;
  let data = new SparseByteArray();
  let missingNo = "  ";
  let upperCase = true;

  // Action the configuration tokens
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
      missingNo = `${token.missing}${token.missing}`;
    }
  }

  // Extract the DataTokens
  for (const token of tokens) {
    if (token instanceof DataToken) {
      if (token.offset !== undefined) {
        offset = token.offset;
      }

      // Insert the actual data into the bytes array
      data.setBytes(offset, token.data);
      offset += token.data.byteLength;
    }
  }

  const highlightTokens: HighlightCommand[] = tokens.filter(
    (p) => p instanceof HighlightCommand
  ) as HighlightCommand[];

  // Determine the address of the first line
  let position = data.getOrigin();
  position = Math.floor(position / lineWidth) * lineWidth;

  // Build lines of data
  const highlightRects: string[] = [];
  const lines: string[] = [];
  let lastRowWasBlank = false;
  while (position < data.getEnd()) {
    const startPosition = position;
    const endPosition = startPosition + lineWidth - 1;
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
          .padStart(addressWidth * 2, "0");
        const data = "...";
        lines.push(address + " " + data);
      }
      lastRowWasBlank = true;
    } else {
      const address = startPosition
        .toString(16)
        .padStart(addressWidth * 2, "0");
      const data = cells
        .map((p) => p?.toString(16).padStart(2, "0") ?? missingNo)
        .join(" ");
      lines.push(address + " " + data);
      lastRowWasBlank = false;

      // Now build the highlighted areas
      for (const tk of highlightTokens) {
        for (const range of tk.ranges) {
          // If this range encompasses elements in this row, add a new rect
          const lower = Math.max(range.start, startPosition);
          const upper = Math.min(range.end, endPosition);

          // if there was some overlap, create the rectangle
          if (upper >= lower) {
            // Units are characters - ch in x and 1.2em in height
            const x0 = addressWidth * 2 + 1 + lower * 3;
            const y0 = lines.length - 1;
            const w = (upper - lower + 1) * 3 - 1;

            // Determine the style
            const style: string = (() => {
              if (typeof tk.format === "number") {
                return STANDARD_STYLES[tk.format];
              } else {
                return tk.format;
              }
            })();

            highlightRects.push(
              `<rect width="${w}ch" height="1.2em" x="${x0}ch" y="calc(1.2em * ${y0})" style="${style}"/>`
            );
          }
        }
      }
    }
  }

  const svg = (() => {
    if (highlightRects.length === 0) {
      return "";
    }
    return (
      '<svg style="position: absolute; z-index:1;" width="100%" height="100%" top="0" left="0" xmlns="http://www.w3.oprg/2000/svg">' +
      highlightRects.join("") +
      "</svg>"
    );
  })();

  return `<pre><code class="language-annotated-hexdump">${svg}${lines
    .map((p) => (upperCase ? p.toUpperCase() : p.toLowerCase()))
    .join("\n")}</code></pre>`;
}

export default function () {
  return {
    renderer: {
      code: (code: Tokens.Code | string, infostring: string | undefined) => {
        // More modern versions of markedjs use an object here
        /* istanbul ignore next */
        if (typeof code === "object") {
          infostring = code.lang;
          code = code.text;
        }

        if (infostring !== "annotated-hexdump") {
          /* istanbul ignore next */
          return false;
        }

        const tokens = extractTokens(code);
        return processTokens(tokens);
      },
    },
  };
}
