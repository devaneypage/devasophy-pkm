import app from "./express-server";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Devasophy PKM server running at http://0.0.0.0:${port}`);
});
