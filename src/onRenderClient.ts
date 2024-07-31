import { app } from 'hyperapp';
import { createCombinedInitAction, onPageNavigation } from './router';

let CurrPage;
let CurrLayout;
export default async function onRenderClient(pageContext) {
  const { Page, config, isHydration } = pageContext;
  const { init, Layout } = config;
  CurrPage = Page;
  CurrLayout = Layout;

  const InitAction = createCombinedInitAction(init, pageContext);

  if (!isHydration) {
    dispatchEvent(new CustomEvent('pagenavigation', { detail: InitAction }));
    return;
  }

  let FullPage;
  if (CurrLayout) {
    FullPage = (state) => CurrLayout(state, CurrPage(state));
  } else {
    FullPage = CurrPage;
  }
  app({
    init: InitAction,
    view: FullPage,
    node: document.getElementById('app'),
    subscriptions: () => [onPageNavigation],
  });
}
