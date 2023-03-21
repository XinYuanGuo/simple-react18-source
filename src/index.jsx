import * as React from "react";
import { createRoot } from "react-dom/client";

function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  return number === 0 ? (
    <div onClick={() => setNumber(number + 1)} key="title" id="title">
      title
    </div>
  ) : (
    <div onClick={() => setNumber(number + 1)} key="title" id="title2">
      title2
    </div>
  );
}
let element = <FunctionComponent />;

const root = createRoot(document.getElementById("root"));

root.render(element);
