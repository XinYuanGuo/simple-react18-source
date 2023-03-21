import * as React from "react";
import { createRoot } from "react-dom/client";

const reducer = (state, action) => {
  switch (action.type) {
    case "add":
      return state + action.payload;
    default:
      return state;
  }
};

const FunctionComponent = () => {
  const [num, dispatch] = React.useReducer(reducer, 0);
  return (
    <button
      onClick={() => {
        dispatch({ type: "add", payload: 1 });
      }}
    >
      {num}
    </button>
  );
};

let element = <FunctionComponent />;

const root = createRoot(document.getElementById("root"));

root.render(element);
