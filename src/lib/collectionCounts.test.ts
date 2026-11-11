import { describe, expect, it } from "vitest";
import { tallyCollectionCounts } from "./collectionCounts";

describe("tallyCollectionCounts", () => {
  it("counts members per collection, treating reported and confirmed as paid", () => {
    const counts = tallyCollectionCounts([
      { collection_id: "c1", status: "unpaid" },
      { collection_id: "c1", status: "reported_paid" },
      { collection_id: "c1", status: "confirmed_paid" },
      { collection_id: "c2", status: "unpaid" },
    ]);
    expect(counts).toEqual({
      c1: { paid: 2, total: 3 },
      c2: { paid: 0, total: 1 },
    });
  });

  it("returns nothing for no rows", () => {
    expect(tallyCollectionCounts([])).toEqual({});
  });
});
