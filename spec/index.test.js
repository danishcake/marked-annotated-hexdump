import { marked } from "marked";
import thisExtension from "../src/index.ts";

describe("this-extension", () => {
  beforeEach(() => {
    marked.setOptions(marked.getDefaults());
  });

  test("single line and four bytes", () => {
    // GIVEN four bytes of input and an explicit zero offset
    // WHEN markdown is rendered
    // THEN there is a four byte offset, followed by 16 bytes of output where only the first four bytes
    //      are populated
    marked.use(thisExtension());
    const markdown = "```annotated-hexdump\n0000 00 01 02 03\n```";

    expect(marked(markdown)).toBe(
      '<pre><code class="language-annotated-hexdump">00000000 00 01 02 03                                    </code></pre>'
    );
  });

  test("implicit zero offset", () => {
    // GIVEN four bytes of input and no explicit offset
    // WHEN markdown is rendered
    // THEN there is a four byte offset, followed by 16 bytes of output where only the first four bytes
    //      are populated. The output is the same as if the offset was explicitly set to zero

    marked.use(thisExtension());
    const markdown = "```annotated-hexdump\n00 01 02 03\n```";

    expect(marked(markdown)).toBe(
      '<pre><code class="language-annotated-hexdump">00000000 00 01 02 03                                    </code></pre>'
    );
  });

  test("implicit offset increments", () => {
    // GIVEN an explicit offset, followed by three lines with three bytes each
    // WHEN markdown is rendered
    // THEN there is a four byte offset, followed by 16 bytes of output where only the first nine bytes
    //      are populated. The three byte ranges are concatenated, implicitly continuing the previous

    marked.use(thisExtension());
    const markdown =
      "```annotated-hexdump\n" + "00 01 02\n" + "03 04 05\n" + "06 07 08\n```";

    expect(marked(markdown)).toBe(
      '<pre><code class="language-annotated-hexdump">00000000 00 01 02 03 04 05 06 07 08                     </code></pre>'
    );
  });

  test("three character offset", () => {
    // GIVEN an explicit offset specified with three characters
    // WHEN markdown is rendered
    // THEN the three character offset is recognised
    marked.use(thisExtension());
    const markdown = "```annotated-hexdump\n010 00 01 02 03\n```";

    expect(marked(markdown)).toBe(
      '<pre><code class="language-annotated-hexdump">00000010 00 01 02 03                                    </code></pre>'
    );
  });

  test("sixteen character offset", () => {
    // GIVEN a full 16 character offset
    // WHEN the markdown is rendered
    // THEN the sixteen character offset is recognised
    marked.use(thisExtension());
    const markdown = "```annotated-hexdump\n0000000000000010 00 01 02 03\n```";

    expect(marked(markdown)).toBe(
      '<pre><code class="language-annotated-hexdump">00000010 00 01 02 03                                    </code></pre>'
    );
  });

  test("unaligned offset", () => {
    // GIVEN an offset that isn't aligned to the line width
    // WHEN the markdown is rendered
    // THEN the line starting position is aligned
    marked.use(thisExtension());
    const markdown = "```annotated-hexdump\n024 00 01 02 03\n```";

    expect(marked(markdown)).toBe(
      '<pre><code class="language-annotated-hexdump">00000020             00 01 02 03                        </code></pre>'
    );
  });

  test("single lines and 16 bytes", () => {
    // GIVEN an offset, and sixteen bytes (the default line width)
    // WHEN the markdown is rendered
    // THEN there is a four byte offset, followed by all sixteen bytes of input
    marked.use(thisExtension());
    const markdown =
      "```annotated-hexdump\n0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n```";

    expect(marked(markdown)).toBe(
      '<pre><code class="language-annotated-hexdump">00000000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F</code></pre>'
    );
  });

  test("multiple contiguous lines", () => {
    // GIVEN two full lines for the first 32 bytes
    // WHEN the markdown is rendered
    // THEN there are two lines of fully populated output
    marked.use(thisExtension());
    const markdown =
      "```annotated-hexdump\n" +
      "0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n" +
      "0010 10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F\n```";

    expect(marked(markdown)).toBe(
      '<pre><code class="language-annotated-hexdump">' +
        "00000000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n" +
        "00000010 10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F" +
        "</code></pre>"
    );
  });

  test("multiple nearly-contiguous lines", () => {
    // GIVEN three partial populated lines, with unaligned offset and big gaps, but at least some data on each row
    // WHEN the markdown is rendered
    // THEN there are three lines of output, with the sparse data in the correct locations

    marked.use(thisExtension());
    const markdown =
      "```annotated-hexdump\n" +
      "0000 00 01 02 03\n" +
      "0014 14 15 16 17\n" +
      "001F 1F 20 21 22\n```";

    expect(marked(markdown)).toBe(
      '<pre><code class="language-annotated-hexdump">' +
        "00000000 00 01 02 03                                    \n" +
        "00000010             14 15 16 17                      1F\n" +
        "00000020 20 21 22                                       " +
        "</code></pre>"
    );
  });

  test("multiple non-contiguous lines", () => {
    // GIVEN three lines of input, with entire 16 byte rows unpopulated
    // WHEN the markdown is rendered
    // THEN the unpopulated lines are replaced with an offset and ...

    marked.use(thisExtension());
    const markdown =
      "```annotated-hexdump\n" +
      "0000 00 01 02 03\n" +
      "0020 20 21 22 23\n" +
      "0040 40 41 42 43\n```";

    expect(marked(markdown)).toBe(
      '<pre><code class="language-annotated-hexdump">' +
        "00000000 00 01 02 03                                    \n" +
        "00000010 ...\n" +
        "00000020 20 21 22 23                                    \n" +
        "00000030 ...\n" +
        "00000040 40 41 42 43                                    " +
        "</code></pre>"
    );
  });

  test("multiple very non-contiguous lines", () => {
    // GIVEN three lines input, with multiple contiguous 16 byte rows unpopulated
    // WHEN the markdown is rendered
    // THEN the multiple unpopulated lines are consolidated

    marked.use(thisExtension());
    const markdown =
      "```annotated-hexdump\n" +
      "0000 00 01 02 03\n" +
      "0040 40 41 42 43\n" +
      "0080 80 81 82 83\n```";

    let html = marked(markdown);

    expect(marked(markdown)).toBe(
      '<pre><code class="language-annotated-hexdump">' +
        "00000000 00 01 02 03                                    \n" +
        "00000010 ...\n" +
        "00000040 40 41 42 43                                    \n" +
        "00000050 ...\n" +
        "00000080 80 81 82 83                                    " +
        "</code></pre>"
    );
  });

  test("code with different infostring", () => {
    marked.use(thisExtension());
    const markdown = "```different\nABC\n```";

    expect(marked(markdown)).toBe(
      '<pre><code class="language-different">ABC\n</code></pre>\n'
    );
  });

  test("markdown not using this extension", () => {
    marked.use(thisExtension());
    const markdown = "not example markdown";

    expect(marked(markdown)).not.toBe("<p>example html</p>\n");
  });

  test("address width too small for address", () => {
    marked.use(thisExtension());
    // TODO: Test a small address width with a long address
  });
});
