import { getCurrentEventPriority } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  IdleEventPriority,
  lanesToEventPriority,
  setCurrentUpdatePriority,
} from "./ReactEventPriorities";
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
import {
  getHighestPriorityLane,
  getNextLanes,
  includesBlockingLane,
  markRootUpdated,
  NoLanes,
  SyncLane,
} from "./ReactFiberLane";
import {
  flushSyncCallbacks,
  scheduleSyncCallback,
} from "./ReactFiberSyncTaskQueue";
import {
  IdlePriority as IdleSchedulerPriority,
  ImmediatePriority as ImmediateSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  scheduleCallback as Scheduler_scheduleCallback,
  shouldYield,
  UserBlockingPriority as UserBlockingSchedulerPriority,
} from "./Scheduler";

// 当前工作节点
let workInProgress = null;
let workInProgressRoot = null;
// 此根节点上有没有useEffect类似的副作用
let rootDoesHavePassiveEffect = false;
// 具有useEffect副作用的根节点 FiberRootNode,根fiber.stateNode
let rootWithPendingPassiveEffects = null;
let workInProgressRootRenderLanes = NoLanes;

/**
 * 计划更新root节点
 * 源码中此处有一个任务调度的功能
 * @param {*} root
 */
export function scheduleUpdateOnFiber(root, fiber, lane) {
  markRootUpdated(root, lane);
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root);
}

function performSyncWorkOnRoot(root) {
  // 获得最高优先级的赛道
  const lanes = getNextLanes(root);
  // 渲染新的fiber树
  renderRootSync(root, lanes);
  // 获取渲染完成的fiber根节点
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
  // 一定要返回null 不为null的话外层循环无法跳出
  return null;
}

function ensureRootIsScheduled(root) {
  // 获取当前优先级最高的车道
  const nextLanes = getNextLanes(root, NoLanes);
  // 获取新的调度优先级
  let newCallbackPriority = getHighestPriorityLane(nextLanes);
  // 如果是同步赛道
  if (newCallbackPriority === SyncLane) {
    // 先把performSyncWorkOnRoot添加到同步队列中
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    // 把flushSyncCallbacks放入微任务中
    queueMicrotask(flushSyncCallbacks);
  } else {
    // 如果不是同步赛道 就需要调度一个新的任务
    let schedulerPriorityLevel;
    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediateSchedulerPriority;
        break;
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority;
        break;
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority;
        break;
      default:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
    }
    Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
  // if (workInProgressRoot) {
  //   return;
  // }
  // workInProgressRoot = root;
  // // 告诉浏览器执行performConcurrentWorkOnRoot
  // scheduleCallback(
  //   NormalSchedulerPriority,
  //   performConcurrentWorkOnRoot.bind(null, root)
  // );
}

/**
 * 根据虚拟dom构建fiber树，创建真实dom节点，还需要把真实的dom节点插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
  // 获取当前优先级最高的车道
  const nextLanes = getNextLanes(root, NoLanes);
  if (nextLanes === NoLanes) {
    return null;
  }
  const shouldTimeSlice = !includesBlockingLane(root, nextLanes) && !didTimeout;
  if (shouldTimeSlice) {
    renderRootConcurrent(root, nextLanes);
  } else {
    // 第一次渲染是同步的
    renderRootSync(root, nextLanes);
  }
  // 开始进入提交阶段，就是执行副作用修改真实dom
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
}

function renderRootConcurrent(root, lanes) {
  console.log(root, lanes);
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

/**
 * 提交阶段是同步的 必须一气呵成做完
 * @param {*} root
 */
function commitRoot(root) {
  const previousUpdatePriority = getCurrentUpdatePriority();
  try {
    // 把当前的更新优先级设置为1 表示同步更新
    setCurrentUpdatePriority(DiscreteEventPriority);
    commitRootImpl(root);
  } finally {
    setCurrentUpdatePriority(previousUpdatePriority);
  }
}

function commitRootImpl(root) {
  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  // 先获取新的构建好的fiber树的根fiber
  const { finishedWork } = root;
  workInProgressRoot = null;
  workInProgressRootRenderLanes = null;
  if (finishedWork) {
    if (
      (finishedWork.subtreeFlags & Passive) !== NoFlags ||
      finishedWork.flags & (Passive !== NoFlags)
    ) {
      if (!rootDoesHavePassiveEffect) {
        rootDoesHavePassiveEffect = true;
        // 开启一个宏任务 等待渲染过后执行
        Scheduler_scheduleCallback(NormalSchedulerPriority, flushPassiveEffect);
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

function renderRootSync(root, renderLanes) {
  if (
    root !== workInProgressRoot ||
    workInProgressRootRenderLanes !== renderLanes
  ) {
    prepareFreshStack(root, renderLanes);
  }
  workLoopSync();
}

function prepareFreshStack(root, renderLanes) {
  if (
    root !== workInProgressRoot ||
    workInProgressRootRenderLanes !== renderLanes
  ) {
    workInProgress = createWorkInProgress(root.current, null);
  }
  workInProgressRootRenderLanes = renderLanes;
  workInProgressRoot = root;
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
  const next = beginWork(current, unitOfWork, workInProgressRootRenderLanes);
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

/**
 * 请求一个更新车道
 * @returns
 */
export function requestUpdateLane() {
  const updateLane = getCurrentUpdatePriority();
  if (updateLane !== NoLanes) {
    return updateLane;
  }
  const eventLane = getCurrentEventPriority();
  return eventLane;
}
