import puppeteer from 'puppeteer'
import fse from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import { replaceInFile } from 'replace-in-file'
import handler from 'serve-handler'
import http from 'http'
import events from 'events'
import yargs from 'yargs'

const createStaticServer = (port, distFolder) =>
  http.createServer((request, response) =>
    handler(request, response, {
      public: distFolder,
      rewrites: [
        { source: '**/*', 'destination': '/index.html' }
      ]
    })
  ).listen(port)

const renderPages = async () => {

  const argv = yargs(process.argv.slice(2))
    .usage('Usage: $0 [options]')
    .describe('port', 'Port to use for the prerendering server')
    .alias('p', 'port')
    .describe('dist', 'Directory containing built static files from the bundler')
    .alias('d', 'dist')
    .describe('entry', 'Entry page to start crawling the site from')
    .alias('e', 'entry')
    .describe('extra', 'Comma separated list of paths to render if they aren\'t automatically crawled')
    .alias('x', 'extra')
    .describe('no-sandbox', 'Do not run puppeteer in a sandbox')
    .argv;

  // Get command line arguments with defaults
  const port = argv.port ? Number(argv.port) : 54321
  const distFolder = argv.dist ? String(argv.dist) : 'dist'
  const entryPoint = argv.entry ? String(argv.entry) : '/'
  const extraPages = typeof argv.extra === 'string' ? argv.extra.split(',') : []
  const puppeteerArgs = argv.sandbox === false ? [ '--no-sandbox' ] : []

  try {

    // Spin up a static server to use for prerendering with puppeteer
    await createStaticServer(port, distFolder)

    console.log('Rendering site...')

    const baseUrl = `http://localhost:${port}`

    const cache = {}

    const renderEvents = new events.EventEmitter();

    // Initial render queue
    const renderQueue = [
      entryPoint,
      ...extraPages
    ]

    const browser = await puppeteer.launch({ headless: true, args: puppeteerArgs });
    const page = await browser.newPage();

    await page.setUserAgent('puppeteer');

    await page.exposeFunction('registerPath', (path: string) => {
      if (!renderQueue.includes(path)) {
        console.log(`Found path ${path}, adding to render queue`);
        renderQueue.push(path);
      }
    });

    await page.exposeFunction('cacheData', (key: string, data: any) => {
      cache[key] = data;
    });

    await page.exposeFunction('pathRendered', (path: string) => {
      renderEvents.emit(`${path}-rendered`);
    });

    // Load page
    await page.goto(`${baseUrl}${entryPoint}`, { waitUntil: 'networkidle0' });

    // Pre-render loop
    for (let i = 0; i < renderQueue.length; i++) {
      const pagePath = renderQueue[i]

      console.log(`Rendering page: ${pagePath} ...`)

      page.on('pageerror', function (err) {
        console.log(`Runtime error in page: "${pagePath}" - Error: ${err.toString()}`)
        console.error(err)
        process.exit(1)
      })

      const pathRendered = new Promise<void>((resolve) => {
        renderEvents.once(`${pagePath}-rendered`, resolve)
      })

      // Navigate to the page client-side
      await page.evaluate((path) => {
        window.history.pushState(null, '', path)
        window.dispatchEvent(new CustomEvent("pushstate"))
      }, pagePath)

      // Wait for page to render
      await pathRendered;

      // Get HTML string from page DOM.
      const html = await page.content();

      // Convert URI path to absolute disk path in the output dir
      const pageFilePath = pagePath === '/' ? '/index.html' : `${pagePath}/index.html`
      const pageFileAbsolutePath = path.join(process.cwd(), distFolder, pageFilePath)

      // Remove basepath from rendered HTML
      // Ex: <script src="http://localhost/about" /> becomes just <script src="/about" />
      const cleanedUpHtml = html.replace(new RegExp(baseUrl, 'gi'), '')

      await fse.outputFile(pageFileAbsolutePath, cleanedUpHtml)
      console.log(`Page created: ${pageFileAbsolutePath}`)
    }

    await browser.close();

    console.log('Pages rendered!')

    console.log('Saving loadStatic data cache...')

    const cacheKeys = Object.keys(cache)

    let cacheUrlArray = []

    for (let i = 0; i < cacheKeys.length; i++) {
      const key = cacheKeys[i]
      const data = cache[key]
      const fileName = crypto.createHash('md5').update(key).digest('hex') + '.json'
      const filePath = '/data/' + fileName

      cacheUrlArray.push(filePath)

      const dataAbsolutePath = path.join(distFolder, filePath)
      await fse.outputFile(dataAbsolutePath, JSON.stringify(data))
      console.log(`Data saved: ${dataAbsolutePath}`)
    }

    const cacheFetchUrls = cacheKeys.reduce((obj, curr, i) => ({
      ...obj,
      [curr]: cacheUrlArray[i]
    }), {})

    console.log('Updating pages...')

    const inlineData = {
      cache: cacheFetchUrls,
    }

    const results = await replaceInFile({
      files: distFolder + '/**/*.html',
      from: '</body>',
      to: `<script>window.HYPERSTATIC_DATA = ${JSON.stringify(inlineData)}</script></body>`,
      countMatches: true
    })
    console.log(`${results.length} pages updated!`)

  } catch (error) {
    console.error(error)
    process.exit(1)
  }

  console.log('Rendering complete! 🎉')

  process.exit(0)
}

export default renderPages
