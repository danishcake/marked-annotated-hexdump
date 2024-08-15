import markedEslintConfig from '@markedjs/eslint-config';
import globals from 'globals';

export default [
  {
    ignores: ['**/lib', '**/dist'],
  },
  ...markedEslintConfig,
  {
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
