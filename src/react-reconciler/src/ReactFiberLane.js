import { allowConcurrentByDefault } from "shared/ReactFeatureFlags";

export const TotalLanes = 31;

export const NoLanes = /*                         */ 0b0000000000000000000000000000000;
export const NoLane = /*                          */ 0b0000000000000000000000000000000;

// 同步水合赛道
export const SyncHydrationLane = /*               */ 0b0000000000000000000000000000001;
// 同步赛道
export const SyncLane = /*                        */ 0b0000000000000000000000000000010;
// 连续输入水合赛道
export const InputContinuousHydrationLane = /*    */ 0b0000000000000000000000000000100;
// 连续输入赛道
export const InputContinuousLane = /*             */ 0b0000000000000000000000000001000;
// 默认水合赛道
export const DefaultHydrationLane = /*            */ 0b0000000000000000000000000010000;
// 默认赛道
export const DefaultLane = /*                     */ 0b0000000000000000000000000100000;

export const SyncUpdateLanes = /*                 */ 0b0000000000000000000000000101010;

const RetryLane1 = /*                             */ 0b0000000100000000000000000000000;

export const SomeRetryLane = RetryLane1;

export const SelectiveHydrationLane = /*          */ 0b0001000000000000000000000000000;

// 空闲赛道
export const IdleHydrationLane = /*               */ 0b0010000000000000000000000000000;
export const IdleLane = /*                        */ 0b0100000000000000000000000000000;

export const OffscreenLane = /*                   */ 0b1000000000000000000000000000000;
// 非空闲的lane
const NonIdleLanes = /*                          */ 0b0001111111111111111111111111111;

/**
 * 标记根节点更新
 * @param {*} root
 * @param {*} updateLane
 */
export function markRootUpdated(root, updateLane) {
  // pendingLanes指的是根上等待生效的lane
  root.pendingLanes |= updateLane;
}

export function getNextLanes(root, workInProgressLanes) {
  // 先获取所有有更新的车道
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    return NoLanes;
  }
  // 获取最高优先级的车道
  const nextLanes = getHighestPriorityLanes(pendingLanes);
  if (workInProgressLanes !== NoLanes && workInProgressLanes !== nextLanes) {
    if (nextLanes > workInProgressLanes) {
      return workInProgressLanes;
    }
  }
  return nextLanes;
}

export function getHighestPriorityLanes(lanes) {
  return getHighestPriorityLane(lanes);
}

// 找到最右边的1 只能返回一个车道
export function getHighestPriorityLane(lanes) {
  return lanes & -lanes;
}

export function includesNonIdleWork(lanes) {
  return (lanes & NonIdleLanes) !== NoLanes;
}

/**
 * 是否包含阻塞的车道
 * @param {*} root
 * @param {*} lanes
 * @returns
 */
export function includesBlockingLane(root, lanes) {
  // 如果默认允许并发渲染
  if (allowConcurrentByDefault) {
    return false;
  }
  const SyncDefaultLanes = InputContinuousLane | DefaultLane;
  return (lanes & SyncDefaultLanes) !== NoLanes;
}

export function isSubsetOfLanes(set, subset) {
  return (set & subset) === subset;
}

export function mergeLanes(a, b) {
  return a | b;
}
