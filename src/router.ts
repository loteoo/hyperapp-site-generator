import { Action, Subscription } from 'hyperapp';
import { PageContext } from 'vike/types';
import { State } from './types';

export type InternalPath = `/${string}`;

export interface Location {
  path: InternalPath;
  query: Record<string, unknown>;
}

// Get current location
export const getLocation = (ctx: PageContext): Location => {
  const { pathname, search } = ctx.urlParsed;
  const query: Record<string, unknown> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    query[key] = value;
  }
  return {
    path: pathname as InternalPath,
    query,
  };
};

// Route change Subscription
export const onPageNavigation: Subscription<State> = [
  (dispatch) => {
    const handleLocationChange = (ev: CustomEvent) => {
      dispatch(ev.detail);
    };
    addEventListener('pagenavigation', handleLocationChange);
    return () => {
      removeEventListener('pagenavigation', handleLocationChange);
    };
  },
  null,
];


export const createCombinedInitAction = (action: Action<State> | undefined, ctx: PageContext) => {
  const location = getLocation(ctx);
  const data = ctx.data;
  if (!action) {
    return (state) => [{ ...state, location, data }];
  }
  return (state) => [].concat(action({ ...state, location, data }, ctx));
};
