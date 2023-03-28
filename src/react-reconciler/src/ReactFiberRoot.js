import { createHostRootFiber } from "./ReactFiber";
import { initialUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { NoLanes } from "./ReactFiberLane";

function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo;
  // 表示根上有哪些赛道等待被处理
  this.pendingLanes = NoLanes;
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
