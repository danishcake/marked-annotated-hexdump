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
export abstract class CommandToken extends BaseToken {
  constructor() {
    super();
  }

  /**
   * Extracts the correct command from the input line
   * @param line Line known to contain a command
   * @returns The correct CommandToken subclass, or throws an Error
   */
  static parseCommand(line: string): CommandToken {
    if (line.startsWith("/width")) {
      return new SetWidthCommand(line);
    }
    if (line.startsWith("/awidth")) {
      return new SetAddressWidthCommand(line);
    }
    if (line.startsWith("/case")) {
      return new SetCaseCommand(line);
    }
    if (line.startsWith("/missing")) {
      return new SetMissingCharacterCommand(line);
    }
    if (line.startsWith("/highlight")) {
      return new HighlightCommand(line);
    }

    throw new Error("Unrecognised command");
  }
}

/**
 * Represents the /width command
 */
export class SetWidthCommand extends CommandToken {
  width: number;

  constructor(line: string) {
    super();

    const match = /^\/width +([0-9]+)$/.exec(line);
    if (!match) {
      throw new Error(`Error parsing command '${line}'`);
    }

    this.width = Number.parseInt(match[1]);
    if (Number.isNaN(this.width)) {
      throw new Error(`Error parsing width '${match[1]}'`);
    }
    if (this.width < 2 || this.width > 32) {
      throw new Error(`Width must be in range 2-32, found '${this.width}'`);
    }
  }
}

/**
 * Represents the /awidth command
 */
export class SetAddressWidthCommand extends CommandToken {
  width: number;

  constructor(line: string) {
    super();

    const match = /^\/awidth +([0-9]+)$/.exec(line);
    if (!match) {
      throw new Error(`Error parsing command '${line}'`);
    }

    this.width = Number.parseInt(match[1]);
    if (Number.isNaN(this.width)) {
      throw new Error(`Error parsing width '${match[1]}'`);
    }
    if (this.width < 2 || this.width > 8) {
      throw new Error(
        `Address width must be in range 2-8, found '${this.width}'`
      );
    }
  }
}

/**
 * Represents the /case command
 */
export class SetCaseCommand extends CommandToken {
  upper: boolean;

  constructor(line: string) {
    super();

    const match = /^\/case +(upper|lower)$/.exec(line);
    if (!match) {
      throw new Error(`Error parsing command '${line}'`);
    }

    this.upper = match[1] === "upper";
  }
}

/**
 * Represents the /missing command
 */
export class SetMissingCharacterCommand extends CommandToken {
  missing: string;

  constructor(line: string) {
    super();

    const match = /^\/missing +(.)$/.exec(line);
    if (!match) {
      throw new Error(`Error parsing command '${line}'`);
    }

    this.missing = match[1];
  }
}

/**
 * Represents the /highlight command
 */
export class HighlightCommand extends CommandToken {
  ranges: { start: number; end: number }[];
  format: string | number;

  constructor(line: string) {
    super();

    const match = /^\/highlight +\[([0-9a-fA-F:,]+)\] +(.+)$/.exec(line);
    if (!match) {
      throw new Error(`Error parsing command '${line}'`);
    }

    const format = match[2].trim();

    // Reject pure whitespace format
    if (format.length == 0) {
      throw new Error(`Missing or blank format in '${line}'`);
    }

    // Extract /1 to /16 styles
    if (format.startsWith("/")) {
      const formatIndex = Number.parseInt(format.slice(1));
      if (Number.isNaN(formatIndex)) {
        throw new Error(`Format starting with / was not a number in '${line}'`);
      }
      if (formatIndex < 0 || formatIndex > 15) {
        throw new Error(
          `Format index '${formatIndex}' outside valid range 0-15 in line '${line}'`
        );
      }
      this.format = formatIndex;
    } else {
      // If it doesn't start with a forward slash, store verbatim
      this.format = match[2].trim();
    }

    // Now parse the ranges. These will be expressed as a series ranges, separated with commas
    this.ranges = [];
    const ranges = match[1].split(",");
    for (const range of ranges) {
      const match = /^([0-9a-fA-F]+)(:([0-9a-fA-F]+))?$/.exec(range);
      if (!match) {
        throw new Error(`Error parsing range '${range}' in line '${line}'`);
      }

      // Extract the start/end of the range. You can specify a single byte
      // without the :end part, so detect that and reuse the start offset
      const start = Number.parseInt(match[1], 16);
      const end = (() => {
        if (match.length == 4) {
          return Number.parseInt(match[3], 16);
        } else {
          return start;
        }
      })();

      // Handle parsing errors, which we expect to be impossible
      if (Number.isNaN(start) || Number.isNaN(end)) {
        throw new Error(`Error parsing range '${range}' in line '${line}'`);
      }

      // Handle negative length ranges
      if (start > end) {
        throw new Error(`Invalid range '${range}' in line '${line}'`);
      }

      this.ranges.push({ start, end });
    }
  }
}
