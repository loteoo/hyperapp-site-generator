import InitializePath from '../actions/InitializePath';
import { LocationState } from '../types';

interface LoadStaticArgs {
  bundle: any;
  location: LocationState;
  data: (location: LocationState) => any | Promise<any>;
}

/**
 * Effect runner for the loadStatic effect
 *
 * The loadStatic effect, at build time, will cache the data returned from the `data` promise
 * and save it as a JSON file in the build files.
 *
 * At runtime, it will fetch the pre-saved JSON instead of running the promise
 */
const loadStaticRunner = async (dispatch, { location, data, bundle }: LoadStaticArgs) => {

  // @ts-ignore
  const promise = import.meta.env.MODE === 'production'
    ? fetch(`${location.path}/data.json`).then(res => res.json())
    : data(location);

  const result = await promise;


  window.HYPERSTATIC_DATA = {
    ...window?.HYPERSTATIC_DATA,
    [location.path]: {
      data: result
    }
  }

  dispatch(InitializePath, { location, bundle });
}

const loadStatic = (args: LoadStaticArgs) => [loadStaticRunner, args]

export default loadStatic
