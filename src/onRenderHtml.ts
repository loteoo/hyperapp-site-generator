import { escapeInject, dangerouslySkipEscape } from 'vike/server';
import { renderToString } from 'hyperapp-render';
import { createCombinedInitAction } from './router';

export default async function onRenderHtml(pageContext: any) {
  const { Page, config } = pageContext;
  const { init, Layout } = config;
  let FullPage = Page;
  if (Layout) {
    FullPage = (state) => Layout(state, Page(state));
  }
  const InitAction = createCombinedInitAction(init, pageContext);
  const viewHtml = dangerouslySkipEscape(renderToString(FullPage, InitAction({})[0], InitAction));
  return escapeInject`<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <div id="app">${viewHtml}</div>
      </body>
    </html>`;
}
