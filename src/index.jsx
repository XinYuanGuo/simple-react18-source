import * as React from "react";
import { createRoot } from "react-dom/client";

function FunctionComponent() {
  const [numbers, setNumbers] = React.useState(0);
  const [number, setNumber] = React.useState(0);
  return (
    <div>
      <button
        onClick={() => {
          setNumber((number) => number + 1);
          setNumbers((number) => number + 2);
        }}
      >
        {number}
        {numbers}
      </button>
    </div>
  );
}
const element = <FunctionComponent />;

const root = createRoot(document.getElementById("root"));

root.render(element);
