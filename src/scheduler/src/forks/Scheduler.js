import { peek, pop, push } from "./ScheduleMinHeap";
import {
  IdlePriority,
  ImmediatePriority,
  LowPriority,
  NormalPriority,
  UserBlockingPriority,
} from "./SchedulerPriorities";

function getCurrentTime() {
  // 从启动到现在的时间
  return performance.now();
}

var maxSigned31BitInt = 1073741823;

// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

// 任务id计数器
let taskIdCounter = 1;
// 任务最小堆
const taskQueue = [];
let scheduleHostCallback = null;
let startTime = -1;
// 当前的任务
let currentTask = null;
// React每一帧向浏览器申请5毫秒去执行任务
// 如果5毫秒内没有完成 react也会放弃控制器 将控制交还给浏览器
const frameInterval = 5;

const channel = new MessageChannel();
var port1 = channel.port1;
var port2 = channel.port2;
port1.onmessage = performWorkUntilDeadline;

/**
 * 按优先级执行任务
 * @param {*} callback
 */
export function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime();
  const startTime = currentTime;
  let timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }

  const expirationTime = startTime + timeout;
  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    // 排序依据
    sortIndex: expirationTime,
  };
  // 向最小堆中添加任务，排序的依据是过期时间
  push(taskQueue, newTask);
  requestHostCallback(flushWork);
  return newTask;
}

function flushWork(startTime) {
  return workLoop(startTime);
}

function shouldYieldToHost() {
  // 过去的时间
  const timeElapsed = getCurrentTime() - startTime;
  // 如果消耗的时间小于请求的时间则继续执行
  if (timeElapsed < frameInterval) {
    return false;
  }
  // 否则暂停执行
  return true;
}

function workLoop(startTime) {
  let currentTime = startTime;
  // 优先级最高的任务
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    // 如果当前任务的过期时间小于当前时间，也就是说没有过期，但是时间片到期了需要放弃执行
    // 因此就算时间片到期了 但是当前任务已经过期照样需要去执行
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }
    // 取出当前任务的回调函数
    const callback = currentTask.callback;
    if (typeof callback === "function") {
      currentTask.callback = null;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      // 执行工作
      const continuationCallback = callback(didUserCallbackTimeout);
      // 如果返回值是个函数 说明任务还未完成
      if (typeof continuationCallback === "function") {
        currentTask.callback = continuationCallback;
        return true;
      }
      // 如果此任务已经完成 就把这个任务弹出
      if (currentTask === peek(taskQueue)) {
        pop(taskQueue);
      }
    } else {
      pop(taskQueue);
    }

    // 取出下一个任务执行
    currentTask = peek(taskQueue);
  }
  if (currentTask !== null) {
    return true;
  }
  return false;
}

function requestHostCallback(flushWork) {
  scheduleHostCallback = flushWork;
  schedulePerformWorkUntilDeadline();
}

function schedulePerformWorkUntilDeadline() {
  port2.postMessage(null);
}

/**
 * 执行工作直到过期 模拟requestIdleCallback
 */
function performWorkUntilDeadline() {
  if (scheduleHostCallback) {
    // 先获取开始时间
    startTime = getCurrentTime();
    let hasMoreWork = true;
    try {
      // 执行flushWork
      hasMoreWork = scheduleHostCallback(startTime);
    } finally {
      // 执行完以后如果为true说明还有任务
      if (hasMoreWork) {
        // 调度一个新的执行
        schedulePerformWorkUntilDeadline();
      } else {
        scheduleCallback = null;
      }
    }
  }
}

function unstable_cancelCallback(task) {
  task.callback = null;
}

export {
  unstable_cancelCallback,
  shouldYieldToHost as unstable_shouldYield,
  scheduleCallback as unstable_scheduleCallback,
  getCurrentTime as unstable_now,
  IdlePriority as unstable_IdlePriority,
  ImmediatePriority as unstable_ImmediatePriority,
  LowPriority as unstable_LowPriority,
  NormalPriority as unstable_NormalPriority,
  UserBlockingPriority as unstable_UserBlockingPriority,
};
