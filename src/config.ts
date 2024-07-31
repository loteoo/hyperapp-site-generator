import { Config } from 'vike/types';
// import onRenderHtml from './onRenderHtml'
// import onRenderClient from './onRenderClient'

const config: Config = {
  name: 'hyperstatic',
  onRenderHtml: 'import:hyperstatic/src/onRenderHtml',
  onRenderClient: 'import:hyperstatic/src/onRenderClient',
  clientRouting: true,
  meta: {
    init: {
      env: {
        server: true,
        client: true,
      },
    },
    subscriptions: {
      env: {
        client: true,
      },
    },
    Layout: {
      env: {
        server: true,
        client: true,
      },
    },
  },
};

export default config;
