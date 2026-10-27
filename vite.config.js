// Vite builds src/ into docs/ (served by GitHub Pages from the /docs folder).
export default { root: 'src', base: './', publicDir: 'public', build: { outDir: '../docs', emptyOutDir: true, assetsInlineLimit: 0, chunkSizeWarningLimit: 900 } };
