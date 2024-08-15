import { SparseByteArray } from "../src/sparseByteArray";

describe("SparseByteArray", () => {
  test("empty SBA getByte returns null", () => {
    const sba = new SparseByteArray();
    expect(sba.getByte()).toEqual(null);
  });

  test("empty SBA getOrigin throws", () => {
    const sba = new SparseByteArray();
    expect(() => sba.getOrigin()).toThrow(Error);
  });

  test("empty SBA getEnd throws", () => {
    const sba = new SparseByteArray();
    expect(() => sba.getEnd()).toThrow(Error);
  });

  test("inserted data updates start/end", () => {
    const sba = new SparseByteArray();
    sba.setBytes(BigInt(5), new ArrayBuffer(10));
    sba.setBytes(BigInt(20), new ArrayBuffer(10));
    expect(sba.getEnd()).toEqual(BigInt(30));
    expect(sba.getOrigin()).toEqual(BigInt(5));
  });

  test("inserted data updates can be retrieved", () => {
    const sba = new SparseByteArray();
    sba.setBytes(BigInt(5), new ArrayBuffer(10));
    sba.setBytes(BigInt(20), new ArrayBuffer(10));
    expect(sba.getByte(BigInt(0))).toEqual(null);
    expect(sba.getByte(BigInt(5))).toEqual(0);
    expect(sba.getByte(BigInt(14))).toEqual(0);
    expect(sba.getByte(BigInt(15))).toEqual(null);
    expect(sba.getByte(BigInt(20))).toEqual(0);
  });

  test("inserted data updates reject overlaps", () => {
    const sba = new SparseByteArray();
    sba.setBytes(BigInt(10), new ArrayBuffer(10));
    expect(() => sba.setBytes(BigInt(10), new ArrayBuffer(10))).toThrow(Error);
    expect(() => sba.setBytes(BigInt(19), new ArrayBuffer(10))).toThrow(Error);
    sba.setBytes(BigInt(0), new ArrayBuffer(10));
    sba.setBytes(BigInt(20), new ArrayBuffer(10));
  });
});
