const express = require("express");
const path = require("path");
const logger = require("morgan");
const proxy = require("http-proxy-middleware");
const debug = require("debug")("server:server");
const http = require("http");
const bearerToken = require("express-bearer-token");
const promBundle = require("express-prom-bundle");
const history = require("connect-history-api-fallback");
const axios = require("axios");

const FHIR_URL = process.env.FHIR_URL || "http://localhost:8082/fhir";

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  normalizePath: [
    ["^/css/.*", "/css/#file"],
    ["^/img/.*", "/img/#file"],
    ["^/js/.*", "/js/#file"],
    ["^/static/.*", "/static/#file"],
    ["^/details/.*", "/details/#study-id"],
  ],
});

const app = express();
app.use(bearerToken());
app.use((req, res, next) => {
  if (req.path.endsWith("/metrics")) {
    const expectedToken = process.env.METRICS_BEARER_TOKEN;
    if (expectedToken) {
      if (!req.token) {
        return res.sendStatus(403);
      }
      if (req.token === expectedToken) {
        return next();
      }
      return res.sendStatus(403);
    }
  }
  return next();
});

app.get("/health", async (_req, res) => {
  try {
    const response = await axios.get(`${FHIR_URL}/metadata`);
    if (response.status !== 200) {
      return res.status(503).json({
        status: "unhealthy",
        description: `calling FHIR API returned non-OK status code: ${response.status}`,
      });
    }
    return res.json({
      status: "healthy",
      description: "application is healthy",
    });
  } catch (error) {
    return res.status(503).json({
      status: "unhealthy",
      description: `failed to call api: ${error.code}`,
    });
  }
});

app.use(metricsMiddleware);
app.use(logger("dev"));
app.use(express.json());

const proxyRequestFilter = (_pathname, req) => {
  return req.method === "GET" || req.method === "PUT";
};

app.use(
  "^/fhir",
  proxy(proxyRequestFilter, {
    target: FHIR_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/fhir": "/",
    },
    //   headers: {
    //     Authorization:
    //       process.env.API_BEARER_TOKEN,
    //   },
  })
);

app.use(history());

app.use(express.static(path.join(__dirname, "..", "dist")));

app.get("/", (_req, res) => {
  res.render(path.join(__dirname, "..", "dist/index.html"));
});

function normalizePort(val) {
  const port = parseInt(val, 10);

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

const server = http.createServer(app);

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

module.exports = app;
