import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";

export default [
  {
    input: "src/index.ts",
    output: {
      name: "marked-annotated-hexdump",
      file: "lib/index.umd.js",
      format: "umd",
      globals: {
        marked: "marked",
      },
      sourcemap: true,
    },
    external: ["marked"],
    plugins: [typescript()],
  },
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.cjs",
      format: "cjs",
      sourcemap: true,
    },
    external: ["marked"],
    plugins: [typescript()],
  },
  {
    input: "example/index.js",
    output: {
      name: "example",
      file: "example/dist/index.umd.js",
      format: "umd",
    },
    plugins: [commonjs()],
  },
];
