import { maxBigInt, minBigInt, sortComparatorBigInt } from './bigint';

/**
 * Handles a sparse byte array formed of non-overlapping extents
 */
export class SparseByteArray {
  extents: {
    offset: bigint;
    bytes: ArrayBuffer;
  }[] = [];

  /** Sets an extent of bytes. Must not overlap with an existing extent */
  setBytes(offset: bigint, bytes: ArrayBuffer) {
    // Detect overlaps
    for (const extent of this.extents) {
      const overlap = minBigInt(offset + BigInt(bytes.byteLength), extent.offset + BigInt(extent.bytes.byteLength))
                      - maxBigInt(offset, extent.offset);
      if (overlap > 0) {
        throw new Error(
          `setBytes called with extent starting at ${offset} that overlaps existing range at ${extent.offset}`,
        );
      }
    }

    this.extents.push({ offset, bytes });
    this.extents.sort((a, b) => sortComparatorBigInt(a.offset, b.offset));
  }

  /** Reads a single byte */
  getByte(offset: bigint): number | null {
    for (const extent of this.extents) {
      if (
        offset >= extent.offset
        && offset < extent.offset + BigInt(extent.bytes.byteLength)
      ) {
        return new Uint8Array(extent.bytes)[Number(offset - extent.offset)];
      }
    }

    return null;
  }

  /**
   * Gets the index of the first byte
   */
  getOrigin(): bigint {
    if (this.extents.length === 0) {
      throw new Error('SparseByteArray contains no data');
    }

    return this.extents[0].offset;
  }

  /**
   * Gets the index of the last byte plus one
   */
  getEnd(): bigint {
    if (this.extents.length === 0) {
      throw new Error('SparseByteArray contains no data');
    }

    const lastExtent = this.extents.slice(-1)[0];
    return lastExtent.offset + BigInt(lastExtent.bytes.byteLength);
  }
}
