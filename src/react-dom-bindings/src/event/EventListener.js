export function addEventCaptureListener(target, eventType, listener) {
  target.addEventListener(eventType, listener, true);
  return listener;
}

export function addEventBubbleListener(target, eventType, listener) {
  target.addEventListener(eventType, listener);
  return listener;
}
