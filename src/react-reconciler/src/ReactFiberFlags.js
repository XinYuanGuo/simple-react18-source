export const NoFlags = /*                      */ 0b000000000000000000000000000;
export const PerformedWork = /*                */ 0b000000000000000000000000001;
export const Placement = /*                    */ 0b000000000000000000000000010;
export const DidCapture = /*                   */ 0b000000000000000000010000000;
export const Hydrating = /*                    */ 0b000000000000001000000000000;
export const Update = /*                       */ 0b000000000000000000000000100;

export const ChildDeletion = /*                */ 0b000000000000000000000010000;

export const MutationMask = Placement | Update | ChildDeletion;
