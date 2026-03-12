import { describe, expect, it } from "vitest";

import { parseTransferMessage } from "@/lib/transfer";

describe("parseTransferMessage", () => {
  it("parses a structured transfer message", () => {
    const parsed = parseTransferMessage(`Email ваучера: parent@example.com
ID текущего поставщика: current-id
ID желаемого поставщика: target-id
Текущий вид спорта: Football
Желаемый вид спорта: Basketball`);

    expect(parsed).toEqual({
      voucherEmail: "parent@example.com",
      currentProviderId: "current-id",
      targetProviderId: "target-id",
      currentSport: "Football",
      targetSport: "Basketball",
    });
  });

  it("throws when a required field is missing", () => {
    expect(() =>
      parseTransferMessage(`Email ваучера: parent@example.com
ID текущего поставщика: current-id`),
    ).toThrow(/missing required fields/i);
  });
});
