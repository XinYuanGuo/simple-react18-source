import { NoFlags } from "./ReactFiberFlags";
import {
  HostComponent,
  HostRoot,
  HostText,
  IndeterminateComponent,
} from "./ReactWorkTags";

/**
 * 基于老的fiber和新的属性创建新的fiber
 * @param {*} current
 * @param {*} pendingProps
 * @returns
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  return workInProgress;
}

export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}

export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key);
}

/**
 *
 * @param {*} tag Fiber的类型tag，如函数组件、原生组件、类组件等等虚拟dom对应编号
 * @param {*} pendingProps 新属性，等待处理或生效的属性
 * @param {*} key 唯一标识
 */
export function FiberNode(tag, pendingProps, key) {
  this.tag = tag;
  this.key = key;
  // 虚拟dom的类型，如div、span、p
  this.type = null;
  // 此Fiber对应的真实dom节点
  this.stateNode = null;
  // 父节点
  this.return = null;
  // 第一个子节点
  this.child = null;
  // 第一个弟弟节点
  this.sibling = null;
  // 等待生效的属性
  this.pendingProps = pendingProps;
  // 已经生效的属性
  this.memoizedProps = null;
  // 每种状态存的类型是不一样的，如类组件对应的fiber存的就是实例的状态，HostRoot存的就是要渲染的元素
  this.memoizedState = null;
  // 更新队列
  this.updateQueue = null;
  // 副作用标识，标识针对此fiber节点进行何种操作
  this.flags = NoFlags;
  // 子节点的副作用标识
  this.subtreeFlags = NoFlags;
  // 替身 双缓冲机制 dom-diff的时候用
  this.alternate = null;
  // 索引 兄弟Fiber中的位置
  this.index = 0;
}

/**
 * 根据虚拟dom创建Fiber
 * @param {*} element
 */
export function createFiberFromElement(element) {
  const { type, key, props } = element;
  return createFiberFromTypeAndProps(type, key, props);
}

export function createFiberFromTypeAndProps(type, key, pendingProps) {
  let tag = IndeterminateComponent;
  if (typeof type === "string") {
    tag = HostComponent;
  }
  const fiber = createFiber(tag, pendingProps, key);
  fiber.type = type;
  return fiber;
}

export function createFiberFromText(content) {
  return createFiber(HostText, content, null);
}
