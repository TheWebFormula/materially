import build from '@thewebformula/lithe/build';
import esbuild from 'esbuild';
// import { readFile, writeFile } from 'node:fs/promises';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import generate from '@thewebformula/materially/theme-generator';

const asyncGzip = promisify(gzip);
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
    // build.onEnd(async () => {
    //   await gzipFile('dist/material.js', 'dist/material.js.gz');
    // })
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

build({
  devWarnings: false,
  spa: true,
  chunks: false,
  gzip: false,
  basedir: 'docs/',
  outdir: 'dist/',
  securityLevel: 0,
  copyFiles: [
    { from: 'docs/_headers', to: 'dist/' },
    { from: 'docs/favicon.ico', to: 'dist/' },
    { from: 'docs/woman.jpg', to: 'dist/' },
    { from: 'docs/icons.woff2', to: 'dist/' },
    { from: 'docs/outlined-icons-variable.woff2', to: 'dist/' },
    { from: 'docs/rounded-icons.woff2', to: 'dist/' },
    { from: 'docs/highlight-11.10.0.js', to: 'dist/' },
    {
      from: 'docs/routes/**/(?!page)*.html',
      to: 'dist/routes/',
      transform({ content, outputFileNames }) {
        if (outputFileNames) return content.replace(cssTagRegex, () => {
          const filename = outputFileNames
            .filter(v => !!v.entryPoint)
            .find(v => v.entryPoint.endsWith('app.css')).output.split('/').pop();
          return `<link href="/${filename}" rel="stylesheet">`;
        });
        return content;
      }
    },
    { from: 'docs/manifest.json', to: 'dist/' },
    { from: 'docs/icons/*', to: 'dist/icons/' }
  ],
  onStart() {
    // build separate file for iframe pages without app code.
    context.rebuild();
  }
})
  .then(() => { // TODO not sure what is going on. The process stop existing on npm run build at some point
    esbuild.buildSync({
      entryPoints: ['src/styles.css'],
      bundle: true,
      outfile: 'dist/material.css',
      minify: true
    });
    if (process.env.NODE_ENV === 'production') process.exit();
  });

// async function gzipFile(file, rename) {
//   const result = await asyncGzip(await readFile(file));
//   await writeFile(rename, result);
// }
