import {
  appendChild,
  commitUpdate,
  insertBefore,
  removeChild,
} from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { MutationMask, Placement, Update } from "./ReactFiberFlags";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./ReactWorkTags";

let hostParent = null;

/**
 * 提交删除副作用
 * @param {*} root 根节点
 * @param {*} parentFiber 父fiber
 * @param {*} deletedFiber 要删除的fiber
 */
function commitDeletionEffects(root, returnFiber, deletedFiber) {
  let parent = returnFiber;
  // 一直向上查找 找到真实dom为止
  findParent: while (parent !== null) {
    switch (parent) {
      case HostComponent:
        hostParent = parent.stateNode;
        break findParent;
      case HostRoot:
        hostParent = parent.stateNode.containerInfo;
        break findParent;
    }
    parent = parent.return;
  }
  commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
  hostParent = null;
}

/**
 *
 * @param {*} finishedRoot 要完成的根节点
 * @param {*} nearestMountedAncestor 最近的挂载的父fiber
 * @param {*} deletedFiber 要删除的fiber
 */
function commitDeletionEffectsOnFiber(
  finishedRoot,
  nearestMountedAncestor,
  deletedFiber
) {
  switch (deletedFiber.tag) {
    case HostComponent:
    case HostText: {
      // 当要删除一个节点的时候，要先删除子节点
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      // 再把自己删除
      if (hostParent !== null) {
        removeChild(hostParent, deletedFiber.stateNode);
      }
      break;
    }
    default:
      break;
  }
}

function recursivelyTraverseDeletionEffects(
  finishedRoot,
  nearestMountedAncestor,
  parent
) {
  let child = parent.child;
  while (child !== null) {
    commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, child);
    child = child.sibling;
  }
}

/**
 * 递归遍历子节点，处理副作用
 * @param {*} root 根节点
 * @param {*} parentFiber 父fiber
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
  // 先把父fiber上需要删除的节点删掉
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[o];
      commitDeletionEffects(root, parentFiber, childToDelete);
    }
  }
  // 处理剩下的子节点
  if (parentFiber.subtreeFlags & MutationMask) {
    let { child } = parentFiber;
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root);
      child = child.sibling;
    }
  }
}

function commitReconciliationEffects(finishedWork) {
  const { flags } = finishedWork;
  // 如果要执行插入操作
  if (flags & Placement) {
    // 进行插入操作，也就是把此fiber的真实dom节点添加到父真实dom节点上
    commitPlacement(finishedWork);
    // 把flags的placement删除
    finishedWork.flags & ~Placement;
  }
}

function isHostParent(fiber) {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

function getHostParentFiber(fiber) {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
}

/**
 * 插入fiber真实节点
 * @param {*} node fiber节点
 * @param {*} parent 父真实dom节点
 */
function insertOrAppendPlacementNode(node, before, parent) {
  const { tag } = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const { stateNode } = node;
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else {
    const { child } = node;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let { sibling } = child;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

/**
 * 获取最近的弟弟的真实dom节点, 这个节点是已经存在的真实dom节点
 */
function getHostSibling(fiber) {
  let node = fiber;
  siblings: while (true) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }
    node = node.sibling;
    // 如果不是原生节点或文本节点
    while (node.tag !== HostComponent && node.tag !== HostText) {
      if (node.flags & Placement) {
        continue siblings;
      } else {
        node = node.child;
      }
    }
    // 如果不是插入节点则返回 是的话说明这个节点不是已经存在的节点
    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
}

/**
 * 把fiber的真实dom插入到父真实dom中
 */
function commitPlacement(finishedWork) {
  const parentFiber = getHostParentFiber(finishedWork);
  switch (parentFiber.tag) {
    case HostRoot: {
      const parent = parentFiber.stateNode.containerInfo;
      const before = getHostSibling(finishedWork);
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    case HostComponent: {
      const parent = parentFiber.stateNode;
      const before = getHostSibling(finishedWork);
      insertOrAppendPlacementNode(finishedWork, before, parent);
    }

    default:
      break;
  }
}

/**
 * 遍历fiber树，执行副作用
 * @param {*} finishedWork fiber节点
 * @param {*} root 根节点
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case FunctionComponent:
    case HostRoot:
    case HostText:
      // 先遍历他们的子节点，处理他们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      // 再处理自己的副作用
      commitReconciliationEffects(finishedWork);
      break;
    case HostComponent: {
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      // 处理dom更新
      if (flags & Update) {
        // 获取真实Dom
        const instance = finishedWork.stateNode;
        if (instance !== null) {
          // 更新真实dom
          if (instance !== null) {
            const newProps = finishedWork.memoizedProps;
            const oldProps =
              current !== null ? current.memoizedProps : newProps;
            const type = finishedWork.type;
            const updatePayload = finishedWork.updateQueue;
            finishedWork.updateQueue = null;
            if (updatePayload) {
              commitUpdate(
                instance,
                updatePayload,
                type,
                oldProps,
                newProps,
                finishedWork
              );
            }
          }
        }
      }
      break;
    }
    default:
      break;
  }
}
