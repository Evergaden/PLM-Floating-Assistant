import { describe, expect, it } from "vitest";
import { parseCodeColumn } from "./MainImageLookup";

describe("Excel code column", () => {
  it("preserves duplicates and interior blank rows without a clipboard terminator row", () => {
    expect(parseCodeColumn("SKU00050716\t\r\n/\r\n\r\nSKU00050716\r\n")).toEqual(["SKU00050716", "/", "", "SKU00050716"]);
  });
  it("keeps invalid codes for row-level feedback", () => {
    expect(parseCodeColumn("SKU000507160\nabc")).toEqual(["SKU000507160", "abc"]);
  });
});
