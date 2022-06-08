import { app, h } from "hyperapp";
import combineHeads from "../utils/combineHeads";
import htmlToVdom from "../utils/htmlToVdom";

let headTags = []

if (typeof window !== 'undefined') {
  const headUpdateRunner = (dispatch) => {
    const handleHeadUpdate = () => {
      dispatch({});
    }
    addEventListener('headupdate', handleHeadUpdate)
    return () => {
      removeEventListener('headupdate', handleHeadUpdate)
    }
  }

  const trackHeadUpdates = () => [headUpdateRunner]
  
  // CSS files, script tags
  const existing = htmlToVdom(`<head>${document.head.innerHTML}</head>`, true)

  app({
    node: document.head,
    view: () => h('head', {}, [...existing, ...headTags]),
    subscriptions: () => [
      trackHeadUpdates() as any
    ]
  });
}


const updateHeadFx = async ({ head, meta, state }) => {
  const bundle = meta[state.location.route]?.bundle;

  const pageHead = bundle?.head;

  let data;
  
  if (typeof window !== 'undefined') {
    data = window.HYPERSTATIC_DATA?.[state.location.path]?.data;
  }

  const uniqueTags = combineHeads(head(state), pageHead?.(state, data));
  
  headTags = uniqueTags;

  dispatchEvent(new CustomEvent("headupdate"));
}

const updateHead = (head, meta, state) => {
  updateHeadFx({ head, meta, state });
}


export default updateHead;