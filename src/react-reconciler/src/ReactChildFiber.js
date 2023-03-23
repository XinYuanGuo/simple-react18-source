/**
 * dom-diff相关都在这个文件中
 */

import isArray from "shared/isArray";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from "./ReactFiber";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import { HostText } from "./ReactWorkTags";

/**
 *
 * @param {*} shouldTracksSideEffects 是否跟踪副作用
 */
function createChildReconciler(shouldTracksSideEffects) {
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTracksSideEffects) {
      return;
    }
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      returnFiber.deletions.push(childToDelete);
    }
  }

  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTracksSideEffects) {
      return;
    }
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }

  /**
   *
   * @param {*} returnFiber
   * @param {*} currentFirstChild
   * @param {*} element
   * @returns
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    // dom-diff
    const key = element.key;
    let child = currentFirstChild;
    while (child !== null) {
      // 判断此老fiber对应的key和新的虚拟dom对象是否一样
      if (child.key === key) {
        if (child.type === element.type) {
          // 认为此节点可以复用
          deleteRemainingChildren(returnFiber, child.sibling);
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        }
        // 找到key一样 type不一样的fiber，不能复用，把剩下的全部删除
        deleteRemainingChildren(returnFiber, child);
        break;
      } else {
        deleteChild(returnFiber, child);
      }
    }

    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function placeSingleChild(newFiber) {
    if (shouldTracksSideEffects && newFiber.alternate === null) {
      // 添加插入副作用
      // 要在最后的提交阶段插入此节点， react渲染分成渲染（创建Fiber树）和提交（更新真实dom）两个阶段
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number"
    ) {
      const created = createFiberFromText(`${newChild}`);
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;

        default:
          break;
      }
    }
  }

  // 如果父Fiber是初次挂载，shouldTracksSideEffects是false，不需要添加flags
  // 这种情况下会在完成阶段把所有的子节点全部添加到自己身上
  function placeChild(newFiber, lastPlacedIndex, newIdx) {
    newFiber.index = newIdx;
    if (!shouldTracksSideEffects) {
      return lastPlacedIndex;
    }
    const current = newFiber.alternate;
    // 如果有 说明这是一个更新的节点 有老的真实dom 不需要插入
    if (current !== null) {
      const oldIndex = current.index;
      // 如果找到的老fiber的索引比lastPlacedIndex小，则老fiber对应的dom节点需要移动
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        return oldIndex;
      }
    } else {
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
  }

  function updateElement(returnFiber, current, element) {
    const elementType = element.type;
    if (current !== null) {
      // 如果类型也一样 那么这个节点可以复用
      if (current.type === elementType) {
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    // 类型不同则为新的节点
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null;
    if (newChild !== null && typeof newChild === "object") {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          if (newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild);
          }
        }
        default:
          return null;
      }
    }
    return null;
  }

  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map();
    let existingChild = currentFirstChild;
    while (existingChild !== null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }

  function updateTextNode(returnFiber, current, textContent) {
    if (current === null || current.tag !== HostText) {
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    } else {
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateFromMap(existingChildren, returnFiber, newIdx, newChild) {
    if (
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number"
    ) {
      const matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(returnFiber, matchedFiber, "" + newChild);
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const matchedFiber =
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key
            ) || null;
          return updateElement(returnFiber, matchedFiber, newChild);

        default:
          break;
      }
    }
  }

  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    // 返回的第一个新儿子
    let resultingFirstChild = null;
    // 上一个新Fiber
    let previousNewFiber = null;
    // 用来遍历新的虚拟dom的索引
    let newIdx = 0;
    // 第一个老fiber
    let oldFiber = currentFirstChild;
    let nextOldFiber = null;
    let lastPlacedIndex = 0;

    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      nextOldFiber = oldFiber.sibling;
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]);
      if (newFiber === null) {
        break;
      }
      if (shouldTracksSideEffects) {
        // 如果新fiber是新创建的 不是复用 那么需要删除老fiber
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (newIdx === newChildren.length) {
      // 删除剩下的老fiber
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx]);
        if (newFiber === null) continue;
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        // previousNewFiber为null的话说明这个fiber是第一个fiber
        if (previousNewFiber === null) {
          // 这个fiber是大儿子
          resultingFirstChild = newFiber;
        } else {
          // 不是大儿子 添加为上个fiber的兄弟节点
          previousNewFiber.sibling = newFiber;
        }
        // 让newFiber成为上一个fiber
        previousNewFiber = newFiber;
      }
    }

    // 开始处理移动逻辑
    // 将剩下的老节点放到一个map中
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
    // 开始遍历剩下的虚拟dom子节点
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx]
      );
      if (newFiber !== null) {
        if (shouldTracksSideEffects) {
          // 如果要跟踪副作用 并且有老fiber
          if (newFiber.alternate !== null) {
            existingChildren.delete(
              newFiber.key === null ? newIdx : newFiber.key
            );
          }
        }
        // 指定新的fiber存放位置，并给lastPlacedIndex赋值
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }
    // 完成后 删除剩下的Fiber
    if (shouldTracksSideEffects) {
      existingChildren.forEach((child) => deleteChild(returnFiber, child));
    }
    return resultingFirstChild;
  }

  /**
   *比较子Fiber dom-diff 老Fiber和新的虚拟dom进行对比
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstChild 老Fiber的第一个子Fiber
   * @param {*} newChild 新的子虚拟dom
   */
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
    // 先考虑新的节点只有一个的情况
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstChild, newChild)
          );
        default:
          break;
      }
    }
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
    }

    return null;
  }
  return reconcileChildFibers;
}

// 有老fiber 更新的时候用这个
export const reconcileChildFibers = createChildReconciler(true);
// 没有老fiber 初次挂载用这个
export const mountChildFibers = createChildReconciler(false);
