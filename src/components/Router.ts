import { h, text, VNode } from 'hyperapp'
import htmlToVdom from '../utils/htmlToVdom';
import { State, ViewContext } from '../types';
import Link from './Link';

interface Props {
  loader?: (state: State) => VNode<State>;
  notFound?: (state: State) => VNode<State>;
}

/**
 * Router component to import in user code.
 *
 * Renders the correct view depending on the location state
 *
 */
const Router = (props: Props = {}) => ({ state, meta }: ViewContext): VNode<State> => {
  const { route, path } = state.location;
  const { loader, notFound } = props ?? {};

  // 404 Page
  if (!route) {
    // Display custom 404 page if specified
    if (notFound && typeof notFound === 'function') {
      return (
        h('div', { id: 'router-outlet' }, [
          notFound(state)
        ])
      )
    }

    // Default 404
    return (
      h('div', { id: 'router-outlet' }, [
        h('div', { style: { padding: '1rem', textAlign: 'center' } }, [
          h('h1', {}, text('404.')),
          h('p', {}, text('Page not found.')),
          Link({ href: '/' }, 'Home page') as any
        ])
      ])
    )
  }

  const view = meta[route]?.bundle?.default;

  if (view) {
    if (state.paths[path] === 'ready') {
      return (
        h('div', { id: 'router-outlet' }, [
          view(state)
        ])
      )
    }
  }

  // Check if a prerendered piece of HTML can be reused while JS / JSON loads
  if (typeof window !== 'undefined') {
    const previousOutlet = document.getElementById('router-outlet')
    if (previousOutlet) {
      const node = htmlToVdom(previousOutlet.innerHTML)
      return h('div', { id: 'router-outlet' }, node);
    }
  }

  // Display custom loader if specified
  if (loader && typeof loader === 'function') {
    return (
      h('div', { id: 'router-outlet' }, [
        loader(state)
      ])
    )
  }


  // Default loader
  return (
    h('div', { id: 'router-outlet' }, [
      h('div', { style: { padding: '1rem', textAlign: 'center' } }, [
        h('h2', {}, text('Loading...'))
      ])
    ])
  )
}

export default Router
