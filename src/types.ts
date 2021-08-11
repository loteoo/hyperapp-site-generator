type Action<T> = (state: State, args: T) => State | Array<any>

export interface Options {
  baseUrl?: string;
  loader?: (state: State) => any
  notFound?: (state: State) => any
  fastClicks?: boolean
  eagerLoad?: boolean
  navigationDelay?: number
}

export interface Config {
  node?: string;
  routes: Record<string, Promise<any> | any>;
  options?: Options;
  init: Record<string, any>;
  view: (state: State) => any;
  subscriptions?: (state: State) => any[];
}

export interface LocationState {
  route?: string;
  path: string;
  params: any;
  query: any;
}

export type PathStatus = 'iddle' | 'loading' | 'fetching' | 'ready' | 'error';

export interface State {
  location: LocationState;
  paths: Record<string, PathStatus>;
  [x: string]: any;
}

export interface ViewContext {
  state: State
  options: Options
  meta: any
  getLocation: (path: string) => LocationState
  PreloadPage: Action<string>
  LocationChanged: Action<string>
}

export interface PathInfo extends LocationState {
  status: PathStatus;
  active: boolean;
}
