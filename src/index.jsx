import { createRoot } from "react-dom/client";

const Element = (
  <h1>
    Hello <span style={{ color: "red" }}>world</span>
  </h1>
);

const root = createRoot(document.getElementById("root"));
root.render(Element);
