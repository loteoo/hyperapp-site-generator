import fs from 'fs';
import { renderToString } from 'hyperapp-render';
import path, { dirname } from 'path';
import { defineConfig, mergeConfig, loadConfigFromFile, Plugin, build } from "vite";
import combineHeads from './src/utils/combineHeads';

const shellHtml = `<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>
  </body>
</html>`;

const getExactPath = (path) => {
  for (const suffix of ['.js', '.jsx', '.ts', '.tsx']) {
    const str = `${path}${suffix}`
    if (fs.existsSync(str)) {
      return str;
    }
  }
  return false;
}

const configPath = getExactPath(path.resolve(process.cwd(), 'hyperstatic.config'));

const createLogger = (method: string) => (str) => {
  const vStr = pkg => `${pkg.name} v${pkg.version}`
  const vitePkg = require('vite/package.json');
  const cliPkg = require('./package.json');
  console[method](str.replace(vStr(vitePkg), vStr(cliPkg)))
}

const logLevels = ['log', 'info', 'warn', 'error'] as const;

type CustomLogger = Record<typeof logLevels[number], Function>;

const customLogger = logLevels.reduce((obj, curr) => ({
  ...obj,
  [curr]: createLogger(curr)
}), {} as CustomLogger);

const prerender = (): Plugin => {
  let config;
  return {
    name: 'hyperstatic',
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          const html = await server.transformIndexHtml(req.url, '');
          res.setHeader('Content-Type', 'text/html;charset=utf-8');
          res.end(html);
          next();
        });
      };
    },
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: {
            type: 'module',
            src: '@hyperstatic-app',
          },
          injectTo: 'head',
        }
      ];
    },
    config(conf) {
      config = conf;
    },
    resolveId(id) {
      if (id.endsWith('@hyperstatic-app')) {
        return '\0@hyperstatic-app';
      }
    },
    load(id) {
      if (id === '\0@hyperstatic-app') {
        const rootFile = getExactPath(path.join(process.cwd(), config.hyperstatic.root, 'index'));
        return `
import { app } from 'hyperapp';

${rootFile
  ? `import root from '/${config.hyperstatic.root}';`
  : ''
}

import { hyperstatic } from '${path.resolve(__dirname, 'src')}';

${config.build.ssr
  ? `
const fetch = require('${path.resolve(__dirname, 'node_modules/node-fetch')}')
global.fetch = fetch
  `
  : ''}

const modules = import.meta.glob('/src/pages/**/*.{js,jsx,ts,tsx}');

const routes = Object.entries(modules).reduce((acc, [path, module]) => {
  let route = path
    .replace('/src/pages', '')
    .replace('/index', '')
    .replace(/.jsx|.js|.tsx|.ts/, '')
    .replace('[', ':')
    .replace(']', '');

  if (route === '') {
    route = '/'
  }
  return {
    ...acc,
    [route]: module
  }
}, {});

export const config = hyperstatic({
  ${rootFile
    ? '...root,'
    : ''
  }
  routes: {
    ...routes,
    ${rootFile
      ? '...root.routes'
      : ''
    }
  },
});


if (typeof window !== 'undefined') {
  config.then(app);
}

        `;
      }
    },
    writeBundle: async (_, output) => {
      
      // Build Document Node bundle
      
      // if (false) {
      if (!config.build.ssr) {

        const headImports = [];

        const bundles = Object.keys(output).map(key => output[key]);

        const jsEntries = bundles.filter((bundle: any) => bundle.isEntry);
        for (const bundle of jsEntries as any) {
          headImports.push({
            tag: 'script',
            props: {
              async: true,
              type: 'module',
              crossorigin: true,
              src: `/${bundle.fileName}`
            },
            children: []
          });
          for (const chunkFileName of bundle.imports) {
            headImports.push({
              tag: 'link',
              props: {
                rel: 'modulepreload',
                href: `/${chunkFileName}`
              },
              children: []
            });
          }
        }

        const cssFiles = bundles.filter(bundle => bundle.fileName.endsWith('.css'));
        for (const cssFile of cssFiles) {
          headImports.push({
            tag: 'link',
            props: {
              rel: 'stylesheet',
              href: `/${cssFile.fileName}`
            },
            children: []
          })
        }

        const spaConfig = config;
        
        await build({
          ...config,
          publicDir: false,
          build: {
            outDir: 'dist/.hyperstatic',
            ssr: true,
            rollupOptions: {
              input: {
                app: `@hyperstatic-app`,
              },
            },
          },
        });

        const module = require(path.resolve(process.cwd(), 'dist/.hyperstatic/app.js'));
        const fullOutDir = path.resolve(process.cwd(), spaConfig.build.outDir ?? 'dist');

        const {
          init: [state],
          view,
          head: globalHead,
          data: globalData,
          meta,
          LocationChanged,
          SetPathStatus,
        } = await module.config;

        const renreredPaths = [
          '/'
        ];

        const renderPage = async (url) => {

          renreredPaths.push(url);

          console.log(`Rendering ${url}...`)

          let dataToInject;

          if (globalData) {
            dataToInject = {
              global: globalData
            }
          }

          // console.log('state 1', { ...state })

          let [initialState] = LocationChanged({ ...state }, url);

          // console.log('state 2', initialState)

          const route = initialState.location.route;

          if (!meta[route].bundle) {
            const bundlePromise = meta[route].promise;
            const bundle = await bundlePromise();
            meta[route].bundle = bundle;
          }

          initialState = SetPathStatus(initialState, { path: url, status: 'ready' })

          // console.log('state 3', initialState)

          const {
            head,
            init,
            data: getPageData
          } = meta[route].bundle;

          let pageData;

          if (getPageData && init) {
            pageData = await getPageData(initialState.location);
            dataToInject = {
              ...dataToInject,
              [url]: {
                data: pageData
              }
            }
          }

          if (init) {
            initialState = init(initialState, pageData);
          }

          // console.log('state 4', initialState)

          const rootVNode = view(initialState);

          let html = renderToString(rootVNode.tag === 'body' ? rootVNode.children : rootVNode);
          
          html = shellHtml.replace('</body>', `${html}</body>`);

          const headTags = combineHeads(
            globalHead?.(initialState),
            head?.(initialState)
          );

          // console.log(headTags.find(t => t.key === 'title').children)

          const headHtml = renderToString(headTags);
          html = html.replace('</head>', `${headHtml}</head>`);
          
          const importsHtml = renderToString(headImports);
          html = html.replace('</head>', `${importsHtml}</head>`);

          const pattern = /href="(.*?)"/g;
          const matches = html.match(pattern) ?? [];

          const internalLinks = matches
            .map(hrefAttr => hrefAttr.slice(6, -1))
            .map(href => href.includes('#') ? href.split('#')[0] : href)
            .map(href => href.includes('?') ? href.split('?')[0] : href)
            .filter(href => href.startsWith('/') && !href.includes('.'));
          
          const pageDir = path.resolve(path.join(fullOutDir, url));

          fs.mkdirSync(pageDir, { recursive: true });

          if (pageData) {
            const json = JSON.stringify(pageData);
            fs.writeFileSync(
              path.resolve(pageDir, 'data.json'),
              json,
              'utf-8'
            );
          }

          if (dataToInject) {

            const dataScript = `
<script>
window.HYPERSTATIC_DATA = ${JSON.stringify(dataToInject)}
</script>
`;
            html = html.replace('</body>', `${dataScript}</body>`);
          }

          const fielPath = path.resolve(pageDir, 'index.html');

          console.log(`Saving ${url}...`);

          fs.writeFileSync(
            fielPath,
            html,
            'utf-8'
          );

          const newLinks = internalLinks.filter(
            href => !renreredPaths.includes(href)
          );

          await Promise.all(newLinks.map(renderPage));
        }

        await renderPage('/');

        console.log('Build complete!')

      }
    }
  }
}

const defaultConfig = defineConfig({
  // @ts-ignore
  customLogger,
  plugins: [
    prerender()
  ],
  build: {
    // cssCodeSplit: false,
    rollupOptions: {
      input: {
        app: `@hyperstatic-app`,
      },
    },
  },
  ssr: {
    noExternal: true
  },
  hyperstatic: {
    root: 'src',
    pages: 'src/pages',
  },
});

const mergeConfigFiles = async (env) => {
  let config = defaultConfig;

  if (configPath) {
    const loadResult = await loadConfigFromFile(env, configPath);
    if (loadResult) {
      config = mergeConfig(config, loadResult.config);
    }
  }

  return config
}


export default mergeConfigFiles;