const path = require("path");
const logger = require("morgan");
const debug = require("debug")("server:server");
const bearerToken = require("express-bearer-token");
const promBundle = require("express-prom-bundle");
const history = require("connect-history-api-fallback");
const axios = require("axios");
const http = require("http");
const health = require("@cloudnative/health-connect");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { NodeTracerProvider } = require("@opentelemetry/node");
const { BatchSpanProcessor } = require("@opentelemetry/tracing");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { JaegerHttpTracePropagator } = require("@opentelemetry/propagator-jaeger");

// Use Jaeger propagator
const provider = new NodeTracerProvider({
  plugins: {
    express: {
      enabled: true,
      path: "@opentelemetry/plugin-express",
    },
    http: {
      path: "@opentelemetry/plugin-http",
      ignoreIncomingPaths: ["/live", "/health", "/ready", "/js", "/css", "/img"],
    },
  },
  propagator: new JaegerHttpTracePropagator(),
});
const exporter = new JaegerExporter({
  serviceName: "screeninglist",
});
provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();

const express = require("express");

const healthcheck = new health.HealthChecker();

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
app.use(logger("dev"));
app.use(express.json());
app.use(metricsMiddleware);

const livePromise = () =>
  new Promise((resolve) => {
    resolve();
  });
const liveCheck = new health.LivenessCheck("is alive", livePromise);
healthcheck.registerLivenessCheck(liveCheck);

const FHIR_URL = process.env.FHIR_URL || "http://localhost:8082/fhir";

const readyPromise = () => axios.get(`${FHIR_URL}/metadata`);
const readyCheck = new health.ReadinessCheck("can connect to fhir server", readyPromise);
healthcheck.registerReadinessCheck(readyCheck);

app.use("/live", health.LivenessEndpoint(healthcheck));
app.use("/ready", health.ReadinessEndpoint(healthcheck));
app.use("/health", health.HealthEndpoint(healthcheck));

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

const proxyRequestFilter = (_pathname, req) => {
  return req.method === "GET" || req.method === "PATCH";
};

app.use(
  "^/fhir",
  createProxyMiddleware(proxyRequestFilter, {
    target: FHIR_URL,
    changeOrigin: false,
    pathRewrite: {
      "^/fhir": "/",
    },
    secure: false,
    onProxyReq(proxyReq) {
      // the ApacheProxyAddressStrategy used by HAPI FHIR
      // constructs the server URL from both the X-Forwarded-Host and X-Forwarded-Port
      // since the X-Forwarded-Host created by HPM already contains the port (eg. localhost:8443)
      // the resulting FHIR server URL would end with the port number twice (eg. https://localhost:8443:8443)
      proxyReq.removeHeader("X-Forwarded-Port");

      const proto = proxyReq.getHeader("X-Forwarded-Proto");

      if (proto) {
        if (proto.includes("https")) {
          proxyReq.setHeader("X-Forwarded-Proto", "https");
        } else {
          proxyReq.setHeader("X-Forwarded-Proto", "http");
        }
      }
    },
    onProxyRes(_proxyRes, _req, _res) {},
    xfwd: true,
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

const port = normalizePort(process.env.PORT || "8080");
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
