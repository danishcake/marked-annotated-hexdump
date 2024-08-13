import { DataToken } from "../src/inputTokens.ts";

describe("DataToken", () => {
  test("non-hex offset is rejected", () => {
    expect(() => DataToken("xxxx")).toThrow(Error);
  });

  test("hex offset is parsed to offset", () => {
    expect((new DataToken("0000")).offset).toEqual(0);
    expect((new DataToken("123")).offset).toEqual(0x123);
    expect((new DataToken("123456789abcdef")).offset).toEqual(0x123456789abcdef);
  });

  test("missing offset results in undefined offset", () => {
    expect((new DataToken("11 22")).offset).toEqual(undefined);
    expect((new DataToken("22")).offset).toEqual(undefined);
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
