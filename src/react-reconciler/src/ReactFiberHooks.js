import ReactSharedInternals from "shared/ReactSharedInternals";
import { enqueueConcurrentHookUpdate } from "./ReactFiberConcurrentUpdates";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

const { ReactCurrentDispatcher } = ReactSharedInternals;

// 当前正在使用中的hook
let workInProgressHook = null;
// 当前正在渲染的Fiber
let currentlyRenderingFiber = null;

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
};

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
  ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  // 需要再函数组件执行前给ReactCurrentDispatcher.current赋值
  const children = Component(props);
  return children;
}
