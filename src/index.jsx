import * as React from "react";
import { createRoot } from "react-dom/client";

let counter = 0;
let timer;
let bCounter = 0;
let cCounter = 0;
function FunctionComponent() {
  console.log("FunctionComponent", counter);
  const [numbers, setNumbers] = React.useState(new Array(100).fill("A"));
  const divRef = React.useRef();
  const updateB = (numbers) => new Array(100).fill(numbers[0] + "B");
  updateB.id = "updateB" + bCounter++;
  const updateC = (numbers) => new Array(100).fill(numbers[0] + "C");
  updateC.id = "updateC" + cCounter++;
  React.useEffect(() => {
    timer = setInterval(() => {
      divRef.current.click();
      const newCount = counter++;
      if (newCount === 0) {
        setNumbers(updateB);
      }
      divRef.current.click();
      if (newCount > 50) {
        clearInterval(timer);
      }
    });
  }, []);
  return (
    <div
      ref={divRef}
      onClick={() => {
        setNumbers(updateC);
      }}
    >
      {numbers.map((number, index) => (
        <span key={index}>{number}</span>
      ))}
    </div>
  );
}
const element = <FunctionComponent />;

const root = createRoot(document.getElementById("root"));

root.render(element);
