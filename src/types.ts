type Action<T> = (state: State, args: T) => State | Array<any>

export interface Options {
  initialPath?: string;
  baseUrl?: string;
  loader?: (state: State) => any
  fastClicks?: boolean
}

export interface Config {
  routes: Record<string, Promise<any>>;
  options?: Options;
  init: Record<string, any>;
  view: (state: State) => any;
  node: Element;
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