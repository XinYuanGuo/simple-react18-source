// Fiber的tag，每种虚拟dom都会有自己对应的tag

// 函数组件
export const FunctionComponent = 0;
// 类组件
export const ClassComponent = 1;
// 未定组件 因为函数组件和类组件都是一个函数
export const IndeterminateComponent = 2;
// 容器根节点
export const HostRoot = 3;
// 原生节点
export const HostComponent = 5;
// 文本节点
export const HostText = 6;
