import { Action } from 'hyperapp';

let observer = typeof window !== 'undefined' ? new IntersectionObserver(
  (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // @ts-expect-error
        const event = new CustomEvent('linkenteredviewport', { detail: entry.target.dataset.path });
        dispatchEvent(event)
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.5
  }
) : null;

const subRunner = (dispatch, action) => {
  const handleLinkEnteredViewport = (ev) => {
    dispatch(action, ev.detail)
  }
  addEventListener('linkenteredviewport', handleLinkEnteredViewport)
  return () => {
    removeEventListener('linkenteredviewport', handleLinkEnteredViewport)
    observer?.disconnect();
  }
}

interface OnLinkEnteredViewPortArgs {
  selector: string;
  action: Action<any>;
}

/**
 * Every time a "Link" component enters the viewport,
 * trigger the given action with the link's path as params
 */
const onLinkEnteredViewPort = ({
  selector,
  action
}: OnLinkEnteredViewPortArgs) => {

  // After each render
  setTimeout(() => {
    requestAnimationFrame(() => {
      requestIdleCallback(() => {
        document.querySelectorAll(selector).forEach(link => {
          observer?.observe(link)
        });
      })
    })
  });

  return [
    subRunner,
    action
  ]
}


export default onLinkEnteredViewPort
