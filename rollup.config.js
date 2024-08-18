import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'src/marked.ts',
    output: {
      name: 'marked-annotated-hexdump',
      file: 'lib/marked.umd.js',
      format: 'umd',
      globals: {
        marked: 'marked',
      },
      sourcemap: true,
    },
    external: ['marked'],
    plugins: [typescript()],
  },
  {
    input: 'src/marked.ts',
    output: {
      file: 'lib/marked.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    external: ['marked'],
    plugins: [typescript()],
  },
  {
    input: 'src/markdown-it.ts',
    output: {
      name: 'markdownit-annotated-hexdump',
      file: 'lib/markdown-it.umd.js',
      format: 'umd',
      globals: {
        marked: 'markdownit ',
      },
      sourcemap: true,
    },
    external: ['markdownit'],
    plugins: [typescript()],
  },
  {
    input: 'src/markdown-it.ts',
    output: {
      file: 'lib/markdown-it.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    external: ['markdownit'],
    plugins: [typescript()],
  },
  {
    input: 'example/marked/index.js',
    output: {
      name: 'example',
      file: 'example/marked/dist/index.umd.js',
      format: 'umd',
    },
    plugins: [commonjs()],
  },
  {
    input: 'example/markdown-it/index.js',
    output: {
      name: 'example',
      file: 'example/markdown-it/dist/index.umd.js',
      format: 'umd',
    },
    plugins: [commonjs()],
  },
];
