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

// 没有时间戳
export const NoTimestamp = -1;

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

export function includesExpiredLane(root, lanes) {
  return (root.expiredLanes & lanes) !== NoLanes;
}

/**
 * 最左侧1的索引
 * @param {*} lanes
 */
function pickArbitraryLaneIndex(lanes) {
  // Math.clz32 返回最左侧1的左边0的个数
  return 31 - Math.clz32(lanes);
}

export function markStarvedLanesAsExpired(root, currentTime) {
  // 获取当前有更新的赛道
  const pendingLanes = root.pendingLanes;
  // 每个赛道上的过期时间
  const expirationTimes = root.expirationTimes;
  let lanes = pendingLanes;
  while (lanes > 0) {
    // 获取最左侧1的索引
    const index = pickArbitraryLaneIndex(lanes);
    // 拿到赛道
    const lane = 1 << index;
    const expirationTime = expirationTimes[index];
    // 如果此赛道上没有过期时间 说明没有为此赛道设置过期时间
    if (expirationTime === NoTimestamp) {
      expirationTimes[index] = computeExpirationTime(lane, currentTime);
    } else if (expirationTime <= currentTime) {
      // 如果此赛道的过期时间已经小于等于当前时间 把此赛道添加到过期赛道中
      root.expiredLanes |= lane;
    }
    lanes &= ~lane;
  }
}

function computeExpirationTime(lane, currentTime) {
  switch (lane) {
    case SyncLane:
    case InputContinuousLane:
      return currentTime + 250;
    case DefaultLane:
      return currentTime + 5000;
    case IdleLane:
    default:
      return NoTimestamp;
  }
}

export function createLaneMap(initial) {
  const laneMap = [];
  for (let i = 0; i < TotalLanes; i++) {
    laneMap.push(initial);
  }
  return laneMap;
}

export function markRootFinished(root, remainingLanes) {
  // pendingLanes是根上将要被渲染的车道
  // noLongerPendingLanes指的是已经更新过的lane
  const noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
  root.pendingLanes = remainingLanes;
  let expirationTimes = root.expirationTimes;
  let lanes = noLongerPendingLanes;
  while (lanes > 0) {
    // 获取最左侧1的索引
    const index = pickArbitraryLaneIndex(lanes);
    // 拿到赛道
    const lane = 1 << index;
    // 清除已经更新过的lane
    expirationTimes = expirationTimes[index] = NoTimestamp;
    lanes &= ~lane;
  }
}
