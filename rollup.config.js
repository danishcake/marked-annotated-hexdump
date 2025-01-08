import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const plugins = (tsconfig) => [typescript({ tsconfig }), commonjs(), nodeResolve()];

export default [
  {
    input: 'src/marked.ts',
    output: {
      name: 'marked-annotated-hexdump',
      file: 'lib/marked.umd.js',
      format: 'umd',
      sourcemap: true,
    },
    plugins: plugins('tsconfig.json'),
  },
  {
    input: 'src/marked.ts',
    output: {
      file: 'lib/marked.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: plugins('tsconfig.json'),
  },
  {
    input: 'src/marked.ts',
    output: {
      file: 'lib/marked.mjs',
      format: 'esm',
      sourcemap: true,
    },
    plugins: plugins('tsconfig.json'),
  },
  {
    input: 'src/markdown-it.ts',
    output: {
      name: 'markdownit-annotated-hexdump',
      file: 'lib/markdown-it.umd.js',
      format: 'umd',
      sourcemap: true,
    },
    plugins: plugins('tsconfig.json'),
  },
  {
    input: 'src/markdown-it.ts',
    output: {
      file: 'lib/markdown-it.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: plugins('tsconfig.json'),
  },
  {
    input: 'src/markdown-it.ts',
    output: {
      file: 'lib/markdown-it.mjs',
      format: 'esm',
      sourcemap: true,
    },
    plugins: plugins('tsconfig.json'),
  },
  {
    input: 'example/marked/index.js',
    output: {
      name: 'example',
      file: 'example/marked/dist/index.umd.js',
      format: 'umd',
    },
    plugins: plugins('example/marked/tsconfig.json'),
  },
  {
    input: 'example/markdown-it/index.js',
    output: {
      name: 'example',
      file: 'example/markdown-it/dist/index.umd.js',
      format: 'umd',
    },
    plugins: plugins('example/markdown-it/tsconfig.json'),
  },
];
