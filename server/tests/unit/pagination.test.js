import { describe, expect, it } from "vitest";
import { parsePositiveInteger } from "../../src/utils/pagination.js";

describe("parsePositiveInteger", () => {
  it("uses the fallback when the value is absent", () => {
    expect(parsePositiveInteger(undefined, 10)).toBe(10);
  });

  it("accepts positive integer strings", () => {
    expect(parsePositiveInteger("3", 10)).toBe(3);
  });

  it.each(["", "0", "-1", "1.5", "abc"])(
    "rejects invalid value %s",
    (value) => {
      expect(parsePositiveInteger(value, 10)).toBeNull();
    }
  );
});
