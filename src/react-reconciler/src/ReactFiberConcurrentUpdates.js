import { mergeLanes } from "./ReactFiberLane";
import { HostRoot } from "./ReactWorkTags";

// 并发更新队列
const concurrentQueues = [];
// 并发更新队列索引
let concurrentQueuesIndex = 0;

export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueuesIndex;
  concurrentQueuesIndex = 0;
  let i = 0;
  while (i < endIndex) {
    const fiber = concurrentQueues[i++];
    const queue = concurrentQueues[i++];
    const update = concurrentQueues[i++];
    const lane = concurrentQueues[i++];
    if (queue !== null && update !== null) {
      const pending = queue.pending;
      if (pending === null) {
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }
  }
}

/**
 *
 * @param {*} fiber 函数组件对应的fiber
 * @param {*} queue 要更新的hook对应的更新队列
 * @param {*} update 更新对象
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
  enqueueUpdate(fiber, queue, update, lane);
  return getRootForUpdatedFiber(fiber);
}

function getRootForUpdatedFiber(sourceFiber) {
  let node = sourceFiber;
  let parent = node.return;
  while (parent !== null) {
    node = parent;
    parent = node.return;
  }
  return node.tag === HostRoot ? node.stateNode : null;
}

/**
 * 把更新先缓存到数组中
 * @param {*} fiber
 * @param {*} queue
 * @param {*} update
 */
function enqueueUpdate(fiber, queue, update, lane) {
  concurrentQueues[concurrentQueuesIndex++] = fiber;
  concurrentQueues[concurrentQueuesIndex++] = queue;
  concurrentQueues[concurrentQueuesIndex++] = update;
  concurrentQueues[concurrentQueuesIndex++] = lane;
  // 当我们项fiber上添加一个更新的时候，要把此更新的赛道合并到此fiber的赛道上
  fiber.lanes = mergeLanes(fiber.lanes, lane);
}

/**
 * 本来此方法要处理更新优先级的问题
 * 先实现向上找到根节点
 */
// export function markUpdateLaneFromFiberToRoot(sourceFiber) {
//   let node = sourceFiber;
//   let parent = sourceFiber.return;
//   // 根节点的parent为null
//   while (parent !== null) {
//     node = parent;
//     parent = parent.return;
//   }
//   if (node.tag === HostRoot) {
//     // FiberRootNode
//     return node.stateNode;
//   }
//   return null;
// }

/**
 * 把更新入队
 * @param {*} fiber 入队fiber 根fiber
 * @param {*} queue 待生效的队列
 * @param {*} update 更新
 * @param {*} lane 更新的赛道
 */
export function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
  enqueueUpdate(fiber, queue, update, lane);
  return getRootForUpdatedFiber(fiber);
}
