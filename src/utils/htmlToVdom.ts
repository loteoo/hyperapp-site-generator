import { h, text } from 'hyperapp'

const EMPTY_OBJ = {};

/**
 * Html to hyperapp VDOM converter
 * Someone should make this a package...
 */

const mapProps = attrs => (
  [...attrs].reduce(
    (props, attr) => (
      attr.nodeName === 'style'
        ? props // ignore string style definitions for now.
        : { ...props, [attr.nodeName]: attr.nodeValue }
    ),
    {}
  )
)

const htmlToVdom = (html, hydrate = false) => {

  const mapChildren = (childNodes) => [...childNodes]
    .map(node => mapVNode(node))

  const mapVNode = (node) => node.nodeType === Node.TEXT_NODE
    ? text(node.nodeValue)
    : h(node.nodeName.toLowerCase(), hydrate ? EMPTY_OBJ : mapProps(node.attributes), mapChildren(node.childNodes))


  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const node = mapVNode(html.startsWith('<head') ? doc.head : doc.body)
  return node.children
}

export default htmlToVdom
