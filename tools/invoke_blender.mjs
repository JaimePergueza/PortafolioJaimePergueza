import net from "node:net";

const host = process.env.BLENDER_MCP_HOST || "127.0.0.1";
const port = Number.parseInt(process.env.BLENDER_MCP_PORT || "9876", 10);
const timeoutMs = Number.parseInt(
  process.env.BLENDER_MCP_TIMEOUT_MS || "15000",
  10
);

const commandType = process.argv[2];
const rawParams = process.argv[3];
const params = rawParams
  ? JSON.parse(
      rawParams.startsWith("base64:")
        ? Buffer.from(rawParams.slice(7), "base64").toString("utf8")
        : rawParams
    )
  : {};

if (!commandType) {
  console.error("Usage: node tools/invoke_blender.mjs <command-type> [params-json]");
  process.exit(2);
}

const response = await new Promise((resolve, reject) => {
  const socket = net.createConnection({ host, port });
  let buffer = "";
  let settled = false;

  const finish = (callback, value) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    socket.destroy();
    callback(value);
  };

  const timer = setTimeout(() => {
    finish(reject, new Error(`Timed out waiting for Blender on ${host}:${port}.`));
  }, timeoutMs);

  socket.on("connect", () => {
    socket.write(JSON.stringify({ type: commandType, params }));
  });

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    try {
      finish(resolve, JSON.parse(buffer));
    } catch (error) {
      if (!(error instanceof SyntaxError)) finish(reject, error);
    }
  });

  socket.on("error", (error) => finish(reject, error));
  socket.on("end", () => {
    if (settled) return;
    try {
      finish(resolve, JSON.parse(buffer));
    } catch {
      finish(reject, new Error("Blender returned an incomplete response."));
    }
  });
});

process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
