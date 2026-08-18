import { fail } from "./errors.js";

function encode(value, path, ancestors) {
  if (value === null) return "null";

  switch (typeof value) {
    case "string":
      return JSON.stringify(value);
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) {
        fail("NON_JSON_VALUE", "JSON numbers must be finite.", path, { kind: "number" });
      }
      return Object.is(value, -0) ? "0" : JSON.stringify(value);
    case "object": {
      if (ancestors.has(value)) {
        fail("NON_JSON_VALUE", "JSON values must not contain cycles.", path, { kind: "cycle" });
      }
      ancestors.add(value);
      try {
        if (Array.isArray(value)) {
          for (let index = 0; index < value.length; index += 1) {
            if (!Object.hasOwn(value, index)) {
              fail("NON_JSON_VALUE", "Sparse arrays are not valid canonical JSON values.", [...path, index], { kind: "sparse-array" });
            }
            if (!Object.hasOwn(Object.getOwnPropertyDescriptor(value, index), "value")) {
              fail("NON_JSON_VALUE", "Accessor array items are not valid explicit JSON values.", [...path, index], { kind: "accessor" });
            }
          }
          if (Object.getOwnPropertySymbols(value).length > 0) {
            fail("NON_JSON_VALUE", "Symbol properties are not valid JSON values.", path, { kind: "symbol-property" });
          }
          return `[${value.map((item, index) => encode(item, [...path, index], ancestors)).join(",")}]`;
        }

        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null) {
          fail("NON_JSON_VALUE", "Only plain objects can be rendered as JSON.", path, { kind: "object" });
        }
        for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
          if (!Object.hasOwn(descriptor, "value")) {
            fail("NON_JSON_VALUE", "Accessor properties are not valid explicit JSON values.", [...path, key], { kind: "accessor" });
          }
        }
        if (Object.getOwnPropertySymbols(value).length > 0) {
          fail("NON_JSON_VALUE", "Symbol properties are not valid JSON values.", path, { kind: "symbol-property" });
        }
        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${encode(value[key], [...path, key], ancestors)}`).join(",")}}`;
      } finally {
        ancestors.delete(value);
      }
    }
    default:
      fail("NON_JSON_VALUE", "Value cannot be represented as JSON.", path, { kind: typeof value });
  }
}

/** Deterministic Studio JSON v1: sorted object keys, preserved array order, JSON escaping. */
export function canonicalJson(value, path = []) {
  return encode(value, path, new Set());
}
