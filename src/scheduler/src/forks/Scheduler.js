/**
 * 此处需要实现一个优先队列
 * @param {*} callback
 */
export function scheduleCallback(callback) {
  requestIdleCallback(callback);
}
