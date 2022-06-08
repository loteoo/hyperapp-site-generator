import { h } from 'hyperapp'
import { match } from "path-to-regexp";
import InitializePath from './actions/InitializePath';
import SetPathStatus from './actions/SetPathStatus';
import loadRouteBundle from './effects/loadRouteBundle';
import onLinkEnteredViewPort from './subscriptions/onLinkEnteredViewPort';
import onRouteChanged from './subscriptions/onRouteChanged';
import parseQueryString from './utils/parseQueryString';
import provide from './utils/provide'
import Router from './components/Router';
import { Config, LocationState, Options, State } from './types';
import updateHead from './effects/updateHead';

const defaultEagerLoad = () => {
  if (typeof window !== 'undefined') {
    let connection = navigator?.connection as any;
    if (connection) {
      // Check if data-saver is enabled
      if (connection.saveData) {
        return false
      }
      // Check if connection is slow
      if (/2g/.test(connection.effectiveType)) {
        return false
      }
    }
  }
  return true
}

const hyperstatic = async ({
    init = (state) => state,
    view = () => Router() as any,
    node = typeof window !== 'undefined' ? document.body : { nodeName: 'body' } as Node,
    subscriptions = () => [],
    dispatch,

    head,
    data: getData,
    routes = {},
    options: _options = {},
  }: Config) => {

  const options: Options = {
    eagerLoad: 'auto',
    ..._options
  }

  const shouldEagerLoad = options.eagerLoad === 'auto' ? defaultEagerLoad() : options.eagerLoad;

  // Internal values saved for each routes
  const meta = Object.keys(routes).reduce((obj, route) => {
    obj[route] = {
      matcher: match(route),
      promise: routes[route],
      bundle: null
    }
    return obj
  }, {});

  // Utility function to parse data from paths
  const getLocation = (pathname: string): LocationState => {
    const [path, qs] = pathname.split('?')
    let matchedRoute;
    let params = {};
    for (const route of Object.keys(routes)) {
      const maybeMatch = meta[route].matcher(path)
      if (maybeMatch) {
        matchedRoute = route;
        params = maybeMatch.params;
        break
      }
    }
    return {
      route: matchedRoute,
      path,
      params,
      query: qs ? parseQueryString(qs) : {},
    }
  }

  // Preload page Action
  const PreloadPage = (state: State, href: string) => {
    const location = getLocation(href);
    const { route, path } = location;

    // If invalid path (404)
    if (!route) {
      return SetPathStatus(state, { path, status: 'error' });
    }

    const bundle = meta[route]?.bundle;

    // If target route's bundle isn't loaded, load it
    if (!bundle) {
      return [
        SetPathStatus(state, { path, status: 'loading' }),
        loadRouteBundle({ location, meta })
      ]
    }

    return InitializePath(state, { location, bundle });
  }

  // Location changed action
  const LocationChanged = ({ location: _, ...state }: State, pathname: string) => {
    const location = getLocation(pathname)
    const nextState = { location, ...state }
    return PreloadPage(nextState, pathname);
  }

  const initialPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
  
  let data;
  if (getData) {
    if (typeof window !== 'undefined' && window?.HYPERSTATIC_DATA?.global) {
      data = window?.HYPERSTATIC_DATA?.global;
    } else {
      data = await getData();
    }
  }

  const initialInternalState = { paths: {} } as State;
  let initAction = LocationChanged(initialInternalState, initialPath);
  initAction = Array.isArray(initAction) ? initAction : [initAction];

  let userInitAction = init(initAction[0], data);
  const [userInitedState, ...fxs] = Array.isArray(userInitAction) ? userInitAction : [userInitAction];

  initAction[0] = userInitedState;
  initAction.push(...fxs);

  return {

    // hyperapp
    init: initAction,
    view: (state) => provide(
      { state, meta, options, getLocation, PreloadPage },
      h(node.nodeName.toLowerCase(), {}, view(state))
    ),
    subscriptions: (state: State) => [
      ...subscriptions(state),
      onRouteChanged({
        action: LocationChanged
      }),
      shouldEagerLoad && onLinkEnteredViewPort({
        selector: 'a[data-status=iddle]',
        action: PreloadPage
      }),
      updateHead(head, meta, state)
    ],
    node,
    dispatch,

    // hyperstatic
    head,
    data,
    routes,
    options,

    meta,
    LocationChanged,
    SetPathStatus,
  } as any
}

export default hyperstatic
