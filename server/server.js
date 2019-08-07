const express = require("express");
const path = require("path");
const logger = require("morgan");
const proxy = require("http-proxy-middleware");
const http = require("http");
const bearerToken = require("express-bearer-token");
const promBundle = require("express-prom-bundle");
const history = require("connect-history-api-fallback");

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  normalizePath: [
    ["^/css/.*", "/css/#file"],
    ["^/img/.*", "/img/#file"],
    ["^/js/.*", "/js/#file"],
    ["^/static/.*", "/static/#file"],
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
app.use(metricsMiddleware);
app.use(logger("dev"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "dist")));

const options = {
  target: process.env.FHIR_BACKEND_URL || "http://localhost:8080/fhir", // target host
  changeOrigin: true, // needed for virtual hosted sites
  pathRewrite: {
    "^/fhir": "/",
  },
//   headers: {
//     Authorization:
//       process.env.API_BEARER_TOKEN,
//   },
};
const apiProxy = proxy(options);
app.use("/fhir", apiProxy);

app.use(history());

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (Number.isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

const port = normalizePort(process.env.SERVER_PORT || "3000");
app.set("port", port);

const server = http.createServer(app);

server.listen(port);
server.on("error", (error) => {
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
});
server.on("listening", () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`Listening on ${bind}`);
});

module.exports = app;
