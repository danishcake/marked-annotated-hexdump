import { marked } from 'marked';
import { annotatedHex } from '../src/marked.ts';
import { TOP_AND_TAIL, TOP_AND_TAIL_SVG } from './helper.ts';

describe('marked-extension', () => {
  beforeEach(() => {
    marked.setOptions(marked.getDefaults());
  });

  test('single line and four bytes', () => {
    // GIVEN four bytes of input and an explicit zero offset
    // WHEN markdown is rendered
    // THEN there is a four byte offset, followed by 16 bytes of output where only the first four bytes
    //      are populated
    marked.use(annotatedHex());
    const markdown = '```annotated-hexdump\n0000 00 01 02 03\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL('00000000 00 01 02 03                                    '),
    );
  });

  test('implicit zero offset', () => {
    // GIVEN four bytes of input and no explicit offset
    // WHEN markdown is rendered
    // THEN there is a four byte offset, followed by 16 bytes of output where only the first four bytes
    //      are populated. The output is the same as if the offset was explicitly set to zero

    marked.use(annotatedHex());
    const markdown = '```annotated-hexdump\n00 01 02 03\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL('00000000 00 01 02 03                                    '),
    );
  });

  test('implicit offset increments', () => {
    // GIVEN an explicit offset, followed by three lines with three bytes each
    // WHEN markdown is rendered
    // THEN there is a four byte offset, followed by 16 bytes of output where only the first nine bytes
    //      are populated. The three byte ranges are concatenated, implicitly continuing the previous

    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n' + '00 01 02\n' + '03 04 05\n' + '06 07 08\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL('00000000 00 01 02 03 04 05 06 07 08                     '),
    );
  });

  test('three character offset', () => {
    // GIVEN an explicit offset specified with three characters
    // WHEN markdown is rendered
    // THEN the three character offset is recognised
    marked.use(annotatedHex());
    const markdown = '```annotated-hexdump\n010 00 01 02 03\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL('00000010 00 01 02 03                                    '),
    );
  });

  test('sixteen character offset', () => {
    // GIVEN a full 16 character offset
    // WHEN the markdown is rendered
    // THEN the sixteen character offset is recognised
    marked.use(annotatedHex());
    const markdown = '```annotated-hexdump\n0000000000000010 00 01 02 03\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL('00000010 00 01 02 03                                    '),
    );
  });

  test('unaligned offset', () => {
    // GIVEN an offset that isn't aligned to the line width
    // WHEN the markdown is rendered
    // THEN the line starting position is aligned
    marked.use(annotatedHex());
    const markdown = '```annotated-hexdump\n024 00 01 02 03\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL('00000020             00 01 02 03                        '),
    );
  });

  test('single lines and 16 bytes', () => {
    // GIVEN an offset, and sixteen bytes (the default line width)
    // WHEN the markdown is rendered
    // THEN there is a four byte offset, followed by all sixteen bytes of input
    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL('00000000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F'),
    );
  });

  test('multiple contiguous lines', () => {
    // GIVEN two full lines for the first 32 bytes
    // WHEN the markdown is rendered
    // THEN there are two lines of fully populated output
    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n'
      + '0010 10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL(
        '00000000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n'
          + '00000010 10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F',
      ),
    );
  });

  test('multiple nearly-contiguous lines', () => {
    // GIVEN three partial populated lines, with unaligned offset and big gaps, but at least some data on each row
    // WHEN the markdown is rendered
    // THEN there are three lines of output, with the sparse data in the correct locations

    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '0000 00 01 02 03\n'
      + '0014 14 15 16 17\n'
      + '001F 1F 20 21 22\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL(
        '00000000 00 01 02 03                                    \n'
          + '00000010             14 15 16 17                      1F\n'
          + '00000020 20 21 22                                       ',
      ),
    );
  });

  test('multiple non-contiguous lines', () => {
    // GIVEN three lines of input, with entire 16 byte rows unpopulated
    // WHEN the markdown is rendered
    // THEN the unpopulated lines are replaced with an offset and ...

    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '0000 00 01 02 03\n'
      + '0020 20 21 22 23\n'
      + '0040 40 41 42 43\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL(
        '00000000 00 01 02 03                                    \n'
          + '00000010 ...\n'
          + '00000020 20 21 22 23                                    \n'
          + '00000030 ...\n'
          + '00000040 40 41 42 43                                    ',
      ),
    );
  });

  test('multiple very non-contiguous lines', () => {
    // GIVEN three lines input, with multiple contiguous 16 byte rows unpopulated
    // WHEN the markdown is rendered
    // THEN the multiple unpopulated lines are consolidated

    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '0000 00 01 02 03\n'
      + '0040 40 41 42 43\n'
      + '0080 80 81 82 83\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL(
        '00000000 00 01 02 03                                    \n'
          + '00000010 ...\n'
          + '00000040 40 41 42 43                                    \n'
          + '00000050 ...\n'
          + '00000080 80 81 82 83                                    ',
      ),
    );
  });

  test('default configuration', () => {
    // GIVEN two lines of data, with bytes 14/15 missing
    // AND /width, /case are /missing are explicitly set to their defaults
    // WHEN the markdown is rendered
    // THEN the output is unchanged
    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '/width 16\n'
      + '/awidth 4\n'
      + '/case upper\n'
      + '/missing  \n'
      + '0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D\n'
      + '0010 10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL(
        '00000000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D      \n'
          + '00000010 10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F',
      ),
    );
  });

  test('address width can be changed', () => {
    // GIVEN two lines of data, with bytes 14/15 missing
    // AND /awidth is changed to 2
    // WHEN the markdown is rendered
    // THEN the address is 4 characters long
    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '/awidth 2\n'
      + '0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D\n'
      + '0010 10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL(
        '0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D      \n'
          + '0010 10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F',
      ),
    );
  });

  test('data width can be changed', () => {
    // GIVEN 14 bytes of data
    // AND /width is changed to 2
    // WHEN the markdown is rendered
    // THEN the data is 4 characters long
    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '/width 2\n'
      + '0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL(
        '00000000 00 01\n'
          + '00000002 02 03\n'
          + '00000004 04 05\n'
          + '00000006 06 07\n'
          + '00000008 08 09\n'
          + '0000000A 0A 0B\n'
          + '0000000C 0C 0D',
      ),
    );
  });

  test('case can be changed', () => {
    // GIVEN 14 bytes of data
    // AND /case is changed to lower
    // WHEN the markdown is rendered
    // THEN the output is lower case
    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '/case lower\n'
      + '0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL('00000000 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d      '),
    );
  });

  test('missing can be changed', () => {
    // GIVEN 14 bytes of data
    // AND /missing is changed to ?
    // WHEN the markdown is rendered
    // THEN the output contains the ?? marker
    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '/missing ?\n'
      + '0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL('00000000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D ?? ??'),
    );
  });

  test('can highlight row subset', () => {
    // GIVEN 14 bytes of data
    // AND /highlight set of bytes 4-7 inclusive
    // WHEN the markdown is rendered
    // THEN the SVG is included
    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '/highlight [4:7] /1\n'
      + '0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL_SVG(
        '00000000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D      ',
        '<rect width="11ch" height="1.2em" x="21ch" y="0em" style="fill:#00ff00"/>',
      ),
    );
  });

  test('can highlight data on second row', () => {
    // GIVEN 16 bytes of data
    // AND row width of 8
    // AND /highlight set of bytes 8-10 inclusive
    // WHEN the markdown is rendered
    // THEN the SVG is included
    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '/highlight [8:A] /1\n'
      + '/width 8\n'
      + '0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL_SVG(
        '00000000 00 01 02 03 04 05 06 07\n'
          + '00000008 08 09 0A 0B 0C 0D 0E 0F',
        '<rect width="8ch" height="1.2em" x="9ch" y="1.2em" style="fill:#00ff00"/>',
      ),
    );
  });

  test('can highlight data on multiple rows', () => {
    // GIVEN 16 bytes of data
    // AND row width of 8
    // AND /highlight set of bytes 8-10 inclusive
    // WHEN the markdown is rendered
    // THEN the SVG is included
    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '/highlight [8:A] /1\n'
      + '/width 8\n'
      + '0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL_SVG(
        '00000000 00 01 02 03 04 05 06 07\n'
          + '00000008 08 09 0A 0B 0C 0D 0E 0F',
        '<rect width="8ch" height="1.2em" x="9ch" y="1.2em" style="fill:#00ff00"/>',
      ),
    );
  });

  test('baseaddress can be changed ', () => {
    // GIVEN 16 bytes of data
    // AND row width of 8
    // AND /baseaddress set to 17
    // AND /highlight set of bytes 8-10 inclusive
    // WHEN the markdown is rendered
    // THEN the SVG is included
    // AND the addresses are offset by 17
    marked.use(annotatedHex());
    const markdown =
      '```annotated-hexdump\n'
      + '/highlight [8:A] /1\n'
      + '/width 8\n'
      + '/baseaddress 17\n'
      + '0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n```';

    expect(marked(markdown)).toBe(
      TOP_AND_TAIL_SVG(
        '00000010                      00\n'
          + '00000018 01 02 03 04 05 06 07 08\n'
          + '00000020 09 0A 0B 0C 0D 0E 0F   ',
        '<rect width="2ch" height="1.2em" x="30ch" y="1.2em" style="fill:#00ff00"/>'
          + '<rect width="5ch" height="1.2em" x="9ch" y="2.4em" style="fill:#00ff00"/>',
      ),
    );
  });

  test('code with different infostring', () => {
    marked.use(annotatedHex());
    const markdown = '```different\nABC\n```';

    expect(marked(markdown)).toBe(
      '<pre><code class="language-different">ABC\n</code></pre>\n',
    );
  });

  test('markdown not using this extension', () => {
    marked.use(annotatedHex());
    const markdown = 'not example markdown';

    expect(marked(markdown)).not.toBe('<p>example html</p>\n');
  });

  test('address width too small for address', () => {
    const markdown = '```annotated-hexdump\n'
    + '/awidth 2\n'
    + '010000 00 01\n```';

    marked.use(annotatedHex());
    expect(() => marked(markdown)).toThrow(Error);
  });

  test('no data is rejected', () => {
    const markdown = '```annotated-hexdump\n'
    + '010000\n```';

    marked.use(annotatedHex());
    expect(() => marked(markdown)).toThrow(Error);
  });
});
