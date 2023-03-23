import {
  appendInitialChild,
  createInstance,
  createTextInstance,
  finalizeInitialChildren,
  prepareUpdate,
} from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { NoFlags, Update } from "./ReactFiberFlags";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./ReactWorkTags";

/**
 * 把当前完成的fiber所有的子节点对应的真实dom都挂载到自己父节点的真实dom节点上
 * @param {*} parent 当前完成的节点的真实dom
 * @param {*} workInProgress 当前完成的fiber
 */
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child;
  while (node) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
      // 再看看第一个节节点是不是原生节点
    } else if (node.child !== null) {
      // node.child.return = node
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
    // 如果没有弟弟就找父亲的弟弟
    while (node.sibling === null) {
      // 如果找到了根节点或者回到了原节点结束
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    // node.sibling.return = node.return
    // 下一个弟弟节点
    node = node.sibling;
  }
}

/**
 * 给当前fiber添加更新副作用
 * @param {*} workInProgress
 */
function markUpdate(workInProgress) {
  workInProgress.flags |= Update;
}

/**
 * 在fiber的完成阶段准备更新Dom
 * @param {*} current 老fiber
 * @param {*} workingProgress 新fiber
 * @param {*} type 类型
 * @param {*} newProps 新属性
 */
function updateHostComponent(current, workingProgress, type, newProps) {
  const oldProps = current.memoizedProps;
  const instance = workingProgress.stateNode;
  // 比较新老属性 收集属性差异
  const updatePayload = prepareUpdate(instance, type, oldProps, newProps);
  // 让原生组件的新fiber更新队列等于
  workingProgress.updateQueue = updatePayload;
  if (updatePayload) {
    markUpdate(workingProgress);
  }
}

/**
 * 完成一个Fiber节点
 * @param {*} current 老Fiber
 * @param {*} workInProgress 新的构建的Fiber
 */
export function completeWork(current, workInProgress) {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case HostText:
      // 文本节点属性就是文本
      const newText = newProps;
      // 创建真实的文本节点
      workInProgress.stateNode = createTextInstance(newText);
      // 向上冒泡属性
      bubbleProperties(workInProgress);
      break;
    case HostComponent:
      const { type } = workInProgress;
      // 如果老fiber存在，并且老fiber上真实dom节点，要走节点更新的逻辑
      if (current !== null && workInProgress.stateNode !== null) {
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        // 创建真实dom的实例
        const instance = createInstance(type, newProps, workInProgress);
        // 把所有的儿子都添加到自己身上
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
        finalizeInitialChildren(instance, type, newProps);
      }
      bubbleProperties(workInProgress);
      break;
    case FunctionComponent:
      bubbleProperties(workInProgress);
    case HostRoot:
      bubbleProperties(workInProgress);
      break;
    default:
      break;
  }
}

function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags;
  let child = completedWork.child;
  // 遍历当前fiber的所有子节点，把所有的子节点的副作用以及子节点的子节点的副作用全部合并
  while (child !== null) {
    // 把子节点的子节点副作用向上合并
    subtreeFlags |= child.subtreeFlags;
    // 把子节点的副作用向上合并
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  completedWork.subtreeFlags = subtreeFlags;
}
