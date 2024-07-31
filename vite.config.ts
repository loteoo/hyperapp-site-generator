import path from 'path';
import { defineConfig, createLogger, Logger } from 'vite';
import vike from 'vike/plugin';

const logger = createLogger();

const customLogger: Logger = {
  ...logger,
  info(msg) {
    const vStr = (pkg) => `v${pkg.version}`;
    const vitePkg = require(path.resolve(__dirname, 'node_modules/vite/package.json'));
    const cliPkg = require('./package.json');
    logger.info(msg.replace(String(vitePkg.name).toUpperCase(), cliPkg.name).replace(vStr(vitePkg), vStr(cliPkg)));
  },
};

export default defineConfig({
  customLogger,
  plugins: [
    vike({
      prerender: {
        noExtraDir: true,
      },
      trailingSlash: false,
    }),
  ],
});
