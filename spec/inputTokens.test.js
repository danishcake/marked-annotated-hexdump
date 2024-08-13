import {
  CommandToken,
  DataToken,
  SetWidthCommand,
  SetCaseCommand,
  SetMissingCharacterCommand,
  HighlightCommand,
} from "../src/inputTokens.ts";

describe("DataToken", () => {
  test("non-hex offset is rejected", () => {
    expect(() => DataToken("xxxx")).toThrow(Error);
  });

  test("hex offset is parsed to offset", () => {
    expect(new DataToken("0000").offset).toEqual(0);
    expect(new DataToken("123").offset).toEqual(0x123);
    expect(new DataToken("123456789abcdef").offset).toEqual(0x123456789abcdef);
  });

  test("missing offset results in undefined offset", () => {
    expect(new DataToken("11 22").offset).toEqual(undefined);
    expect(new DataToken("22").offset).toEqual(undefined);
  });

  test("additional whitespace is ignored", () => {
    const a = new DataToken("22 3344");
    const b = new DataToken("22 33 44");
    const c = new DataToken("22   33   44");
    const a_view = new Uint8Array(a.data);
    const b_view = new Uint8Array(b.data);
    const c_view = new Uint8Array(c.data);

    expect(a_view).toEqual(b_view);
    expect(a_view).toEqual(c_view);
  });

  test("non-hex data is rejected", () => {
    expect(() => new DataToken("xx")).toThrow(Error);
    expect(() => new DataToken("000 xx")).toThrow(Error);
    expect(() => new DataToken("000 00 xx")).toThrow(Error);
    expect(() => new DataToken("00 xx")).toThrow(Error);
  });

  test("half-bytes are rejected", () => {
    expect(() => new DataToken("00 11 2")).toThrow(Error);
  });
});

describe("CommandToken", () => {
  describe("width command", () => {
    test("accepts values between 4 and 32", () => {
      const cmd4 = CommandToken.parseCommand("/width 4");
      expect(cmd4).toBeInstanceOf(SetWidthCommand);
      expect(cmd4.width).toEqual(4);

      const cmd32 = CommandToken.parseCommand("/width 32");
      expect(cmd32).toBeInstanceOf(SetWidthCommand);
      expect(cmd32.width).toEqual(32);
    });

    test("rejects values smaller than 4", () => {
      expect(() => CommandToken.parseCommand("/width 3")).toThrow(Error);
    });

    test("rejects values greater than 32", () => {
      expect(() => CommandToken.parseCommand("/width 33")).toThrow(Error);
    });
  });

  describe("case command", () => {
    test("accepts upper", () => {
      const cmd = CommandToken.parseCommand("/case upper");
      expect(cmd).toBeInstanceOf(SetCaseCommand);
      expect(cmd.upper).toEqual(true);
    });

    test("accepts lower", () => {
      const cmd = CommandToken.parseCommand("/case lower");
      expect(cmd).toBeInstanceOf(SetCaseCommand);
      expect(cmd.upper).toEqual(false);
    });

    test("rejects other values", () => {
      expect(() => CommandToken.parseCommand("/case DERP")).toThrow(Error);
    });
  });

  describe("missing command", () => {
    test("accepts x", () => {
      const cmd = CommandToken.parseCommand("/missing x");
      expect(cmd).toBeInstanceOf(SetMissingCharacterCommand);
      expect(cmd.missing).toEqual("x");
    });

    test("accepts space", () => {
      const cmd = CommandToken.parseCommand("/missing  ");
      expect(cmd).toBeInstanceOf(SetMissingCharacterCommand);
      expect(cmd.missing).toEqual(" ");
    });

    test("accepts .", () => {
      const cmd = CommandToken.parseCommand("/missing .");
      expect(cmd).toBeInstanceOf(SetMissingCharacterCommand);
      expect(cmd.missing).toEqual(".");
    });

    test("rejects multiple characters", () => {
      expect(() => CommandToken.parseCommand("/missing ..")).toThrow(Error);
    });
  });

  describe("highlight command", () => {
    test("accepts any format", () => {
      const cmd = CommandToken.parseCommand("/highlight [0:1] x");
      expect(cmd).toBeInstanceOf(HighlightCommand);
      expect(cmd.format).toEqual("x");
      expect(cmd.ranges[0]).toEqual({ start: 0, end: 1 });
    });

    test("rejects whitespace format", () => {
      expect(() => CommandToken.parseCommand("/highlight [0:1]  ")).toThrow(
        Error
      );
    });

    test("rejects missing range", () => {
      expect(() => CommandToken.parseCommand("/highlight xx")).toThrow(Error);
    });

    test("rejects empty range", () => {
      expect(() => CommandToken.parseCommand("/highlight [] xx")).toThrow(
        Error
      );
    });

    test("rejects range with negative length", () => {
      expect(() => CommandToken.parseCommand("/highlight [10:9] xx")).toThrow(
        Error
      );
    });
  });
});
