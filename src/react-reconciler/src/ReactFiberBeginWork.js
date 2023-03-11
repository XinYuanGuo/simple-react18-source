import { shouldSetTextContent } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import logger from "shared/logger";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";

/**
 * 根据虚拟dom构建新的fiber链表, 返回下一个工作单元 如child sibling
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 */
export function beginWork(current, workInProgress) {
  logger("beginWork", workInProgress);
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      return null;
    default:
      return null;
  }
}

function updateHostRoot(current, workInProgress) {
  processUpdateQueue(workInProgress);
  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;
  // 协调子节点 dom-diff算法
  // 根据新的虚拟DOM生成子fiber链表
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * 构建原生组件的子Fiber链表
 * @param {*} current
 * @param {*} workInProgress
 */
function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress;
  const nextProps = workInProgress.pendingProps;
  let nextChildren = nextProps.children;
  // 判断当前虚拟dom的儿子是否是一个文本独生子
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    nextChildren = null;
  }
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * 根据新的虚拟DOM生成子fiber链表
 * @param {*} current 老的根fiber
 * @param {*} workInProgress 新的根fiber
 * @param {*} nextChildren 新的子虚拟dom
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  // 如果没有老fiber，说明新fiber是新创建的
  if (current === null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 有老fiber，需要做dom-diff，拿老的子fiber链表和新的子虚拟dom进行比较，进行最小化的更新
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}
