import { getFiberCurrentPropsFromNode } from "../client/ReactDOMComponentTree";

/**
 * 获取此fiber上的回调函数
 * @param {*} inst
 * @param {*} registerName
 */
export default function getListener(inst, registrationName) {
  const { stateNode } = inst;
  if (stateNode === null) {
    return null;
  }
  const props = getFiberCurrentPropsFromNode(stateNode);
  if (props === null) {
    return null;
  }
  const listener = props[registrationName];
  return listener;
}
