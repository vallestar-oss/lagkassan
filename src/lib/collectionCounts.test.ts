import { describe, expect, it } from "vitest";
import { tallyCollectionCounts } from "./collectionCounts";

describe("tallyCollectionCounts", () => {
  it("counts roster members, treating reported and confirmed as paid", () => {
    const counts = tallyCollectionCounts(
      [],
      [
        { collection_id: "c1", status: "unpaid" },
        { collection_id: "c1", status: "reported_paid" },
        { collection_id: "c1", status: "confirmed_paid" },
      ],
    );
    expect(counts.c1).toEqual({ paid: 2, total: 3 });
  });

  it("falls back to payment rows for collections without a roster", () => {
    const counts = tallyCollectionCounts(
      [
        { collection_id: "free", status: "paid" },
        { collection_id: "free", status: "paid" },
      ],
      [],
    );
    expect(counts.free).toEqual({ paid: 2, total: 2 });
  });

  it("prefers roster counts over payment rows for the same collection", () => {
    const counts = tallyCollectionCounts(
      [{ collection_id: "c1", status: "paid" }],
      [
        { collection_id: "c1", status: "reported_paid" },
        { collection_id: "c1", status: "unpaid" },
      ],
    );
    expect(counts.c1).toEqual({ paid: 1, total: 2 });
  });

  it("returns nothing for collections with no rows", () => {
    expect(tallyCollectionCounts([], [])).toEqual({});
  });
});
