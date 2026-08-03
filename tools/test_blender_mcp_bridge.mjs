import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bridgePath = path.join(__dirname, "blender_mcp_bridge.mjs");

function frame(message) {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  return Buffer.concat([
    Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, "utf8"),
    body,
  ]);
}

function createParser(onMessage) {
  let buffer = Buffer.alloc(0);

  return (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) {
        return;
      }

      const headerText = buffer.slice(0, headerEnd).toString("utf8");
      const match = headerText.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        throw new Error("Missing Content-Length in bridge response.");
      }

      const length = Number.parseInt(match[1], 10);
      const bodyStart = headerEnd + 4;
      const totalLength = bodyStart + length;
      if (buffer.length < totalLength) {
        return;
      }

      const body = buffer.slice(bodyStart, totalLength).toString("utf8");
      buffer = buffer.slice(totalLength);
      onMessage(JSON.parse(body));
    }
  };
}

async function main() {
  const nodePath = process.execPath;
  const child = spawn(nodePath, [bridgePath], {
    stdio: ["pipe", "pipe", "pipe"],
    env: process.env,
  });

  const pending = new Map();
  const parser = createParser((message) => {
    if (message.id !== undefined && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });

  child.stdout.on("data", parser);
  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  function request(message) {
    return new Promise((resolve) => {
      pending.set(message.id, resolve);
      child.stdin.write(frame(message));
    });
  }

  const init = await request({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "bridge-smoketest", version: "1.0.0" },
    },
  });

  child.stdin.write(
    frame({
      jsonrpc: "2.0",
      method: "notifications/initialized",
      params: {},
    })
  );

  const tools = await request({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  });

  const status = await request({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "blender_connection_status",
      arguments: {},
    },
  });

  child.stdin.end();
  child.kill();

  process.stdout.write(
    JSON.stringify(
      {
        initialize: init,
        toolsCount: tools.result?.tools?.length || 0,
        connectionStatus: status.result?.structuredContent || status.result,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
