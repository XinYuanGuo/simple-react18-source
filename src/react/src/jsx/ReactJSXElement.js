import hasOwnProperty from "shared/hasOwnProperty";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";

export function jsxDEV(type, config) {
  let propName;
  const props = {};
  let key = null;
  let ref = null;
  if (hasValidKey(config)) {
    key = config.key;
  }
  if (hasValidRef(config)) {
    ref = config.ref;
  }
  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }

  return ReactElement(type, key, ref, props);
}

function hasValidKey(config) {
  return config.key !== undefined;
}

function hasValidRef(config) {
  return config.ref !== undefined;
}

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};

function ReactElement(type, key, ref, props) {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
  };
}
