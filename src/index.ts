import { Tokens } from "marked";
import { SparseByteArray } from "./sparseByteArray";
import { BaseToken, DataToken, CommandToken } from "./inputTokens";

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

  // Determine the address of the first line
  let position = data.getOrigin();
  position = Math.floor(position / lineWidth) * lineWidth;

  // Build lines of data
  const lines: string[] = [];
  let lastRowWasBlank = false;
  while (position < data.getEnd()) {
    const startPosition = position;
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
    }
  }

  return `<pre><code class="language-annotated-hexdump">${lines
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
