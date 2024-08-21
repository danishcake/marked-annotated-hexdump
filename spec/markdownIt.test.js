import markdownIt from 'markdown-it';
import { extendMarkdownIt, annotatedHex } from '../src/markdown-it';
import { TOP_AND_TAIL } from './helper.ts';

/**
 * Warning: This is significantly more lightly tested, as this is primarily a marked extension
 *
 * See marked.test.js for a /lot/ more tests
 */
describe('markdown-it-extension', () => {
  test('single line and four bytes with extendMarkdownIt', () => {
    const md = markdownIt();
    extendMarkdownIt(md);

    const markdown = '```annotated-hexdump\n0000 00 01 02 03\n```';

    expect(md.render(markdown)).toBe(
      TOP_AND_TAIL('00000000 00 01 02 03                                    ')
        + '\n',
    );
  });

  test('single line and four byte with plugin via use', () => {
    const md = markdownIt();
    md.use(extendMarkdownIt);

    const markdown = '```annotated-hexdump\n0000 00 01 02 03\n```';

    expect(md.render(markdown)).toBe(
      TOP_AND_TAIL('00000000 00 01 02 03                                    ')
        + '\n',
    );
  });

  test('single line and four byte with plugin via use', () => {
    const md = markdownIt();
    md.use(annotatedHex);

    const markdown = '```annotated-hexdump\n0000 00 01 02 03\n```';

    expect(md.render(markdown)).toBe(
      TOP_AND_TAIL('00000000 00 01 02 03                                    ')
        + '\n',
    );
  });

  test('strict mode rethrows errors', () => {
    const md = markdownIt();
    md.use(annotatedHex, { strict: true });
    const markdown = '```annotated-hexdump\n0 00 01 02 03\n```';

    expect(() => md.render(markdown)).toThrow(Error);
  });

  test('non-strict mode reports errors with annotatedHex', () => {
    const md = markdownIt();
    md.use(annotatedHex, { strict: false });
    const markdown = '```annotated-hexdump\n0 00 01 02 03\n```';
    expect(md.render(markdown)).toBe('<pre><code class="language-annotated-hexdump">0 00 01 02 03\n\nError: Uneven number of bytes found</code></pre>\n');
  });

  test('non-strict mode reports errors with use extendMarkdownIt', () => {
    const md = markdownIt();
    md.use(extendMarkdownIt, { strict: false });
    const markdown = '```annotated-hexdump\n0 00 01 02 03\n```';
    expect(md.render(markdown)).toBe('<pre><code class="language-annotated-hexdump">0 00 01 02 03\n\nError: Uneven number of bytes found</code></pre>\n');
  });

  test('non-strict mode reports errors with extendMarkdownIt call', () => {
    const md = markdownIt();
    extendMarkdownIt(md, { strict: false });
    const markdown = '```annotated-hexdump\n0 00 01 02 03\n```';
    expect(md.render(markdown)).toBe('<pre><code class="language-annotated-hexdump">0 00 01 02 03\n\nError: Uneven number of bytes found</code></pre>\n');
  });
});
