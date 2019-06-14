import { app } from 'hyperapp'
import {LocationChanged} from './utils'

// Import CSS
import 'sanitize.css'
import './global.css'

// Import app
import init from './init'
import view from './view'
import { SetPath } from './actions'

// Initialize the app
app({
  init,
  view,
  subscriptions: state => [LocationChanged({action: SetPath})],
  node: document.getElementById('app')
})

// Enable the service worker in production
if (process.env.NODE_ENV === 'production') {
  navigator.serviceWorker.register(`${window.location.origin}/sw.js`)
}
