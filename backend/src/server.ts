import http from "node:http";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { closePool, getPool } from "./database/index.js";
import { mysqlMiddleware } from "./middleware/mysql.js";
import routes from "./routes/index.js";
import { attachSocketIO } from "./socket/io.js";

const app = express();
const pool = getPool();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(mysqlMiddleware(pool));

app.use(routes);

const server = http.createServer(app);
attachSocketIO(server);

server.listen(env.port, env.host, () => {
  console.info(`HTTP em http://${env.host}:${env.port}`);
});

function shutdown(): void {
  server.close(() => {
    closePool()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
