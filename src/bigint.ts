/**
 * Parses a string to a BigInt. Equivalent to BigInt.parse(input, 16)
 * @param input String that contains a BigInt
 * @returns Bigint
 * @throws RangeError, TypeError or SyntaxError
 */
export function parseBigIntHex(input: string): bigint {
  if (!input.startsWith("0x")) {
    input = "0x" + input;
  }

  return BigInt(input);
}

/**
 * Finds the largest of a set of BigInts. Equivalent to Math.max
 * @param args BigInts to find max of
 * @returns The largest BigInt
 */
export function maxBigInt(...args: bigint[]): bigint {
  if (args.length < 1) {
    throw new Error("Max of empty list");
  }
  let m = args[0];
  args.forEach((a) => {
    if (a > m) {
      m = a;
    }
  });
  return m;
}

/**
 * Finds the smallest of a set of BigInts. Equivalent to Math.min
 * @param args BigInts to find min of
 * @returns The smallest BigInt
 */
export function minBigInt(...args: bigint[]): bigint {
  if (args.length < 1) {
    throw new Error("Min of empty list");
  }
  let m = args[0];
  args.forEach((a) => {
    if (a < m) {
      m = a;
    }
  });
  return m;
}

/**
 * Sort comparator for BigInt. Designed for use with BigInt[].sort
 * @param lhs LHS of comparison
 * @param rhs RHS of comparison
 * @returns 1 if LHS > RHS, -1 if RHS > LHS, 0 if LHS == RHS
 */
export function sortComparatorBigInt(lhs: bigint, rhs: bigint): number {
  if (lhs > rhs) {
    return 1
  } else if (lhs < rhs) {
    return -1;
  } else {
    return 0;
  }
}
