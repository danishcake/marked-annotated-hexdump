import { marked } from 'marked';
import thisExtension from '../src/index.js';

describe('this-extension', () => {
  beforeEach(() => {
    marked.setOptions(marked.getDefaults());
  });

  test('no options', () => {
    marked.use(thisExtension());
    const markdown = '```annotated-hexdump\n0000 00 01 02 03\n```';
    expect(marked(markdown)).toBe('<pre><code class="language-annotated-hexdump">0000 00 01 02 03</code></pre>');
  });

  test('code with different infostring', () => {
    marked.use(thisExtension());
    const markdown = '```different\nABC\n```';
    expect(marked(markdown)).toBe('<pre><code class="language-different">ABC\n</code></pre>\n');
  });

  test('markdown not using this extension', () => {
    marked.use(thisExtension());
    expect(marked('not example markdown')).not.toBe('<p>example html</p>\n');
  });
});
