import { shouldSetTextContent } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { renderWithHooks } from "./ReactFiberHooks";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
  IndeterminateComponent,
} from "./ReactWorkTags";

/**
 * 根据虚拟dom构建新的fiber链表, 返回下一个工作单元 如child sibling
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 */
export function beginWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type
      );
    case FunctionComponent:
      const Component = workInProgress.type;
      const newProps = workInProgress.pendingProps;
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        newProps
      );
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

function updateFunctionComponent(current, workInProgress, Component, newProps) {
  const nextChildren = renderWithHooks(
    current,
    workInProgress,
    Component,
    newProps
  );
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * 挂载未定义的组件 函数组件/类组件
 * @param {*} current 老的fiber
 * @param {*} workInProgress 新的fiber
 * @param {*} Component 组件类型
 */
export function mountIndeterminateComponent(
  current,
  workInProgress,
  Component
) {
  const props = workInProgress.pendingProps;
  const value = renderWithHooks(current, workInProgress, Component, props);
  workInProgress.tag = FunctionComponent;
  reconcileChildren(current, workInProgress, value);
  return workInProgress.child;
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
