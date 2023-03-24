export const NoFlags = /*                      */ 0b0000000000000000000000000000;
export const PerformedWork = /*                */ 0b0000000000000000000000000001;
export const Placement = /*                    */ 0b0000000000000000000000000010;
export const DidCapture = /*                   */ 0b0000000000000000000010000000;
export const Hydrating = /*                    */ 0b0000000000000001000000000000;
export const Update = /*                       */ 0b0000000000000000000000000100;
// 子节点需要删除
export const ChildDeletion = /*                */ 0b0000000000000000000000010000;
export const Passive = /*                      */ 0b0000000000000000100000000000;

export const MutationMask = Placement | Update | ChildDeletion;
export const LayoutMask = Update;
