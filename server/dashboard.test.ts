import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { buildSevenMonthActivity } from "./db";
import type { TrpcContext } from "./_core/context";

describe("atelier dashboard", () => {
  it("builds a chronological seven-month activity series", () => {
    const result = buildSevenMonthActivity(
      [
        { createdAt: new Date("2026-03-04T12:00:00.000Z") },
        { createdAt: new Date("2026-08-10T12:00:00.000Z") },
        { createdAt: new Date("2026-08-18T12:00:00.000Z") },
        { createdAt: new Date("2026-09-01T12:00:00.000Z") },
      ],
      new Date("2026-09-12T12:00:00.000Z")
    );

    expect(result.map((month) => month.label)).toEqual(["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]);
    expect(result.map((month) => month.total)).toEqual([1, 0, 0, 0, 0, 2, 1]);
  });

  it("requires authentication before loading the live dashboard overview", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} },
      res: {},
    } as TrpcContext);

    await expect(caller.dashboard.overview()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
