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
    sba.setBytes(5, new ArrayBuffer(10));
    sba.setBytes(20, new ArrayBuffer(10));
    expect(sba.getEnd()).toEqual(30);
    expect(sba.getOrigin()).toEqual(5);
  });

  test("inserted data updates can be retrieved", () => {
    const sba = new SparseByteArray();
    sba.setBytes(5, new ArrayBuffer(10));
    sba.setBytes(20, new ArrayBuffer(10));
    expect(sba.getByte(0)).toEqual(null);
    expect(sba.getByte(5)).toEqual(0);
    expect(sba.getByte(14)).toEqual(0);
    expect(sba.getByte(15)).toEqual(null);
    expect(sba.getByte(20)).toEqual(0);
  });

  test("inserted data updates reject overlaps", () => {
    const sba = new SparseByteArray();
    sba.setBytes(10, new ArrayBuffer(10));
    expect(() => sba.setBytes(10, new ArrayBuffer(10))).toThrow(Error);
    expect(() => sba.setBytes(19, new ArrayBuffer(10))).toThrow(Error);
    sba.setBytes(0, new ArrayBuffer(10));
    sba.setBytes(20, new ArrayBuffer(10));
  });
});
