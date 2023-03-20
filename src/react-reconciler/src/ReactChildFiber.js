import isArray from "shared/isArray";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";

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

  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    // dom-diff
    const key = element.key;
    let child = currentFirstChild;
    while (child !== null) {
      // 判断此老fiber对应的key和新的虚拟dom对象是否一样
      if (child.key === key) {
        if (child.type === element.type) {
          // 认为此节点可以复用
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        }
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

  function crateChild(returnFiber, newChild) {
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

  function placeChild(newFiber, newIndex) {
    newFiber.index = newIndex;
    if (shouldTracksSideEffects) {
      // 如果父Fiber是初次挂载，shouldTracksSideEffects是false，不需要添加flags
      // 这种情况下会在完成阶段把所有的子节点全部添加到自己身上
      newFiber.flags |= Placement;
    }
  }

  function reconcileChildrenArray(returnFiber, currentFirstFiber, newChildren) {
    // 返回的第一个新儿子
    let resultingFirstChild = null;
    // 上一个新Fiber
    let previousNewFiber = null;
    let newIndex = 0;
    for (; newIndex < newChildren.length; newIndex++) {
      const newFiber = crateChild(returnFiber, newChildren[newIndex]);
      if (newFiber === null) continue;
      placeChild(newFiber, newIndex);
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
