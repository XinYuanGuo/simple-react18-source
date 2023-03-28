import { createUpdate, enqueueUpdate } from "./ReactFiberClassUpdateQueue";
import { createFiberRoot } from "./ReactFiberRoot";
import { requestUpdateLane, scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}

/**
 * 更新容器
 * @param {*} element 要渲染的元素
 * @param {*} container dom容器 FiberRootNode
 */
export function updateContainer(element, container) {
  // 获取当前的根Fiber
  const current = container.current;
  // 请求一个更新车道
  const lane = requestUpdateLane(current);

  // 创建更新
  const update = createUpdate();
  // 要更新的虚拟dom
  update.payload = { element };
  // 把此更新对象添加到current这个根fiber的更新队列上
  const root = enqueueUpdate(current, update, lane);
  scheduleUpdateOnFiber(root, current, lane);
}
