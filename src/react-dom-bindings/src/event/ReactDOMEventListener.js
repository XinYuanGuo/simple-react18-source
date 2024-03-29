import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority,
} from "react-reconciler/src/ReactEventPriorities";
import { getClosestInstanceFromNode } from "../client/ReactDOMComponentTree";
import { dispatchEventForPluginEventSystem } from "./DOMPluginEventSystem";
import { getEventTarget } from "./getEventTarget";

export function createEventListenerWrapperWithPriority(
  targetContainer,
  domEventName,
  eventSystemFlags
) {
  const listenerWrapper = dispatchDiscreteEvent;
  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
}

/**
 * 派发离散的事件，所谓离散就是不连续触发的事件，如点击等。
 * 滚动、缩放等属于离散事件
 * @param {*} domEventName 事件名
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} container 容器
 * @param {*} nativeEvent 原生事件
 */
function dispatchDiscreteEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) {
  // 先获取当前事件优先级
  const previousPriority = getCurrentUpdatePriority();
  try {
    // 把当前的更新优先级设置为离散事件优先级
    setCurrentUpdatePriority(DiscreteEventPriority);
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    // 处理完成后设置为原来的值
    setCurrentUpdatePriority(previousPriority);
  }
}

/**
 * 此方法就是委托给容器的回调，当容器在捕获或者冒泡阶段处理事件时会执行此函数
 * @param {*} domEventName
 * @param {*} eventSystemFlags
 * @param {*} container
 * @param {*} nativeEvent
 */
function dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent) {
  // 获取事件源，它是一个真实dom
  const nativeEventTarget = getEventTarget(nativeEvent);
  // 找到距离事件源最近的fiber节点
  const targetInst = getClosestInstanceFromNode(nativeEventTarget);
  dispatchEventForPluginEventSystem(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    container
  );
}

/**
 * 获取事件优先级
 * @param {*} domEventName 事件名 click
 */
export function getEventPriority(domEventName) {
  switch (domEventName) {
    case "click":
      return DiscreteEventPriority;
    case "drag":
      return ContinuousEventPriority;
    default:
      return DefaultEventPriority;
  }
}
