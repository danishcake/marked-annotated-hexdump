import {
  CommandToken,
  DataToken,
  SetWidthCommand,
  SetCaseCommand,
  SetMissingCharacterCommand,
  HighlightCommand,
  SetAddressWidthCommand,
  SetBaseAddressCommand,
  NoteCommand,
} from '../src/inputTokens.ts';

describe('DataToken', () => {
  test('non-hex offset is rejected', () => {
    expect(() => DataToken('xxxx')).toThrow(Error);
  });

  test('hex offset is parsed to offset', () => {
    expect(new DataToken('0000').offset).toEqual(BigInt(0));
    expect(new DataToken('123').offset).toEqual(BigInt(0x123));
    expect(new DataToken('123456789abcdef').offset).toEqual(
      BigInt('0x123456789abcdef'),
    );
  });

  test('missing offset results in undefined offset', () => {
    expect(new DataToken('11 22').offset).toEqual(undefined);
    expect(new DataToken('22').offset).toEqual(undefined);
    expect(new DataToken('AA BB').offset).toEqual(undefined);
  });

  test('additional whitespace is ignored', () => {
    const a = new DataToken('22 3344');
    const b = new DataToken('22 33 44');
    const c = new DataToken('22   33   44');
    const aView = new Uint8Array(a.data);
    const bView = new Uint8Array(b.data);
    const cView = new Uint8Array(c.data);

    expect(aView).toEqual(bView);
    expect(aView).toEqual(cView);
  });

  test('non-hex data is rejected', () => {
    expect(() => new DataToken('xx')).toThrow(Error);
    expect(() => new DataToken('000 xx')).toThrow(Error);
    expect(() => new DataToken('000 00 xx')).toThrow(Error);
    expect(() => new DataToken('00 xx')).toThrow(Error);
  });

  test('half-bytes are rejected', () => {
    expect(() => new DataToken('00 11 2')).toThrow(Error);
  });
});

describe('CommandToken', () => {
  describe('width command', () => {
    test('accepts values between 2 and 32', () => {
      const cmd2 = CommandToken.parseCommand('/width 2');
      expect(cmd2).toBeInstanceOf(SetWidthCommand);
      expect(cmd2.width).toEqual(2);

      const cmd32 = CommandToken.parseCommand('/width 32');
      expect(cmd32).toBeInstanceOf(SetWidthCommand);
      expect(cmd32.width).toEqual(32);
    });

    test('allows extra whitespace', () => {
      const cmd = CommandToken.parseCommand('/width      2');
      expect(cmd).toBeInstanceOf(SetWidthCommand);
      expect(cmd.width).toEqual(2);
    });

    test('rejects 1', () => {
      expect(() => CommandToken.parseCommand('/width 1')).toThrow(Error);
    });

    test('rejects 33', () => {
      expect(() => CommandToken.parseCommand('/width 33')).toThrow(Error);
    });
  });

  describe('case command', () => {
    test('accepts upper', () => {
      const cmd = CommandToken.parseCommand('/case upper');
      expect(cmd).toBeInstanceOf(SetCaseCommand);
      expect(cmd.upper).toEqual(true);
    });

    test('accepts lower', () => {
      const cmd = CommandToken.parseCommand('/case lower');
      expect(cmd).toBeInstanceOf(SetCaseCommand);
      expect(cmd.upper).toEqual(false);
    });

    test('allows extra whitespace', () => {
      const cmd = CommandToken.parseCommand('/case     lower');
      expect(cmd).toBeInstanceOf(SetCaseCommand);
      expect(cmd.upper).toEqual(false);
    });

    test('rejects other values', () => {
      expect(() => CommandToken.parseCommand('/case DERP')).toThrow(Error);
    });
  });

  describe('missing command', () => {
    test('accepts x', () => {
      const cmd = CommandToken.parseCommand('/missing x');
      expect(cmd).toBeInstanceOf(SetMissingCharacterCommand);
      expect(cmd.missing).toEqual('x');
    });

    test('accepts space', () => {
      const cmd = CommandToken.parseCommand('/missing  ');
      expect(cmd).toBeInstanceOf(SetMissingCharacterCommand);
      expect(cmd.missing).toEqual(' ');
    });

    test('accepts .', () => {
      const cmd = CommandToken.parseCommand('/missing .');
      expect(cmd).toBeInstanceOf(SetMissingCharacterCommand);
      expect(cmd.missing).toEqual('.');
    });

    test('allows extra whitespace', () => {
      const cmd = CommandToken.parseCommand('/missing      .');
      expect(cmd).toBeInstanceOf(SetMissingCharacterCommand);
      expect(cmd.missing).toEqual('.');
    });

    test('rejects multiple characters', () => {
      expect(() => CommandToken.parseCommand('/missing ..')).toThrow(Error);
    });
  });

  describe('awidth command', () => {
    test('accepts 2', () => {
      const cmd = CommandToken.parseCommand('/awidth 2');
      expect(cmd).toBeInstanceOf(SetAddressWidthCommand);
      expect(cmd.width).toEqual(2);
    });

    test('accepts 8', () => {
      const cmd = CommandToken.parseCommand('/awidth 8');
      expect(cmd).toBeInstanceOf(SetAddressWidthCommand);
      expect(cmd.width).toEqual(8);
    });

    test('allows extra whitespace', () => {
      const cmd = CommandToken.parseCommand('/awidth     8');
      expect(cmd).toBeInstanceOf(SetAddressWidthCommand);
      expect(cmd.width).toEqual(8);
    });

    test('rejects 1', () => {
      expect(() => CommandToken.parseCommand('/awidth 1')).toThrow(Error);
    });

    test('rejects 9', () => {
      expect(() => CommandToken.parseCommand('/awidth 9')).toThrow(Error);
    });

    test('rejects hex', () => {
      expect(() => CommandToken.parseCommand('/awidth a')).toThrow(Error);
    });

    test('requires argument', () => {
      expect(() => CommandToken.parseCommand('/awidth')).toThrow(Error);
    });
  });

  describe('highlight command', () => {
    test('rejects non-numeric format', () => {
      expect(() => CommandToken.parseCommand('/highlight [0:1] x')).toThrow(Error);
    });

    test('extracts format index', () => {
      const cmd = CommandToken.parseCommand('/highlight [0:1] /1');
      expect(cmd).toBeInstanceOf(HighlightCommand);
      expect(cmd.format).toEqual(1);
      expect(cmd.ranges[0]).toEqual({ start: BigInt(0), end: BigInt(1) });
    });

    test('allows extra whitespace', () => {
      const cmd = CommandToken.parseCommand('/highlight    [0:1]     /1');
      expect(cmd).toBeInstanceOf(HighlightCommand);
      expect(cmd.format).toEqual(1);
      expect(cmd.ranges[0]).toEqual({ start: BigInt(0), end: BigInt(1) });
    });

    test('rejects whitespace format', () => {
      expect(() => CommandToken.parseCommand('/highlight [0:1]  ')).toThrow(
        Error,
      );
    });

    test('rejects negative format index', () => {
      expect(() => CommandToken.parseCommand('/highlight [0:1] /-1')).toThrow(
        Error,
      );
    });

    test('rejects format index 16', () => {
      expect(() => CommandToken.parseCommand('/highlight [0:1] /16')).toThrow(
        Error,
      );
    });

    test('rejects missing range', () => {
      expect(() => CommandToken.parseCommand('/highlight xx')).toThrow(Error);
    });

    test('extracts single element ranges', () => {
      const cmd = CommandToken.parseCommand('/highlight [1] /0');
      expect(cmd).toBeInstanceOf(HighlightCommand);
      expect(cmd.ranges[0]).toEqual({ start: BigInt(1), end: BigInt(1) });
    });

    test('extracts multiple single element ranges', () => {
      const cmd = CommandToken.parseCommand('/highlight [1,2,3] /0');
      expect(cmd).toBeInstanceOf(HighlightCommand);
      expect(cmd.ranges[0]).toEqual({ start: BigInt(1), end: BigInt(1) });
      expect(cmd.ranges[1]).toEqual({ start: BigInt(2), end: BigInt(2) });
      expect(cmd.ranges[2]).toEqual({ start: BigInt(3), end: BigInt(3) });
    });

    test('extracts multiple span ranges', () => {
      const cmd = CommandToken.parseCommand('/highlight [1:2,4:5] /0');
      expect(cmd).toBeInstanceOf(HighlightCommand);
      expect(cmd.ranges[0]).toEqual({ start: BigInt(1), end: BigInt(2) });
      expect(cmd.ranges[1]).toEqual({ start: BigInt(4), end: BigInt(5) });
    });

    test('extracts combined span and single element ranges', () => {
      const cmd = CommandToken.parseCommand('/highlight [1,4:5] /0');
      expect(cmd).toBeInstanceOf(HighlightCommand);
      expect(cmd.ranges[0]).toEqual({ start: BigInt(1), end: BigInt(1) });
      expect(cmd.ranges[1]).toEqual({ start: BigInt(4), end: BigInt(5) });
    });

    test('rejects empty range', () => {
      expect(() => CommandToken.parseCommand('/highlight [] /1')).toThrow(
        Error,
      );
    });

    test('rejects range with negative length', () => {
      expect(() => CommandToken.parseCommand('/highlight [10:9] xx')).toThrow(
        Error,
      );
    });
  });

  describe('baseaddress command', () => {
    test('accepts 0', () => {
      const cmd = CommandToken.parseCommand('/baseaddress 0');
      expect(cmd).toBeInstanceOf(SetBaseAddressCommand);
      expect(cmd.baseAddress).toEqual(BigInt(0));
    });

    test('accepts hex', () => {
      const cmd = CommandToken.parseCommand('/baseaddress ff');
      expect(cmd).toBeInstanceOf(SetBaseAddressCommand);
      expect(cmd.baseAddress).toEqual(BigInt(255));
    });

    test('accepts extra whitespace', () => {
      const cmd = CommandToken.parseCommand('/baseaddress        ff');
      expect(cmd).toBeInstanceOf(SetBaseAddressCommand);
      expect(cmd.baseAddress).toEqual(BigInt(255));
    });

    test('accepts 2^64 - 1', () => {
      const cmd = CommandToken.parseCommand('/baseaddress FFFFFFFFFFFFFFFF');
      expect(cmd).toBeInstanceOf(SetBaseAddressCommand);
      expect(cmd.baseAddress).toEqual(BigInt('0xFFFFFFFFFFFFFFFF'));
    });

    test('rejects -1', () => {
      expect(() => CommandToken.parseCommand('/baseaddress -1')).toThrow(Error);
    });

    test('rejects 2^64', () => {
      expect(() =>
        CommandToken.parseCommand(`/baseaddress ${BigInt(0x10000000000000000)}`),
      ).toThrow(Error);
    });

    test('requires argument', () => {
      expect(() => CommandToken.parseCommand('/baseaddress')).toThrow(Error);
    });
  });

  describe('/note command', () => {
    test('accepts /0 through /15', () => {
      for (let i = 0; i < 16; i++) {
        const cmd = CommandToken.parseCommand(`/note /${i} text`);
        expect(cmd).toBeInstanceOf(NoteCommand);
        expect(cmd.format).toEqual(i);
        expect(cmd.text).toEqual('text');
      }
    });

    test('accepts extra whitespace', () => {
      const cmd = CommandToken.parseCommand('/note   /1   text');
      expect(cmd).toBeInstanceOf(NoteCommand);
      expect(cmd.format).toEqual(1);
      expect(cmd.text).toEqual('text');
    });

    test('rejects -1 format', () => {
      expect(() => CommandToken.parseCommand('/note /-1 text')).toThrow(Error);
    });

    test('rejects 16 format', () => {
      expect(() => CommandToken.parseCommand('/note /16 text')).toThrow(Error);
    });

    test('rejects missing text', () => {
      expect(() => CommandToken.parseCommand('/note /16 ')).toThrow(Error);
    });

    test('rejects purely whitespace text', () => {
      expect(() => CommandToken.parseCommand('/note /16      ')).toThrow(Error);
    });

    test('text is trimmed', () => {
      const cmd = CommandToken.parseCommand('/note /1 text   ');
      expect(cmd).toBeInstanceOf(NoteCommand);
      expect(cmd.text).toEqual('text');
    });
  });
});
