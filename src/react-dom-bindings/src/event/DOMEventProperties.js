import { registerTwoPhaseEvent } from "./EventRegistry";

const simpleEventPluginEvents = ["click"];

export const topLevelEventsToReactNames = new Map();

export function registerSimpleEvents() {
  for (let i = 0; i < simpleEventPluginEvents.length; i++) {
    const eventName = simpleEventPluginEvents[i];
    const domEventName = eventName.toLowerCase();
    // 首字母大写
    const capitalizedEvent = eventName[0].toUpperCase() + eventName.slice(1);

    registerSimpleEvent(domEventName, `on${capitalizedEvent}`);
  }
}

export function registerSimpleEvent(domEventName, reactName) {
  // 把原生事件名和处理函数的名字进行映射或者绑定
  topLevelEventsToReactNames.set(domEventName, reactName);
  registerTwoPhaseEvent(reactName, [domEventName]);
}
