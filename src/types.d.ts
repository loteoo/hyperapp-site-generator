/// <reference types="vite/client" />
import { ElementVNode, Props } from 'hyperapp';
import { Location } from './router';

declare global {
  namespace Hyperstatic {
    interface AppState { }
  }
  namespace JSX {
    type Element = ElementVNode<State>;
    interface IntrinsicElements {
      [elemName: string]: Props<State>;
    }
  }
}

export interface State extends Hyperstatic.AppState {
  location: Location;
  data: any;
}

export type { Config } from 'vike/types'
