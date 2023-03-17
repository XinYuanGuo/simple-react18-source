import assign from "shared/assign";
import hasOwnProperty from "shared/hasOwnProperty";

function functionThatReturnsTrue() {
  return true;
}

function functionThatReturnsFalse() {
  return false;
}

const MouseEventInterface = {
  clientX: 0,
  clientY: 0,
};

function createSyntheticEvent(Interface) {
  // 合成事件的基类
  function SyntheticBaseEvent(
    reactName,
    reactEventType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    this._reactName = reactName;
    this.type = reactEventType;
    this._targetInst = targetInst;
    this.nativeEvent = nativeEvent;
    this.target = nativeEventTarget;

    // 把此接口上对应的属性从原生事件上拷贝到合成事件实例上
    for (const propName in Interface) {
      if ((!Interface, hasOwnProperty(propName))) {
        continue;
      }
      this[propName] = nativeEvent(propName);
    }
    this.isDefaultPrevented = functionThatReturnsFalse;
    this.isPropagationStopped = functionThatReturnsFalse;
    return this;
  }

  assign(SyntheticBaseEvent.prototype, {
    preventDefault() {
      const event = this.nativeEvent;

      if (event.preventDefault) {
        event.preventDefault();
      } else {
        event.returnValue = false;
      }

      this.isDefaultPrevented = functionThatReturnsTrue;
    },
    stopPropagation() {
      const event = this.nativeEvent;

      if (event.stopPropagation) {
        event.stopPropagation();
      } else {
        event.cancelBubble = true;
      }

      this.isPropagationStopped = functionThatReturnsTrue;
    },
  });

  return SyntheticBaseEvent;
}

export const SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface);
