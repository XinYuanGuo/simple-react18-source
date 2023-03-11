import { setValueForStyles } from "./CSSPropertyOperations";
import { setValueForProperty } from "./DOMPropertyOperations";
import setTextContent from "./setTextContent";

const STYLE = "style";
const CHILDREN = "children";

function setInitialDOMProperties(tag, domElement, nextProps) {
  for (const propKey in nextProps) {
    if (nextProps.hasOwnProperty(propKey)) {
      const nextProp = nextProps[propKey];
      if (propKey === STYLE) {
        setValueForStyles(domElement, nextProp);
      } else if (propKey === CHILDREN) {
        // children被单独处理，文本独生子节点除外，所以此处处理文本独生子
        if (typeof nextProp === "string" || typeof nextProp === "number") {
          setTextContent(domElement, nextProp + "");
        }
      } else if (nextProp !== null) {
        setValueForProperty(domElement, propKey, nextProp);
      }
    }
  }
}

export function setInitialProperties(domElement, tag, props) {
  setInitialDOMProperties(tag, domElement, props);
}
