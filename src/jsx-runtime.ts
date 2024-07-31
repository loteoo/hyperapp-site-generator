import { MaybeVNode, h, text } from "hyperapp"

const childNode = (child: MaybeVNode<unknown>) => ["string", "number"].includes(typeof child) ? text(child) : child;

export const jsx = (tag: any, { children, ...props }: any, key: any) =>
  typeof tag === "function"
    ? tag({ ...props, key }, children)
    : h(
      tag,
      { ...props, key },
      [].concat(children).map(childNode)
    )

export const jsxs = jsx