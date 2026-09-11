import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    // Moon syncs TS project references, which requires `composite: true` in
    // tsconfig.json. rollup-plugin-dts compiles only the entry file, and a
    // composite program rejects every imported file not listed as a root
    // name (TS6307), so disable composite for the dts pass only.
    compilerOptions: { composite: false },
  },
  external: ['react', 'react-dom'],
  sourcemap: true,
  minify: true,
  clean: true,
  outDir: 'dist',
});
