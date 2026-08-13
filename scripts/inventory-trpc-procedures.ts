import { appRouter } from "../server/routers";

const procedures = Object.entries(appRouter._def.procedures)
  .map(([path, procedure]) => {
    const definition = (procedure as { _def?: { type?: string; inputs?: unknown[] } })._def;
    return {
      path,
      type: definition?.type ?? "unknown",
      hasInputParser: Boolean(definition?.inputs?.length),
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

console.log(JSON.stringify({ count: procedures.length, procedures }, null, 2));
