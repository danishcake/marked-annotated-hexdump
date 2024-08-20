import { extractTokens } from '../src/common';
import { DataToken } from '../src/inputTokens';

describe('common', () => {
  test('can extract hex datatoken', () => {
    const markdown = 'AA 01 02 03';
    const tokens = extractTokens(markdown);
    expect(tokens.length).toBe(1);
    expect(tokens[0]).toBeInstanceOf(DataToken);
  });
});
