export const NoFlags = /*   */ 0b0000;

// 有此flag才会执行
export const HasEffect = /* */ 0b0001;

// Represents the phase in which the effect (not the clean-up) fires.
export const Insertion = /* */ 0b0010;
// useLayoutEffect
export const Layout = /*    */ 0b0100;
// useEffect
export const Passive = /*   */ 0b1000;
