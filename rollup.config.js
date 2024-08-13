import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: 'src/index.ts',
    output: {
      name: 'marked-annotated-hexdump',
      file: 'lib/index.umd.js',
      format: 'umd',
      globals: {
        marked: 'marked',
      },
    },
    external: ['marked'],
    plugins: [typescript()]
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'lib/index.cjs',
      format: 'cjs',
    },
    external: ['marked'],
    plugins: [typescript()]
  },
];
