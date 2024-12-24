import { glob } from 'node:fs/promises';
import { readFile, writeFile } from 'node:fs/promises';
import build from '@thewebformula/lithe/build';
import esbuild from 'esbuild';
import generate from '@thewebformula/materially/theme-generator';

const cssFilterRegex = /\.css$/;
const cssTagRegex = /<\s*link[^>]*href="\.?\/?app.css"[^>]*>/;


const plugin = {
  name: 'plugin',
  setup(build) {
    build.onLoad({ filter: cssFilterRegex }, async args => {
      const contextCss = await esbuild.build({
        entryPoints: [args.path],
        bundle: true,
        write: false,
        minify: true,
        loader: { '.css': 'css' }
      });
      const contents = `
        const styles = new CSSStyleSheet();
        styles.replaceSync(\`${contextCss.outputFiles[0].text}\`);
        export default styles;`;
      return { contents };
    })
  }
};
const context = await esbuild.context({
  entryPoints: ['index.js'],
  bundle: true,
  outfile: 'dist/material.js',
  format: 'esm',
  target: 'esnext',
  loader: { '.html': 'text' },
  plugins: [plugin],
  minify: true
});

if (process.env.NODE_ENV === 'production') generate({
  coreColors: {
    primary: '#6750A4',
    // secondary: '#625B71',
    // tertiary: '#7D5260',
    // neutral: '#67616f',
    // neutralVariant: '#605666',
    // error: '#B3261E'
  },
  // customColors: [
  //   {
  //     name: 'customColor',
  //     color: '#5b7166'
  //   }
  // ]
}, './docs/colorTokens.css');

// build({
//   devWarnings: false,
//   spa: true,
//   chunks: false,
//   gzip: false,
//   basedir: 'docs/',
//   outdir: 'dist/',
//   securityLevel: 0,
//   copyFiles: [
//     { from: 'docs/_headers', to: 'dist/' },
//     { from: 'docs/robots.txt', to: 'dist/' },
//     { from: 'docs/sitemap.xml', to: 'dist/' },
//     { from: 'docs/favicon.ico', to: 'dist/' },
//     { from: 'docs/woman.jpg', to: 'dist/' },
//     { from: 'docs/icons.woff2', to: 'dist/' },
//     { from: 'docs/outlined-icons-variable.woff2', to: 'dist/' },
//     { from: 'docs/rounded-icons.woff2', to: 'dist/' },
//     { from: 'docs/highlight-11.10.0.js', to: 'dist/' },
//     {
//       from: 'docs/routes/**/(?!page)*.html',
//       to: 'dist/routes/',
//       transform({ content, outputFileNames }) {
//         if (outputFileNames) return content.replace(cssTagRegex, () => {
//           const filename = outputFileNames
//             .filter(v => !!v.entryPoint)
//             .find(v => v.entryPoint.endsWith('app.css')).output.split('/').pop();
//           return `<link href="/${filename}" rel="stylesheet">`;
//         });
//         return content;
//       }
//     },
//     { from: 'docs/manifest.json', to: 'dist/' },
//     { from: 'docs/icons/*', to: 'dist/icons/' }
//   ],
//   onStart() {
//     // build separate file for iframe pages without app code.
//     context.rebuild();
//   }
// })
//   .then(() => { // TODO not sure what is going on. The process stop existing on npm run build at some point
//     esbuild.buildSync({
//       entryPoints: ['src/styles.css'],
//       bundle: true,
//       outfile: 'dist/material.css',
//       minify: true
//     });
//     if (process.env.NODE_ENV === 'production') process.exit();
//   });


build({
  entryPoint: 'docs/app.js',
  entryPointCSS: 'docs/app.css',
  copy: [
    { from: 'docs/_headers', to: 'dist/' },
    { from: 'docs/robots.txt', to: 'dist/' },
    { from: 'docs/sitemap.xml', to: 'dist/' },
    { from: 'docs/favicon.ico', to: 'dist/' },
    { from: 'docs/woman.jpg', to: 'dist/' },
    { from: 'docs/icons.woff2', to: 'dist/' },
    { from: 'docs/outlined-icons-variable.woff2', to: 'dist/' },
    { from: 'docs/rounded-icons.woff2', to: 'dist/' },
    { from: 'docs/highlight-11.10.0.js', to: 'dist/' },
    { from: 'docs/manifest.json', to: 'dist/' },
    { from: 'docs/icons/*', to: 'dist/icons/' }
  ],
  securityLevel: 0,
  devWarnings: false,
  async onStart() {
    // build separate file for iframe pages without app code.
    context.rebuild();
  },
  // async onEnd({ metafile }) {
  //   const outputsEntries = Object.entries(metafile.outputs);
  //   for await (const entry of glob('./docs/routes/**/*.html')) {
  //     if (metafile.inputs[entry]) continue;

  //     const content = await readFile(entry, 'utf-8');
  //     const contentUpdated = content.replace(cssTagRegex, () => {
  //       const filename = outputsEntries
  //         .filter(([out, item]) => !!item.entryPoint)
  //         .find(([out, item]) => item.entryPoint.endsWith('app.css'))[0].split('/').pop();
  //       return `<link href="/${filename}" rel="stylesheet">`;
  //     });
  //     await writeFile(entry.replace(/^docs/, 'dist'), contentUpdated, 'utf-8');
  //   }
  // }
});
