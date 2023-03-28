import {
  DefaultLane,
  getHighestPriorityLane,
  IdleLane,
  includesNonIdleWork,
  InputContinuousLane,
  NoLane,
  SyncLane,
} from "./ReactFiberLane";

// 离散事件优先级 click onchange
export const DiscreteEventPriority = SyncLane;
// 连续事件优先级 mousemove scroll
export const ContinuousEventPriority = InputContinuousLane;
// 默认事件赛道
export const DefaultEventPriority = DefaultLane;
// 空闲事件优先级
export const IdleEventPriority = IdleLane;

let currentUpdatePriority = NoLane;

export function getCurrentUpdatePriority() {
  return currentUpdatePriority;
}

export function setCurrentUpdatePriority(newPriority) {
  currentUpdatePriority = newPriority;
}

/**
 * 判断事件优先级
 * @param {*} a
 * @param {*} b
 * @returns
 */
export function isHigherEventPriority(a, b) {
  return a !== 0 && a < b;
}

/**
 * 将赛道优先级变为事件优先级
 * @param {*} lanes
 */
export function lanesToEventPriority(lanes) {
  // 获取最高优先级的lane
  let lane = getHighestPriorityLane(lanes);
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority;
  }
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority;
  }
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority;
  }
  return IdleEventPriority;
}
