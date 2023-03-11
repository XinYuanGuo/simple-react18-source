import { scheduleCallback } from "scheduler";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";

let workInProgress = null;
/**
 * 计划更新root节点
 * 源码中此处有一个任务调度的功能
 * @param {*} root
 */
export function scheduleUpdateOnFiber(root) {
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root) {
  // 告诉浏览器执行performConcurrentWorkOnRoot
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}

/**
 * 根据虚拟dom构建fiber树，创建真实dom节点，还需要把真实的dom节点插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root) {
  // 第一次渲染是同步的
  renderRootSync(root);
}

function renderRootSync(root) {
  // 开始构建fiber树
  prepareFreshStack(root);
  workLoopSync();
}

function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null);
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork) {
  // 获取新fiber对应的老fiber
  const current = unitOfWork.alternate;
  // 完成当前fiber的子fiber链表构建后
  const next = beginWork(current, unitOfWork);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  // 没有子节点代表当前的fiber已经完成了
  if (next === null) {
    completeUnitOfWork(unitOfWork);
  } else {
    // 有子节点则成为下一个工作单元
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;
    // 最后的HostRootFiber的return 为null
    const returnFiber = completedWork.return;
    // 执行此fiber的完成工作 如果是原生组件的话需要创建真实dom节点
    completeWork(current, completedWork);
    // 结束当前fiber的兄弟节点
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }
    // 如果没有弟弟，说明当前fiber是父fiber的最后一个节点
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
}
