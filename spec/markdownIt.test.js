import markdownIt from 'markdown-it';
import { extendMarkdownIt } from '../src/markdown-it';
import { TOP_AND_TAIL } from './helper.ts';

/**
 * Warning: This is significantly more lightly tested, as this is primarily a marked extension
 *
 * See marked.test.js for a /lot/ more tests
 */
describe('markdown-it-extension', () => {
  test('single line and four bytes', () => {
    const md = markdownIt();
    extendMarkdownIt(md);

    const markdown = '```annotated-hexdump\n0000 00 01 02 03\n```';

    expect(md.render(markdown)).toBe(
      TOP_AND_TAIL('00000000 00 01 02 03                                    ')
        + '\n',
    );
  });
});
