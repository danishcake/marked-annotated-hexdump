import { maxBigInt, minBigInt, parseBigIntHex } from '../src/bigint';

describe('bigint', () => {
  describe('parseBigIntHex', () => {
    test('leading 0x is optional', () => {
      expect(parseBigIntHex('0x100')).toBe(BigInt(0x100));
      expect(parseBigIntHex('100')).toBe(BigInt(0x100));
    });
  });

  describe('maxBigInt', () => {
    test('largest value returned', () => {
      expect(maxBigInt(BigInt(1), BigInt(2), BigInt(3))).toBe(BigInt(3));
      expect(maxBigInt(BigInt(2), BigInt(3))).toBe(BigInt(3));
      expect(maxBigInt(BigInt(3))).toBe(BigInt(3));
    });

    test('throws if list empty', () => {
      expect(() => maxBigInt()).toThrow(Error);
    });
  });

  describe('minBigInt', () => {
    test('smallest value returned', () => {
      expect(minBigInt(BigInt(1), BigInt(2), BigInt(3))).toBe(BigInt(1));
      expect(minBigInt(BigInt(2), BigInt(3))).toBe(BigInt(2));
      expect(minBigInt(BigInt(3))).toBe(BigInt(3));
    });

    test('throws if list empty', () => {
      expect(() => minBigInt()).toThrow(Error);
    });
  });
});
