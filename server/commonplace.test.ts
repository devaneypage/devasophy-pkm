import { randomUUID } from "node:crypto";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { DEFAULT_COMMONPLACE_COLUMNS } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCommonplaceContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
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
    res: {} as TrpcContext["res"],
  };
}

describe("commonplace router", () => {
  it("defines the six canonical seeded columns", () => {
    expect(DEFAULT_COMMONPLACE_COLUMNS.map((column) => column.title)).toEqual([
      "01 - Foundations",
      "02 - Atelier",
      "03 - Archives",
      "04 - Network",
      "05 - Drafts",
      "06 - Sources",
    ]);
  });

  it("returns a default board snapshot", async () => {
    const caller = appRouter.createCaller(createCommonplaceContext());

    const snapshot = await caller.commonplace.bootstrap();

    expect(snapshot.board.title).toBeTruthy();
    expect(snapshot.columns.length).toBeGreaterThanOrEqual(4);
  });

  it("creates a board, column, and entry, then updates and moves the entry", async () => {
    const caller = appRouter.createCaller(createCommonplaceContext());
    const suffix = randomUUID().slice(0, 8);

    const board = await caller.commonplace.boards.create({
      title: `Commonplace Test ${suffix}`,
      description: "Vitest board",
    });

    const column = await caller.commonplace.columns.create({
      boardId: board.id,
      title: `Column ${suffix}`,
      colorToken: "vermillion",
    });

    const entry = await caller.commonplace.entries.create({
      boardId: board.id,
      columnId: column.id,
      entryType: "research_note",
      title: `Entry ${suffix}`,
      summary: "Initial summary",
      content: {
        markdown: "# Draft\n\nThis is a research note.",
      },
      metadata: {
        tone: "working",
      },
      tags: "draft,commonplace",
    });

    expect(entry.title).toContain(suffix);
    expect(entry.entryType).toBe("research_note");

    await caller.commonplace.entries.update({
      id: entry.id,
      title: `Updated ${suffix}`,
      summary: "Refined summary",
      isArchived: false,
    });

    const movedColumn = await caller.commonplace.columns.create({
      boardId: board.id,
      title: `Moved ${suffix}`,
      colorToken: "bright_blue",
    });

    await caller.commonplace.entries.move({
      id: entry.id,
      columnId: movedColumn.id,
      position: 0,
    });

    const entries = await caller.commonplace.entries.list({ boardId: board.id });
    const updatedEntry = entries.find((item) => item.id === entry.id);

    expect(updatedEntry?.columnId).toBe(movedColumn.id);
    expect(updatedEntry?.title).toBe(`Updated ${suffix}`);

    await caller.commonplace.entries.delete({ id: entry.id });

    const remainingEntries = await caller.commonplace.entries.list({ boardId: board.id });
    expect(remainingEntries.some((item) => item.id === entry.id)).toBe(false);
  });
});
