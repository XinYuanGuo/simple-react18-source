import {
  NormalPriority as NormalSchedulerPriority,
  scheduleCallback,
  shouldYield,
} from "scheduler";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import {
  commitLayoutEffects,
  commitMutationEffectsOnFiber,
  commitPassiveMountEffects,
  commitPassiveUnmountEffects,
} from "./ReactFiberCommitWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { finishQueueingConcurrentUpdates } from "./ReactFiberConcurrentUpdates";
import { MutationMask, NoFlags, Passive } from "./ReactFiberFlags";

// 当前工作节点
let workInProgress = null;
let workInProgressRoot = null;
// 此根节点上有没有useEffect类似的副作用
let rootDoesHavePassiveEffect = false;
// 具有useEffect副作用的根节点 FiberRootNode,根fiber.stateNode
let rootWithPendingPassiveEffects = null;

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
  if (workInProgressRoot) {
    return;
  }
  workInProgressRoot = root;
  // 告诉浏览器执行performConcurrentWorkOnRoot
  scheduleCallback(
    NormalSchedulerPriority,
    performConcurrentWorkOnRoot.bind(null, root)
  );
}

/**
 * 根据虚拟dom构建fiber树，创建真实dom节点，还需要把真实的dom节点插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
  // 第一次渲染是同步的
  renderRootSync(root);
  // 开始进入提交阶段，就是执行副作用修改真实dom
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
  workInProgressRoot = null;
}

function flushPassiveEffect() {
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects;
    // 执行卸载副作用
    commitPassiveUnmountEffects(root.current);
    // 执行挂载副作用
    commitPassiveMountEffects(root, root.current);
  }
}

function commitRoot(root) {
  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  // 先获取新的构建好的fiber树的根fiber
  const { finishedWork } = root;
  if (finishedWork) {
    if (
      (finishedWork.subtreeFlags & Passive) !== NoFlags ||
      finishedWork.flags & (Passive !== NoFlags)
    ) {
      if (!rootDoesHavePassiveEffect) {
        rootDoesHavePassiveEffect = true;
        // 开启一个宏任务 等待渲染过后执行
        scheduleCallback(NormalSchedulerPriority, flushPassiveEffect);
      }
    }
  }
  // 判断子树有没有副作用
  const subtreeHasEffect =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;
  if (subtreeHasEffect || rootHasEffect) {
    // dom变更
    commitMutationEffectsOnFiber(finishedWork, root);
    commitLayoutEffects(finishedWork, root);
    // 如果有副作用那么将root赋值给rootWithPendingPassiveEffects, 在下一个宏任务中拿到root
    if (rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false;
      rootWithPendingPassiveEffects = root;
    }
  }
  // 等dom变更后，可以把root的current指向新的fiber树
  root.current = finishedWork;
}

function renderRootSync(root) {
  // 开始构建fiber树
  prepareFreshStack(root);
  workLoopSync();
}

function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null);
  finishQueueingConcurrentUpdates();
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
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
