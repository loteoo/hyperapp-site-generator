import { Effect } from "hyperapp";
import { State } from "../types";

interface NavigateArgs {
  to: string;
  delay?: number;
}

/**
 * Trigger a page navigation
 */
const navigateRunner = (dispatch, { to, delay = 0 }: NavigateArgs) => {
  dispatchEvent(new CustomEvent("navigationstart"))
  setTimeout(() => {
    // Internal links
    if (to.startsWith('/')) {
      history.pushState(null, '', to)
      dispatchEvent(new CustomEvent("pushstate"))
    } else {

      // Handle external links
      window.location.href = to
    }
  }, delay)
}

const navigate = (args: NavigateArgs): Effect<State, NavigateArgs> => [navigateRunner, args]

export default navigate
