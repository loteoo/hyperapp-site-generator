import { Dispatch, Action, Subscription, VNode, Dispatchable } from 'hyperapp';

type EmptyState = Record<string, any>;

export interface State extends EmptyState {
  location: LocationState;
  paths: Record<string, PathStatus>;
}

export interface Options {
  baseUrl?: string;
  fastClicks?: boolean;
  eagerLoad?: boolean | 'auto';
  navigationDelay?: number;
}

export interface Config {
  // Hyperapp options
  init?: (state: State, data: any) => Dispatchable<EmptyState>;
  view?: (state: State) => VNode<State>;
  node?: Node;
  subscriptions?: (state: State) => (boolean | undefined | Subscription<State>)[];
  dispatch?: (dispatch: Dispatch<State>) => Dispatch<State>;

  // Hyperstatic options
  head?: (state: State) => VNode<State>;
  data?: () => Promise<any>;
  routes?: Record<string, Promise<VNode<State> | any>>;
  options?: Options;
}

export interface LocationState {
  route?: string;
  path: string;
  params: any;
  query: any;
}

export type PathStatus = 'iddle' | 'loading' | 'fetching' | 'ready' | 'error';


export interface ViewContext {
  state: State
  options: Options
  meta: any
  getLocation: (path: string) => LocationState
  PreloadPage: Action<State, string>
  LocationChanged: Action<State, string>
}

export interface PathInfo extends LocationState {
  status: PathStatus;
  active: boolean;
}
