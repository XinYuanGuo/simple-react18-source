import { createRoot } from "react-dom/client";

const FunctionComponent = () => {
  return (
    <h1 onClick={() => console.log("click")}>
      Hello <span style={{ color: "red" }}>world</span>
    </h1>
  );
};

let element = <FunctionComponent />;

const root = createRoot(document.getElementById("root"));
root.render(element);
