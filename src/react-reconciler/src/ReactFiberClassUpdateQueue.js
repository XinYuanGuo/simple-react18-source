import assign from "shared/assign";
import { markUpdateLaneFromFiberToRoot } from "./ReactFiberConcurrentUpdates";

export const UpdateState = 0;

export function initialUpdateQueue(fiber) {
  // 创建一个新的更新队列
  // pending是一个循环链表
  const queue = {
    shared: {
      pending: null,
    },
  };
  fiber.updateQueue = queue;
}

export function createUpdate() {
  const update = {
    tag: UpdateState,
  };
  return update;
}

export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  const pending = updateQueue.shared.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  updateQueue.shared.pending = update;
  // 标记更新赛道(0~32优先级)从当前的Fiber到根节点
  return markUpdateLaneFromFiberToRoot(fiber);
}

/**
 * 根据老状态和更新链表中的更新计算最新的状态
 * @param {*} workInProgress 要计算的fiber
 */
export function processUpdateQueue(workInProgress) {
  const queue = workInProgress.updateQueue;
  // 取出更新队列
  const pendingQueue = queue.shared.pending;
  // 如果有更新
  if (pendingQueue !== null) {
    // 清空更新链表
    queue.shared.pending = null;
    // 更新链表的指针为最后一次更新
    const lastPendingUpdate = pendingQueue;
    // 更新链表为循环链表，最后一次更新的next指向第一次更新
    const firstPendingUpdate = lastPendingUpdate.next;
    // 将更新链表剪开，成为一个单链表
    lastPendingUpdate.next = null;
    // 获取老状态
    let newState = workInProgress.memoizedState;
    let update = firstPendingUpdate;
    while (update) {
      // 根据老状态和更新 计算新状态
      newState = getStateFromUpdate(update, newState);
      update = update.next;
    }
    // 把最终计算到的状态赋值给memoizedState
    workInProgress.memoizedState = newState;
  }
}

/**
 * 根据老状态和更新计算新状态
 * @param {*} update 更新的对象
 * @param {*} prevState 老状态
 */
function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update;
      return assign({}, prevState, payload);

    default:
      break;
  }
}
