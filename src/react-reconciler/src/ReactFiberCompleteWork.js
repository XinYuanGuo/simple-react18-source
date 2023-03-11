import {
  appendInitialChild,
  createInstance,
  createTextInstance,
  finalizeInitialChildren,
} from "react-dom-bindings/src/client/ReactDOMHostConfig";
import logger from "shared/logger";
import { NoFlags } from "./ReactFiberFlags";
import { HostComponent, HostText } from "./ReactWorkTags";

/**
 * 把当前完成的fiber所有的子节点对应的真实dom都挂载到自己父节点的真实dom节点上
 * @param {*} parent 当前完成的节点的真实dom
 * @param {*} workInProgress 当前完成的fiber
 */
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child;
  while (node) {
    // 最后回到父节点则结束
    if (node.return === workInProgress) {
      return;
    }
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      // 如果第一个儿子不是原生节点，说明可能是一个组件
      node = node.child;
      continue;
    }
    // 当前节点没有弟弟
    while (node.sibling === null) {
      node = node.return;
    }
    node = node.sibling;
  }
}

/**
 * 完成一个Fiber节点
 * @param {*} current 老Fiber
 * @param {*} workInProgress 新的构建的Fiber
 */
export function completeWork(current, workInProgress) {
  logger("completeWork", workInProgress);
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
      // 创建真实dom的实例
      const instance = createInstance(type, newProps, workInProgress);
      // 把所有的儿子都添加到自己身上
      appendAllChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
      finalizeInitialChildren(instance, type, newProps);
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
