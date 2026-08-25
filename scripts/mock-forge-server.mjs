import http from "node:http";

const port = Number(process.env.MOCK_FORGE_PORT ?? 3120);
const server = http.createServer((request, response) => {
  if (request.method === "GET" && request.url === "/umami") {
    response.writeHead(200, { "content-type": "application/javascript", "cache-control": "no-store" });
    response.end("void 0;");
    return;
  }

  if (request.method === "GET" && request.url?.startsWith("/v1/storage/presign/get")) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ url: `http://127.0.0.1:${port}/mock-storage/asset.svg` }));
    return;
  }

  if (request.method === "GET" && request.url === "/mock-storage/asset.svg") {
    response.writeHead(200, { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" });
    response.end('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120"><rect width="320" height="120" rx="20" fill="#f9f6ef"/><text x="160" y="68" text-anchor="middle" font-family="serif" font-size="28" fill="#13243f">Devanomy</text></svg>');
    return;
  }

  if (request.method !== "POST" || request.url !== "/v1/chat/completions") {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "not-found" }));
    return;
  }

  let body = "";
  request.on("data", (chunk) => {
    body += chunk.toString();
  });
  request.on("end", () => {
    JSON.parse(body || "{}");
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      id: "ci-mock-completion",
      created: Math.floor(Date.now() / 1000),
      model: "ci-mock",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "Verified CI response." },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }));
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock Forge ready on port ${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
