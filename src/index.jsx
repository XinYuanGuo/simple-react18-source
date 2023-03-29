import * as React from "react";
import { createRoot } from "react-dom/client";

function FunctionComponent() {
  console.log("FunctionComponent");
  const initialState = new Array(10).fill("A");
  const [numbers, setNumbers] = React.useState(initialState);
  React.useEffect(() => {
    setNumbers((numbers) => {
      return numbers.map((number) => number + "B");
    });
  }, []);
  return (
    <div>
      <button
        onClick={() => {
          setNumbers((numbers) => numbers.map((number) => number + "C"));
        }}
      >
        click
      </button>
      <ul>
        {numbers.map((number, index) => (
          <li key={index}>{number}</li>
        ))}
      </ul>
    </div>
  );
}
const element = <FunctionComponent />;

const root = createRoot(document.getElementById("root"));

root.render(element);
