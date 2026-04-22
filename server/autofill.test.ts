import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
    } as TrpcContext["res"],
  };
}

describe("autofill.loadUploadedFile", () => {
  it("loads the previously uploaded Quotes file for one-click autofill", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.autofill.loadUploadedFile({ source: "quotes" });

    expect(result.fileName).toBe("Quotes-All_with_notes_with_metadata.json");
    expect(result.source).toBe("quotes");
    expect(result.text).toContain("[");
  });

  it("loads the previously uploaded Clavis Aurea file for one-click autofill", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.autofill.loadUploadedFile({ source: "lexicon" });

    expect(result.fileName).toBe("Clavis_Aurea_Complete.json");
    expect(result.source).toBe("lexicon");
    expect(result.text).toContain("Clavis");
  });
});
