import { listenToAllSupportedEvents } from "react-dom-bindings/src/event/DOMPluginEventSystem";
import {
  createContainer,
  updateContainer,
} from "react-reconciler/src/ReactFiberReconciler";

function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render = function (children) {
  const root = this._internalRoot;
  updateContainer(children, root);
};

/**
 *
 * @param {*} container 容器 div#root
 * @returns
 */
export function createRoot(container) {
  const root = createContainer(container);
  // 事件代理
  listenToAllSupportedEvents(container);
  return new ReactDOMRoot(root);
}
