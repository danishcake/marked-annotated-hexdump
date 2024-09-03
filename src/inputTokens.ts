import { parseBigIntHex } from './bigint';
import cptable from 'codepage/dist/sbcs.full.js';

export class BaseToken {}

/**
 * A token that contains bytes
 */
export class DataToken extends BaseToken {
  // The base address of the bytes
  readonly offset?: bigint;
  // The bytes
  readonly data: ArrayBuffer;

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
      this.offset = parseBigIntHex(offsetMatch[1]);
      // Trim the offset
      line = line.replace(/^([0-9a-fA-F]{3,16})/, '');
    }

    // Remove all whitespace
    line = line.replace(/ /g, '');

    // Assert length is divisible by 2
    if (line.length % 2 !== 0) {
      throw new Error('Uneven number of bytes found');
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
  /**
   * Extracts the correct command from the input line
   * @param line Line known to contain a command
   * @returns The correct CommandToken subclass, or throws an Error
   */
  static parseCommand(line: string): CommandToken {
    if (line.startsWith('/width')) {
      return new SetWidthCommand(line);
    }
    if (line.startsWith('/awidth')) {
      return new SetAddressWidthCommand(line);
    }
    if (line.startsWith('/case')) {
      return new SetCaseCommand(line);
    }
    if (line.startsWith('/missing')) {
      return new SetMissingCharacterCommand(line);
    }
    if (line.startsWith('/highlight')) {
      return new HighlightCommand(line);
    }
    if (line.startsWith('/baseaddress')) {
      return new SetBaseAddressCommand(line);
    }
    if (line.startsWith('/note')) {
      return new NoteCommand(line);
    }
    if (line.startsWith('/decode_gap')) {
      return new SetDecodeGapCommand(line);
    }
    if (line.startsWith('/decode_control')) {
      return new SetDecodeControlCharacterCommand(line);
    }
    if (line.startsWith('/decode')) {
      return new DecodeCommand(line);
    }

    throw new Error('Unrecognised command');
  }
}

/**
 * Represents the /width command
 */
export class SetWidthCommand extends CommandToken {
  readonly width: number;

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
  readonly width: number;

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
        `Address width must be in range 2-8, found '${this.width}'`,
      );
    }
  }
}

/**
 * Represents the /case command
 */
export class SetCaseCommand extends CommandToken {
  readonly upper: boolean;

  constructor(line: string) {
    super();

    const match = /^\/case +(upper|lower)$/.exec(line);
    if (!match) {
      throw new Error(`Error parsing command '${line}'`);
    }

    this.upper = match[1] === 'upper';
  }
}

/**
 * Represents the /missing command
 */
export class SetMissingCharacterCommand extends CommandToken {
  readonly missing: string;

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
  readonly ranges: { start: bigint; end: bigint }[];
  readonly format: number;
  readonly text: string | undefined;

  constructor(line: string) {
    super();

    const match = /^\/highlight +\[([0-9a-fA-F:,]+)\] +\/([0-9]+) ?(.+)?$/.exec(line);
    if (!match) {
      throw new Error(`Error parsing command '${line}'`);
    }

    const format = match[2].trim();

    // Reject pure whitespace format
    if (format.length === 0) {
      throw new Error(`Missing or blank format in '${line}'`);
    }

    // Extract /0 to /15 styles
    const formatIndex = Number.parseInt(format);
    if (Number.isNaN(formatIndex)) {
      throw new Error(`Format starting with / was not a number in '${line}'`);
    }
    if (formatIndex < 0 || formatIndex > 15) {
      throw new Error(
        `Format index '${formatIndex}' outside valid range 0-15 in line '${line}'`,
      );
    }
    this.format = formatIndex;

    // Extract the optional text
    // Pure whitespace is ignored
    this.text = match[3]?.trim() ?? undefined;
    if (this.text?.length === 0) {
      this.text = undefined;
    }

    // Now parse the ranges. These will be expressed as a series ranges, separated with commas
    this.ranges = [];
    const ranges = match[1].split(',');
    for (const range of ranges) {
      const match = /^([0-9a-fA-F]+)(:([0-9a-fA-F]+))?$/.exec(range);
      if (!match) {
        throw new Error(`Error parsing range '${range}' in line '${line}'`);
      }

      // Extract the start/end of the range. You can specify a single byte
      // without the :end part, so detect that and reuse the start offset
      const start = parseBigIntHex(match[1]);
      const end = (() => {
        if (match[3] !== undefined) {
          return parseBigIntHex(match[3]);
        } else {
          return start;
        }
      })();

      // Handle negative length ranges
      if (start > end) {
        throw new Error(`Invalid range '${range}' in line '${line}'`);
      }

      this.ranges.push({ start, end });
    }
  }
}

/**
 * Represents the /baseaddress command
 */
export class SetBaseAddressCommand extends CommandToken {
  readonly baseAddress: bigint;

  constructor(line: string) {
    super();

    const match = /^\/baseaddress +([0-9a-fA-F]+)$/.exec(line);
    if (!match) {
      throw new Error(`Error parsing command '${line}'`);
    }

    this.baseAddress = parseBigIntHex(match[1]);
    if (this.baseAddress < BigInt(0) || this.baseAddress > BigInt('0xFFFFFFFFFFFFFFFF')) {
      throw new Error(
        `Base address must be in range 0-2^64-1", found '${this.baseAddress}'`,
      );
    }
  }
}

/**
 * Represents the /note command
 */
export class NoteCommand extends CommandToken {
  readonly format: number;
  readonly text: string;

  constructor(line: string) {
    super();

    const match = /^\/note +\/([0-9]+) +(.+)$/.exec(line);
    if (!match) {
      throw new Error(`Error parsing command '${line}'`);
    }

    this.format = Number.parseInt(match[1]);
    if (this.format < 0 || this.format > 15) {
      throw new Error(
        `Note format must be in range 0-15, found '${this.format}'`,
      );
    }

    this.text = match[2].trim();
  }
}

/**
 * A type that anything with a bit of text can be represented by
 */
export interface ITokenWithNote {
  text: string;
  format: number;
}

/**
 * Represents the /decode command
 */
export class DecodeCommand extends CommandToken {
  readonly codepage: number;

  constructor(line: string) {
    super();

    const match = /^\/decode( +([0-9]+))? *$/.exec(line);
    if (!match) {
      throw new Error(`Error parsing command '${line}'`);
    }

    if (match[2] !== undefined) {
      this.codepage = Number.parseInt(match[2]);
    } else {
      this.codepage = 1252;
    }

    // Check the codepage is valid
    if (!Object.keys(cptable).includes(`${this.codepage}`)) {
      throw new Error(`Unsupported codepage '${this.codepage}'`);
    }
  }
}

/**
 * Represents the /decode_gap command
 */
export class SetDecodeGapCommand extends CommandToken {
  readonly gap: number;

  constructor(line: string) {
    super();

    const match = /^\/decode_gap +([0-9]+) *$/.exec(line);
    if (!match) {
      throw new Error(`Error parsing command '${line}'`);
    }

    this.gap = Number.parseInt(match[1]);

    // Check the gap is valid
    if (this.gap < 0 || this.gap > 128) {
      throw new Error(`Gap ${this.gap} outside valid range 0-128`);
    }
  }
}

/**
 * Represents the /decode_control command
 */
export class SetDecodeControlCharacterCommand extends CommandToken {
  readonly control: string;

  constructor(line: string) {
    super();

    const match = /^\/decode_control +(.)$/.exec(line);
    if (!match) {
      throw new Error(`Error parsing command '${line}'`);
    }

    this.control = match[1];
  }
}
