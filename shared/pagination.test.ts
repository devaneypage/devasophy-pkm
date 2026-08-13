import { describe, expect, it } from "vitest";
import { buildPageInfo } from "./pagination";

describe("buildPageInfo", () => {
  it("describes the first page of a multi-page collection", () => {
    expect(buildPageInfo(6_357, 1, 25)).toEqual({
      page: 1,
      pageSize: 25,
      total: 6_357,
      totalPages: 255,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it("describes an empty result without inventing a page", () => {
    expect(buildPageInfo(0, 1, 25)).toEqual({
      page: 1,
      pageSize: 25,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it("marks the final page correctly", () => {
    expect(buildPageInfo(51, 3, 25)).toMatchObject({
      totalPages: 3,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });
});
