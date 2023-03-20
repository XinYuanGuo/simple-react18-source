import { createRoot } from "react-dom/client";

// const FunctionComponent = () => {
//   return (
//     <h1 onClick={() => console.log("click")}>
//       Hello <span style={{ color: "red" }}>world</span>
//     </h1>
//   );
// };

// let element = <FunctionComponent />;

let element = (
  <h1>
    hello
    <span style={{ color: "red" }}>world</span>
  </h1>
);

const root = createRoot(document.getElementById("root"));

debugger;
root.render(element);
