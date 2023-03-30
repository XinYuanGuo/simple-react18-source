import ReactCurrentDispatcher from "./ReactCurrentDispatcher";

function resolveDispatcher() {
  return ReactCurrentDispatcher.current;
}

/**
 *
 * @param {*} reducer 处理函数，根据老状态和action计算新状态
 * @param {*} initialArg 初始状态
 */
export function useReducer(reducer, initialArg) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg);
}

export function useState(initialArg) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialArg);
}

export function useEffect(create, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
}

export function useLayoutEffect(create, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, deps);
}

export function useRef(initialValue) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}
