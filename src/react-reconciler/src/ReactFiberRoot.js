import { createHostRootFiber } from "./ReactFiber";
import { initialUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { createLaneMap, NoLanes, NoTimestamp } from "./ReactFiberLane";

function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo;
  // 表示根上有哪些赛道等待被处理
  this.pendingLanes = NoLanes;
  this.callbackNode = null;
  // 过期时间 存放每个赛道的过期时间
  this.expirationTimes = createLaneMap(NoTimestamp);
  // 过期赛道
  this.expiredLanes = NoLanes;
}

/**
                -------->current-------->
  FiberRootNode                           HostRootFiber
                <-------stateNode<-------
*/
export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo);
  const uninitializedFiber = createHostRootFiber();
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;
  initialUpdateQueue(uninitializedFiber);
  return root;
}
