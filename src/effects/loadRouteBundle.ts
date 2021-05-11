import InitializePath from '../actions/InitializePath';
import SetPathStatus from '../actions/SetPathStatus';
import { LocationState } from '../types';

interface LoadRouteBundleArgs {
  route: string;
  path: string;
  meta: any;
  location: LocationState;
}

/**
 * Load the JS bundle for a route, then initialize the path
 */
const loadRouteBundleRunner = async (dispatch, { meta, location }: LoadRouteBundleArgs) => {
  const { route, path } = location
  try {
    if (!meta[route]) {
      // 404
      dispatch(SetPathStatus, { path, status: 'error' })
    } else if (!meta[route].bundle) {
      const bundle = await meta[route].promise;
      meta[route].bundle = bundle
      dispatch(InitializePath, { location, bundle })
    }
  } catch (err) {
    dispatch(SetPathStatus, { path, status: 'error' })
    throw err
  }
}

const loadRouteBundle = (args: LoadRouteBundleArgs) => [loadRouteBundleRunner, args]

export default loadRouteBundle
