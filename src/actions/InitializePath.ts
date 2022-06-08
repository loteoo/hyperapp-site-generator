import SetPathStatus from './SetPathStatus';
import { LocationState, State } from '../types';
import loadStatic from '../effects/loadStatic';

interface InitializePathArgs {
  location: LocationState;
  bundle: any;
}

/**
 * Run the "init" action if necessary once per page
 */
const InitializePath = (state: State, { location, bundle }: InitializePathArgs) => {

  // If current path is already initiated, do nothing
  if (state.paths[location.path] === 'ready') {
    return state;
  }

  // If current path doesn't have an "init" to run
  if (typeof bundle?.init !== 'function') {

    // Set as ready
    return SetPathStatus(state, { path: location.path, status: 'ready' })
  }

  const init = bundle?.init;
  const getData = bundle?.data;


  let data;
  
  if (typeof window !== 'undefined') {
    data = window.HYPERSTATIC_DATA?.[location.path]?.data;
  }

  // If init has side-effects
  if (getData && !data) {
    return [
      SetPathStatus(state, { path: location.path, status: 'fetching' }),
      loadStatic({
        location,
        data: getData,
        bundle
      })
    ]
  }

  return init(SetPathStatus(state, { path: location.path, status: 'ready' }), data);
}

export default InitializePath
