/**
 * 向最小堆里添加节点
 * @param {*} heap
 * @param {*} node
 */
export function push(heap, node) {
  const index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}

/**
 * 查看最小堆堆顶元素
 * @param {*} heap
 */
export function peek(heap) {
  const first = heap[0];
  return first === undefined ? null : first;
}

/**
 * 弹出最小堆堆顶元素
 * @param {*} heap
 */
export function pop(heap) {
  const first = heap[0];
  if (first !== undefined) {
    const last = heap.pop();
    if (last !== first) {
      heap[0] = last;
      siftDown(heap, last, 0);
    }
    return first;
  } else {
    return null;
  }
}

/**
 * 向上调整堆结构 保证最小堆
 * @param {*} heap
 * @param {*} node
 * @param {*} i
 */
export function siftUp(heap, node, i) {
  let index = i;
  while (true) {
    // 等价于 (index-1) / 2 并向下取整
    const parentIndex = (index - 1) >>> 1;
    const parent = node[parentIndex];
    // 如果存在父节点 并且父节点比子节点大
    if (parent !== undefined && compare(parent, node) > 0) {
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      // 子节点比父节点要小 无需交换位置 结束循环
      return;
    }
  }
}

/**
 * 向下调整堆结构，保证最小堆
 */
export function siftDown(heap, node, i) {
  let index = i;
  const length = heap.length;
  while (index < length) {
    // 左子节点的索引
    const leftIndex = (index + 1) * 2 - 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];
    // 如果左节点存在 并且左节点小于父节点
    if (left !== undefined && compare(left, node) < 0) {
      // 如果右节点存在 且小于左节点
      if (right !== undefined && compare(right, left) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (right !== undefined && compare(right, node) < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      return;
    }
  }
}

function compare(a, b) {
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
