import { app, h } from 'hyperapp'
import { match } from "path-to-regexp";
import InitializePath from './actions/InitializePath';
import SetPathStatus from './actions/SetPathStatus';
import loadRouteBundle from './effects/loadRouteBundle';
import onLinkEnteredViewPort from './subscriptions/onLinkEnteredViewPort';
import onRouteChanged from './subscriptions/onRouteChanged';
import parseQueryString from './utils/parseQueryString';
import provide from './utils/provide'
import { Config, LocationState, Options, State } from './types';



const hyperstatic = ({ routes, options: userOptions, init, view, subscriptions = (_s) => [], ...rest }: Config) => {

  const options: Options = {
    eagerLoad: true,
    ...userOptions
  }

  // Internal values saved for each routes
  const meta = Object.keys(routes).reduce((obj, route) => {
    obj[route] = {
      matcher: match(route),
      promise: routes[route],
      bundle: null
    }
    return obj
  }, {})

  // Utility function to parse data from paths
  const getLocation = (pathname: string): LocationState => {
    const [path, qs] = pathname.split('?')
    let matchedRoute: string | undefined;
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
    const location = getLocation(href)
    const { route, path } = location

    // If invalid path (404)
    if (!route) {
      return SetPathStatus(state, { path, status: 'error' })
    }

    const bundle = meta[route]?.bundle;

    // If target route's bundle isn't loaded, load it
    if (!bundle) {
      return [
        SetPathStatus(state, { path, status: 'loading' }),
        loadRouteBundle({ route, path, meta, location })
      ]
    }

    return InitializePath(state, { location, bundle })
  }

  // Location changed action
  const LocationChanged = ({ location: _, ...state }: State, pathname: string) => {
    const location = getLocation(pathname)
    const nextState = { location, ...state }
    return PreloadPage(nextState, pathname)
  }

  const initialPath = window.location.pathname + window.location.search;

  let initialState = Array.isArray(init) ? init[0] : init;

  initialState = {
    ...initialState,
    paths: {},
  } as State;

  let initAction = LocationChanged(initialState, initialPath);

  if (Array.isArray(init)) {
    const effects = init.slice(1)
    initAction = Array.isArray(initAction) ? initAction.concat(effects) : [initAction, ...effects]
  }

  return app({
    ...rest,
    init: initAction,
    view: (state) => provide(
      { state, meta, options, getLocation, PreloadPage },
      h('div', { id: 'hyperstatic' }, view(state))
    ),
    subscriptions: (state) => [
      ...subscriptions(state),
      onRouteChanged({
        action: LocationChanged
      }),
      options.eagerLoad && onLinkEnteredViewPort({
        selector: 'a[data-status=iddle]',
        action: PreloadPage
      })
    ],
    node: <Node>document.getElementById('hyperstatic')
  })
}

export default hyperstatic
