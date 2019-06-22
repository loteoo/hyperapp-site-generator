import queryString from 'query-string'
import {LoadRoute, ChangeLocation} from './effects'


// Sets a value to the given key in the state
export const ParseUrl = (state, {path, query}) => {

  // Ignore trailing slashes EXPEPT for home page
  const withoutTrailingSlash = path !== '/' ? path.replace(/\/$/, '') : path
  const routes = Object.keys(state.routes).map(route => state.routes[route])
  const matchedRoute = routes.find(route => route.pattern.match(withoutTrailingSlash))
  const match = matchedRoute && matchedRoute.pattern.match(withoutTrailingSlash)
  const loaded = matchedRoute && matchedRoute.view

  // Set
  const next = {
    ...state,
    location: {
      route: matchedRoute && matchedRoute.route,
      params: match || {},
      queryParams: queryString.parse(query),
      path: withoutTrailingSlash
    }
  }

  return (matchedRoute && !loaded) ? TriggerRouteLoad(next, path) : next
}


const ViewLoaded = (state, {route, view, Init}) => {

  const loaded = {
    ...state,
    routes: {
      ...state.routes,
      [route]: {
        ...state.routes[route],
        view,
        loading: false
      }
    }
  }

  const withFirstRender = window.navigator.userAgent === 'puppeteer'
    ? {
      ...loaded,
      routes: {
        ...loaded.routes,
        [route]: {
          ...loaded.routes[route],
          firstRender: view(loaded)
        }
      }
    }
    : loaded


  const initialized = Init ? Init(withFirstRender) : withFirstRender


  return initialized
}


// Navigate action
export const Navigate = (state, to) => {

  return to
    ? [state, ChangeLocation({to})]
    : state
}

export const TriggerRouteLoad = (state, path) => {

  const routes = Object.keys(state.routes).map(route => state.routes[route])
  const matchedRoute = routes.find(route => route.pattern.match(path))

  console.log('TriggerRouteLoad')

  return [
    {
      ...state,
      routes: {
        ...state.routes,
        [matchedRoute.route]: {
          ...matchedRoute,
          loading: true
        }
      }
    },
    LoadRoute({
      action: ViewLoaded,
      route: matchedRoute.route,
      viewPromise: matchedRoute.viewPromise
    })
  ]
}
