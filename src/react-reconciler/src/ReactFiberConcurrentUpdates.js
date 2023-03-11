import { HostRoot } from "./ReactWorkTags";

/**
 * 本来此方法要处理更新优先级的问题
 * 先实现向上找到根节点
 */
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber;
  let parent = sourceFiber.return;
  // 根节点的parent为null
  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    // FiberRootNode
    return node.stateNode;
  }
  return null;
}
