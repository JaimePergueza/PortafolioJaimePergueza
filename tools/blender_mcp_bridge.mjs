import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const defaultCaptureDir = path.join(workspaceRoot, ".codex", "blender-captures");

const BLENDER_HOST = process.env.BLENDER_MCP_HOST || "127.0.0.1";
const BLENDER_PORT = Number.parseInt(process.env.BLENDER_MCP_PORT || "9876", 10);
const SOCKET_TIMEOUT_MS = Number.parseInt(process.env.BLENDER_MCP_TIMEOUT_MS || "15000", 10);
const SERVER_NAME = "blender-mcp-bridge";
const SERVER_VERSION = "0.1.0";

const toolDefinitions = [
  {
    name: "blender_connection_status",
    description:
      "Checks whether Blender's BlenderMCP addon is reachable on the configured TCP socket and, if it is, returns a lightweight scene summary.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "blender_get_scene_info",
    description:
      "Returns a compact summary of the currently open Blender scene, including object count and the first visible objects.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "blender_get_object_info",
    description:
      "Returns transform, visibility, materials, mesh counts, and bounding box data for one Blender object by name.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Exact Blender object name.",
        },
      },
      required: ["name"],
      additionalProperties: false,
    },
  },
  {
    name: "blender_execute_code",
    description:
      "Executes Python code inside the currently open Blender session through the BlenderMCP addon. Use carefully and prefer short, targeted snippets.",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Python code to execute inside Blender.",
        },
      },
      required: ["code"],
      additionalProperties: false,
    },
  },
  {
    name: "blender_capture_viewport_screenshot",
    description:
      "Captures the current Blender 3D viewport to an image file and returns the saved path.",
    inputSchema: {
      type: "object",
      properties: {
        filepath: {
          type: "string",
          description:
            "Optional absolute or workspace-relative output path. If omitted, the bridge creates a timestamped file under .codex/blender-captures.",
        },
        format: {
          type: "string",
          description: "Image format such as png or jpg.",
          default: "png",
        },
        maxSize: {
          type: "integer",
          description: "Maximum size in pixels for the largest image dimension.",
          default: 1200,
          minimum: 64,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "blender_raw_command",
    description:
      "Sends a raw BlenderMCP addon command type and params object directly to Blender. Useful for addon features not yet wrapped as dedicated tools.",
    inputSchema: {
      type: "object",
      properties: {
        commandType: {
          type: "string",
          description: "Addon command type, for example get_scene_info or search_sketchfab_models.",
        },
        params: {
          type: "object",
          description: "Arguments object forwarded to the addon handler as keyword arguments.",
          additionalProperties: true,
        },
      },
      required: ["commandType"],
      additionalProperties: false,
    },
  },
];

const toolHandlers = {
  async blender_connection_status() {
    try {
      const response = await sendBlenderCommand("get_scene_info", {});
      return {
        connected: true,
        host: BLENDER_HOST,
        port: BLENDER_PORT,
        response,
      };
    } catch (error) {
      return {
        connected: false,
        host: BLENDER_HOST,
        port: BLENDER_PORT,
        error: error.message,
        hint:
          "Open Blender, enable the BlenderMCP addon if needed, then in the BlenderMCP sidebar panel click 'Connect to MCP server'.",
      };
    }
  },

  async blender_get_scene_info() {
    return sendBlenderCommand("get_scene_info", {});
  },

  async blender_get_object_info(args) {
    return sendBlenderCommand("get_object_info", { name: args.name });
  },

  async blender_execute_code(args) {
    return sendBlenderCommand("execute_code", { code: args.code });
  },

  async blender_capture_viewport_screenshot(args) {
    const format = (args.format || "png").toLowerCase();
    const maxSize = Number.isInteger(args.maxSize) ? args.maxSize : 1200;

    let filepath = args.filepath;
    if (!filepath) {
      await mkdir(defaultCaptureDir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      filepath = path.join(defaultCaptureDir, `viewport-${stamp}.${format}`);
    } else if (!path.isAbsolute(filepath)) {
      filepath = path.resolve(workspaceRoot, filepath);
    }

    return sendBlenderCommand("get_viewport_screenshot", {
      filepath,
      format,
      max_size: maxSize,
    });
  },

  async blender_raw_command(args) {
    return sendBlenderCommand(args.commandType, args.params || {});
  },
};

function normalizeToolResult(result, isError = false) {
  const text =
    typeof result === "string" ? result : JSON.stringify(result, null, 2);

  const payload = {
    content: [{ type: "text", text }],
    isError,
  };

  if (result && typeof result === "object") {
    payload.structuredContent = result;
  }

  return payload;
}

function writeMessage(message) {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, "utf8");
  process.stdout.write(Buffer.concat([header, body]));
}

function writeError(id, code, message, data) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  });
}

async function sendBlenderCommand(commandType, params) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: BLENDER_HOST, port: BLENDER_PORT });
    let buffer = "";
    let settled = false;

    const finish = (fn, value) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.removeAllListeners();
      clearTimeout(timer);
      try {
        socket.end();
      } catch {}
      fn(value);
    };

    const timer = setTimeout(() => {
      finish(
        reject,
        new Error(
          `Timed out waiting for Blender on ${BLENDER_HOST}:${BLENDER_PORT}.`
        )
      );
    }, SOCKET_TIMEOUT_MS);

    socket.on("connect", () => {
      socket.write(JSON.stringify({ type: commandType, params }));
    });

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      try {
        const parsed = JSON.parse(buffer);
        finish(resolve, parsed);
      } catch (error) {
        if (!(error instanceof SyntaxError)) {
          finish(reject, error);
        }
      }
    });

    socket.on("error", (error) => {
      if (error.code === "ECONNREFUSED") {
        finish(
          reject,
          new Error(
            `Could not connect to BlenderMCP at ${BLENDER_HOST}:${BLENDER_PORT}. Make sure Blender is open and the addon server is started.`
          )
        );
        return;
      }

      finish(reject, error);
    });

    socket.on("end", () => {
      if (!settled) {
        if (!buffer.trim()) {
          finish(
            reject,
            new Error("Blender closed the socket without sending a response.")
          );
          return;
        }

        try {
          const parsed = JSON.parse(buffer);
          finish(resolve, parsed);
        } catch {
          finish(
            reject,
            new Error("Received an incomplete JSON response from Blender.")
          );
        }
      }
    });
  });
}

async function handleRequest(request) {
  const { id, method, params } = request;

  if (!method) {
    writeError(id ?? null, -32600, "Invalid Request", "Missing method.");
    return;
  }

  if (method === "initialize") {
    writeMessage({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: params?.protocolVersion || "2025-03-26",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
      },
    });
    return;
  }

  if (method === "notifications/initialized") {
    return;
  }

  if (method === "tools/list") {
    writeMessage({
      jsonrpc: "2.0",
      id,
      result: {
        tools: toolDefinitions,
      },
    });
    return;
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const handler = toolHandlers[toolName];

    if (!handler) {
      writeError(id, -32602, `Unknown tool: ${toolName}`);
      return;
    }

    try {
      const result = await handler(params?.arguments || {});
      const isError =
        Boolean(result?.isError) ||
        result?.status === "error" ||
        Object.prototype.hasOwnProperty.call(result || {}, "error");

      writeMessage({
        jsonrpc: "2.0",
        id,
        result: normalizeToolResult(result, isError),
      });
    } catch (error) {
      writeMessage({
        jsonrpc: "2.0",
        id,
        result: normalizeToolResult(
          {
            status: "error",
            message: error.message,
          },
          true
        ),
      });
    }
    return;
  }

  writeError(id ?? null, -32601, `Method not found: ${method}`);
}

let stdinBuffer = Buffer.alloc(0);

function tryParseMessages() {
  while (true) {
    const headerEnd = stdinBuffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      return;
    }

    const headerText = stdinBuffer.slice(0, headerEnd).toString("utf8");
    const headers = Object.fromEntries(
      headerText
        .split("\r\n")
        .map((line) => line.split(/:\s*/, 2))
        .filter(([key]) => key)
        .map(([key, value]) => [key.toLowerCase(), value])
    );

    const contentLength = Number.parseInt(headers["content-length"] || "", 10);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      writeError(null, -32700, "Parse error", "Missing or invalid Content-Length header.");
      stdinBuffer = Buffer.alloc(0);
      return;
    }

    const bodyStart = headerEnd + 4;
    const totalLength = bodyStart + contentLength;
    if (stdinBuffer.length < totalLength) {
      return;
    }

    const body = stdinBuffer.slice(bodyStart, totalLength).toString("utf8");
    stdinBuffer = stdinBuffer.slice(totalLength);

    let message;
    try {
      message = JSON.parse(body);
    } catch (error) {
      writeError(null, -32700, "Parse error", error.message);
      continue;
    }

    Promise.resolve(handleRequest(message)).catch((error) => {
      console.error("Unhandled request error:", error);
      if (message?.id !== undefined) {
        writeError(message.id, -32603, "Internal error", error.message);
      }
    });
  }
}

process.stdin.on("data", (chunk) => {
  stdinBuffer = Buffer.concat([stdinBuffer, chunk]);
  tryParseMessages();
});

process.stdin.on("end", () => {
  process.exit(0);
});

process.stdin.resume();
