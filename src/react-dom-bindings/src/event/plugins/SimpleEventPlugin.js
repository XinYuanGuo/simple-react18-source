import {
  registerSimpleEvents,
  topLevelEventsToReactNames,
} from "../DOMEventProperties";
import { accumulateSinglePhaseListeners } from "../DOMPluginEventSystem";
import { IS_CAPTURE_PHASE } from "../EventSystemFlags";
import { SyntheticMouseEvent } from "../SyntheticEvent";

/**
 * 提取事件 把要执行的回调函数添加到dispatchQueue中
 * @param {*} dispatchQueue 派发队列
 * @param {*} domEventName dom事件名
 * @param {*} targetInst 目标fiber
 * @param {*} nativeEvent 原生事件
 * @param {*} nativeEventTarget 原生事件源
 * @param {*} eventSystemFlags 事件类型 0 冒泡 4 捕获
 * @param {*} targetContainer 目标容器
 */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer
) {
  const reactName = topLevelEventsToReactNames.get(domEventName);
  let SyntheticEventCtor;
  switch (domEventName) {
    case "click":
      SyntheticEventCtor = SyntheticMouseEvent;
      break;
    default:
      break;
  }
  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  const listeners = accumulateSinglePhaseListeners(
    targetInst,
    reactName,
    nativeEvent.type,
    isCapturePhase
  );
  if (listeners.length) {
    // 创建合成事件的实例
    const event = new SyntheticEventCtor(
      reactName,
      domEventName,
      targetInst,
      nativeEvent,
      nativeEventTarget
    );

    dispatchQueue.push({
      event,
      listeners,
    });
  }
}

export { registerSimpleEvents as registerEvents, extractEvents };
