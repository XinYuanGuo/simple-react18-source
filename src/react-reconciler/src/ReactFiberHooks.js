import ReactSharedInternals from "shared/ReactSharedInternals";
import { enqueueConcurrentHookUpdate } from "./ReactFiberConcurrentUpdates";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

const { ReactCurrentDispatcher } = ReactSharedInternals;

// 当前正在使用中的hook
let workInProgressHook = null;
// 当前正在渲染的Fiber
let currentlyRenderingFiber = null;
// 老的hook
let currentHook = null;

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
};

const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
};

// 构建新的hook
function updateWorkInProgressHook() {
  // 首先拿到老hook
  if (currentHook === null) {
    // currentHook为null说明是第一个hook
    const current = currentlyRenderingFiber.alternate;
    currentHook = current.memoizedState;
  } else {
    currentHook = currentHook.next;
  }

  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null,
  };

  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  return workInProgressHook;
}

function updateReducer(reducer) {
  // 获取新的hook
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  // 老的hook
  const current = currentHook;
  // 获取将要生效的队列
  const pendingQueue = queue.pending;
  // 初始化一个新的状态，取值为当前的状态
  let newState = current.memoizedState;
  if (pendingQueue !== null) {
    queue.pending = null;
    const firstUpdate = pendingQueue.next;
    let update = firstUpdate;
    do {
      const action = updateAction;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== null && update !== firstUpdate);
    hook.memoizedState = newState;
    return [hook.memoizedState, queue.dispatch];
  }
}

function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialArg;
  const queue = {
    pending: null,
    dispatch: null,
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [hook.memoizedState, dispatch];
}

/**
 * 执行派发动作的方法 它要更新状态并且让界面重新更新
 * @param {*} fiber
 * @param {*} queue
 * @param {*} action
 */
function dispatchReducerAction(fiber, queue, action) {
  // 在每个hook里会存放一个更新队列，更新队列是一个更新对象的循环链表
  const update = {
    action,
    next: null,
  };
  // 把当前最新的更新添加到更新队列中，并返回当前的根fiber
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root, fiber);
}

/**
 * 挂载构建中的hook
 */
function mountWorkInProgressHook() {
  const hook = {
    // hook的状态
    memoizedState: null,
    // 存放本hook的更新队列, queue.pending = update的循环链表
    queue: null,
    // 指向下一个hook
    next: null,
  };

  // 是否是第一个hook
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }

  return workInProgressHook;
}

/**
 * 渲染函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件
 * @param {*} props 属性
 * @returns 虚拟dom或React元素
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress;
  // 如果有老的fiber并且有老的hook链表
  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  }
  ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  // 需要再函数组件执行前给ReactCurrentDispatcher.current赋值
  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  return children;
}
