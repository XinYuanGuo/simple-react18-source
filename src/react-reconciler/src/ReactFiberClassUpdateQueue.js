import assign from "shared/assign";
import { enqueueConcurrentClassUpdate } from "./ReactFiberConcurrentUpdates";
import { isSubsetOfLanes, NoLanes } from "./ReactFiberLane";

export const UpdateState = 0;

export function initialUpdateQueue(fiber) {
  // 创建一个新的更新队列
  // pending是一个循环链表
  const queue = {
    // 本次更新前的fiber状态，更新会基于它进行计算
    baseState: fiber.memoizedState,
    // 本次更新前该fiber上保存的上次跳过的更新链表的头
    firstBaseUpdate: null,
    // 本次更新前该fiber上保存的上次跳过的更新链表的尾
    lastBaseUpdate: null,
    shared: {
      pending: null,
    },
  };
  fiber.updateQueue = queue;
}

export function createUpdate(lane) {
  const update = {
    tag: UpdateState,
    lane,
    next: null,
  };
  return update;
}

export function enqueueUpdate(fiber, update, lane) {
  // const updateQueue = fiber.updateQueue;
  // const pending = updateQueue.shared.pending;
  // if (pending === null) {
  //   update.next = update;
  // } else {
  //   update.next = pending.next;
  //   pending.next = update;
  // }
  // updateQueue.shared.pending = update;
  // // 标记更新赛道(0~32优先级)从当前的Fiber到根节点
  // return markUpdateLaneFromFiberToRoot(fiber);

  // 获取更新队列
  const updateQueue = fiber.updateQueue;
  // 获取共享队列
  const sharedQueue = updateQueue.shared;

  return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
}

/**
 * 根据老状态和更新链表中的更新计算最新的状态
 * @param {*} workInProgress 要计算的fiber
 */
export function processUpdateQueue(
  workInProgress,
  props,
  workInProgressRootRenderLanes
) {
  const queue = workInProgress.updateQueue;
  // // 取出更新队列
  // const pendingQueue = queue.shared.pending;
  // // 如果有更新
  // if (pendingQueue !== null) {
  //   // 清空更新链表
  //   queue.shared.pending = null;
  //   // 更新链表的指针为最后一次更新
  //   const lastPendingUpdate = pendingQueue;
  //   // 更新链表为循环链表，最后一次更新的next指向第一次更新
  //   const firstPendingUpdate = lastPendingUpdate.next;
  //   // 将更新链表剪开，成为一个单链表
  //   lastPendingUpdate.next = null;
  //   // 获取老状态
  //   let newState = workInProgress.memoizedState;
  //   let update = firstPendingUpdate;
  //   while (update) {
  //     // 根据老状态和更新 计算新状态
  //     newState = getStateFromUpdate(update, newState);
  //     update = update.next;
  //   }
  //   // 把最终计算到的状态赋值给memoizedState
  //   workInProgress.memoizedState = newState;
  // }
  let firstBaseUpdate = queue.firstBaseUpdate;
  let lastBaseUpdate = queue.lastBaseUpdate;
  const pendingQueue = queue.shared.pending;
  if (pendingQueue !== null) {
    queue.shared.pending = null;
    const lastPendingUpdate = pendingQueue;
    const firstPendingUpdate = lastPendingUpdate.next;
    lastPendingUpdate.next = null;
    if (lastBaseUpdate === null) {
      firstBaseUpdate = firstPendingUpdate;
    } else {
      lastBaseUpdate.next = firstPendingUpdate;
    }
    lastBaseUpdate = lastPendingUpdate;
  }
  if (firstBaseUpdate !== null) {
    let newState = queue.baseState;
    let newLanes = NoLanes;
    let newBaseState = null;
    let newFirstBaseUpdate = null;
    let newLastBaseUpdate = null;
    let update = firstBaseUpdate;
    do {
      const updateLane = update.lane;
      if (!isSubsetOfLanes(workInProgressRootRenderLanes, updateLane)) {
        const clone = {
          id: update.id,
          lane: updateLane,
          payload: update.payload,
          next: null,
        };
        newLastBaseUpdate = newLastBaseUpdate.next = clone;
      }
      // 根据更新计算新状态
      newState = getStateFromUpdate(update, newState, props);
      update = update.next;
    } while (update);
    if (newLastBaseUpdate === null) {
      newBaseState = newState;
    }
    queue.baseState = newBaseState;
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;
    workInProgress.lanes = newLanes;
    workInProgress.memoizedState = newState;
  }
}

/**
 * 根据老状态和更新计算新状态
 * @param {*} update 更新的对象
 * @param {*} prevState 老状态
 */
function getStateFromUpdate(update, prevState, nextProps) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update;
      let partialState;
      if (typeof payload === "function") {
        partialState = payload.call(null, prevState, nextProps);
      } else {
        partialState = payload;
      }
      return assign({}, prevState, partialState);

    default:
      return prevState;
  }
}

export function cloneUpdateQueue(current, workInProgress) {
  const workInProgressQueue = workInProgress.updateQueue;
  const currentQueue = current.updateQueue;
  if (workInProgressQueue === currentQueue) {
    const clone = {
      baseState: currentQueue.baseState,
      firstBaseUpdate: currentQueue.firstBaseUpdate,
      lastBaseUpdate: currentQueue.lastBaseUpdate,
      shared: currentQueue.shared,
    };
    workInProgress.updateQueue = clone;
  }
}
