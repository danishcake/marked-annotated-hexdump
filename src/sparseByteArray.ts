/**
 * Handles a sparse byte array formed of non-overlapping extents
 */
export class SparseByteArray {
  extents: {
    offset: number;
    bytes: ArrayBuffer;
  }[] = [];

  constructor() {}

  /** Sets an extent of bytes. Must not overlap with an existing extent */
  setBytes(offset: number, bytes: ArrayBuffer) {
    // Detect overlaps
    for (const extent of this.extents) {
      const overlap =
        Math.min(
          offset + bytes.byteLength,
          extent.offset + extent.bytes.byteLength
        ) - Math.max(offset, extent.offset);
      if (overlap > 0) {
        throw new Error(
          `setBytes called with extent starting at ${offset} that overlaps existing range at ${extent.offset}`
        );
      }
    }

    this.extents.push({ offset, bytes });
    this.extents.sort((a, b) => a.offset - b.offset);
  }

  /** Reads a single byte */
  getByte(offset: number): number | null {
    for (const extent of this.extents) {
      if (
        offset >= extent.offset &&
        offset < extent.offset + extent.bytes.byteLength
      ) {
        return new Uint8Array(extent.bytes)[offset - extent.offset];
      }
    }

    return null;
  }

  /**
   * Gets the index of the first byte
   */
  getOrigin(): number {
    if (this.extents.length === 0) {
      throw new Error("SparseByteArray contains no data");
    }

    return this.extents[0].offset;
  }

  /**
   * Gets the index of the last byte plus one
   */
  getEnd(): number {
    if (this.extents.length === 0) {
      throw new Error("SparseByteArray contains no data");
    }

    const lastExtent = this.extents.slice(-1)[0];
    return lastExtent.offset + lastExtent.bytes.byteLength;
  }
}
