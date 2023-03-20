const randomKey = Math.random().toString(36).slice(2);

const internalInstanceKey = "__reactFiber$" + randomKey;
const internalPropsKey = "__reactProps$" + randomKey;
/**
 * 从真实dom节点获取fiber节点
 * @param {*} targetNode dom节点
 */
export function getClosestInstanceFromNode(targetNode) {
  const targetInst = targetNode[internalInstanceKey];
  if (targetInst) {
    return targetInst;
  }
  return null;
}

export function updateFiberProps(node, props) {
  node[internalPropsKey] = props;
}

export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null;
}

/**
 * 提前缓存fiber节点的实例到dom节点
 * @param {*} hostInst
 * @param {*} node
 */
export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}
