export const allNativeEvents = new Set();

/**
 * 注册两个阶段的事件
 * @param {*} registrationName
 * @param {*} dependencies
 */
export function registerTwoPhaseEvent(registrationName, dependencies) {
  // 注册冒泡事件的对应关系
  registerDirectEvent(registrationName, dependencies);
  // 注册捕获事件的对应关系
  registerDirectEvent(registrationName + "Capture", dependencies);
}

export function registerDirectEvent(registrationName, dependencies) {
  for (let i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i]);
  }
}
