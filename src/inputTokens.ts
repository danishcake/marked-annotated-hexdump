export class BaseToken {}

/** 
 * A token that contains bytes
 */
export class DataToken extends BaseToken {
  // The base address of the bytes
  offset?: number;
  // The bytes
  data: ArrayBuffer;

  constructor(line: string) {
    super();

    // Process the line. It must consist solely of whitespace and hex digits.
    // If the first characters encountered are three+ hex digits, this is the offset
    // After this, all whitespace can be ignored.
    // There must be an even number of hex digits after the offset
    // 000 00 00 00 00
    // 000 00000000

    // Attempt to read 3+ hex digits followed by a space
    // Failing that, the offset is unknown

    const offsetMatch = /^([0-9a-fA-F]{3,16})/.exec(line);
    if (offsetMatch != null) {
      this.offset = Number.parseInt(offsetMatch[1], 16);
      if (Number.isNaN(this.offset)) {
        throw new Error(`Unable to parse offset '${this.offset}'`);
      }
      // Trim the offset
      line = line.replace(/^([0-9a-fA-F]{3,16})/, "");
    }

    // Remove all whitespace
    line = line.replace(/ /g, "");

    // Assert length is divisible by 2
    if (line.length % 2 != 0) {
      throw new Error(`Uneven number of bytes found`);
    }

    // Extract as hex digits
    this.data = new ArrayBuffer(line.length / 2);
    const view = new Uint8Array(this.data);

    for (let i = 0; i < line.length; i += 2) {
      const byte = Number.parseInt(line.substring(i, i + 2), 16);
      if (Number.isNaN(byte)) {
        throw new Error(`Unable to parse byte '${i / 2}'`);
      }
      view[i / 2] = byte;
    }
  }
}

/**
 * A token that contains formatting commands
 */
export class CommandToken extends BaseToken {
  command: string;
  arguments?: string;

  constructor(line: string) {
    super();

    throw new Error('Unrecognised command');
  }
}