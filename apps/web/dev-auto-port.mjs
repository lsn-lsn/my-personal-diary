import { spawn } from "node:child_process";
import net from "node:net";

const host = "127.0.0.1";
const startPort = Number(process.env.PORT ?? 3200);
const maxTries = 20;

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen({ port, host }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function pickPort() {
  for (let i = 0; i < maxTries; i += 1) {
    const port = startPort + i;
    // eslint-disable-next-line no-await-in-loop
    const free = await isPortFree(port);
    if (free) {
      return port;
    }
  }
  throw new Error(
    `No free port found between ${startPort} and ${startPort + maxTries - 1}`,
  );
}

const port = await pickPort();
if (port !== startPort) {
  console.log(`Port ${startPort} occupied, switched to ${port}`);
}

const child = spawn("next", ["dev", "--port", String(port)], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
