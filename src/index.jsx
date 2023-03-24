import * as React from "react";
import { createRoot } from "react-dom/client";

function Counter() {
  const [number, setNumber] = React.useState(0);
  React.useEffect(() => {
    console.log("useEffect1");
    return () => {
      console.log("destroy useEffect1");
    };
  });
  React.useLayoutEffect(() => {
    console.log("useLayoutEffect");
    return () => {
      console.log("destroy useEffect2");
    };
  });
  React.useEffect(() => {
    console.log("useEffect3");
    return () => {
      console.log("destroy useEffect3");
    };
  });
  return (
    <div>
      <button
        onClick={() => {
          setNumber(number + 1);
        }}
      >
        {number}
      </button>
    </div>
  );
}
let element = <Counter />;

const root = createRoot(document.getElementById("root"));

root.render(element);
