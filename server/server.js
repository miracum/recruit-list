const path = require("path");
const debug = require("debug")("server:server");
const bearerToken = require("express-bearer-token");
const promBundle = require("express-prom-bundle");
const history = require("connect-history-api-fallback");
const http = require("http");
const helmet = require("helmet");
const pino = require("pino-http")();
const modifyResponse = require("node-http-proxy-json");
const probe = require("kube-probe");
const logger = require("pino")();

const { createProxyMiddleware } = require("http-proxy-middleware");
const { NodeTracerProvider } = require("@opentelemetry/node");
const { BatchSpanProcessor } = require("@opentelemetry/tracing");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { JaegerHttpTracePropagator } = require("@opentelemetry/propagator-jaeger");

const [hideDemographics, hideLastVisit, hideEhrButton] = [
  process.env.HIDE_DEMOGRAPHICS === "true" || process.env.HIDE_DEMOGRAPHICS === "1",
  process.env.HIDE_LAST_VISIT === "true" || process.env.HIDE_LAST_VISIT === "1",
  process.env.HIDE_EHR_BUTTON === "true" || process.env.HIDE_EHR_BUTTON === "1",
];

let [authUrl, authClientId, authRealm, isKeycloakDisabled] = [
  process.env.KEYCLOAK_AUTH_URL,
  process.env.KEYCLOAK_CLIENT_ID,
  process.env.KEYCLOAK_REALM,
  process.env.KEYCLOAK_DISABLED === "true" || process.env.KEYCLOAK_DISABLED === "1",
];

const config = {
  pseudonymization: {
    enabled:
      process.env.DE_PSEUDONYMIZATION_ENABLED === "true" ||
      process.env.DE_PSEUDONYMIZATION_ENABLED === "1",
    url: process.env.DE_PSEUDONYMIZATION_SERVICE_URL || "http://localhost:5000/fhir",
    apiKey: process.env.DE_PSEUDONYMIZATION_API_KEY || "fhir-pseudonymizer-api-key",
  },
  tracing: {
    enabled: process.env.TRACING_ENABLED === "true" || process.env.TRACING_ENABLED === "1",
    serviceName:
      process.env.JAEGER_SERVICE_NAME || process.env.OTEL_SERVICE_NAME || "screeninglist",
  },
  shouldLogRequests: process.env.LOG_REQUESTS === "true" || process.env.LOG_REQUESTS === "1",
  metrics: {
    bearerToken: process.env.METRICS_BEARER_TOKEN,
  },
  fhirUrl: process.env.FHIR_URL || "http://localhost:8082/fhir",
};

// TODO: this is quite ugly
if (process.env.NODE_ENV !== "production") {
  [authUrl, authClientId, authRealm, isKeycloakDisabled] = [
    "http://localhost:8083/auth",
    "uc1-screeninglist",
    "MIRACUM",
    true,
  ];
}

if (!isKeycloakDisabled && (!authUrl || !authClientId || !authRealm)) {
  logger.error("Error: Keycloak not configured.");
  process.exit(1);
}

if (config.tracing.enabled) {
  // Use Jaeger propagator
  const provider = new NodeTracerProvider({
    plugins: {
      express: {
        enabled: true,
        path: "@opentelemetry/plugin-express",
      },
      http: {
        enabled: true,
        path: "@opentelemetry/plugin-http",
        ignoreIncomingPaths: [/^\/(api\/health\/.*|css|js|img|metrics|favicon|site.webmanifest)/],
        // used by the readiness check
        ignoreOutgoingUrls: [/\/fhir\/metadata/],
      },
    },
    propagator: new JaegerHttpTracePropagator(),
  });
  const exporter = new JaegerExporter({
    serviceName: config.tracing.serviceName,
  });
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  provider.register();
}

// express is required to be imported after the OTEL SDK is setup so the plugins work correctly
const express = require("express");
const dePseudonymizer = require("./de-pseudonymizer");

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  normalizePath: [
    ["^/css/.*", "/css/#file"],
    ["^/img/.*", "/img/#file"],
    ["^/js/.*", "/js/#file"],
    ["^/recommendations/.*", "/recommendations/#recommendation-id"],
    ["^/patients/.*/record", "/patients/#subject-id/record"],
  ],
});

const app = express();

// add liveness and readiness probes
probe(app);

if (config.shouldLogRequests) {
  app.use(pino);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(bearerToken());
app.use(express.json());
app.use(metricsMiddleware);

const proxyRequestFilter = (_pathname, req) => req.method === "GET" || req.method === "PATCH";
const proxy = createProxyMiddleware(proxyRequestFilter, {
  target: config.fhirUrl,
  changeOrigin: false,
  pathRewrite: {
    "^/fhir": "/",
  },
  secure: false,
  xfwd: true,
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
  onProxyRes(proxyRes, _req, res) {
    // eslint-disable-next-line no-param-reassign
    proxyRes.headers["Cache-Control"] = "no-store";
    if (config.pseudonymization.enabled) {
      logger.debug("De-pseudonymization is enabled. Modifying the response.");
      return modifyResponse(res, proxyRes, async (body) => {
        if (body) {
          if (body.resourceType !== "Patient" && body.resourceType !== "Encounter") {
            return body;
          }
          try {
            return await dePseudonymizer.dePseudonymize(config.pseudonymization, body);
          } catch (err) {
            logger.error(`De-pseudonymization failed: '${err}'. Returning original resource.`);
          }
        }
        return body;
      });
    }
    return res;
  },
});

app.use((req, res, next) => {
  if (req.path.endsWith("/metrics")) {
    const expectedToken = config.metrics.bearerToken;
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

app.use("^/fhir", proxy);

app.get("/config", (_req, res) =>
  res.json({
    hideDemographics,
    hideLastVisit,
    hideEhrButton,
    isKeycloakDisabled,
    authClientId,
    authUrl,
    authRealm,
    realm: authRealm,
    url: authUrl,
    clientId: authClientId,
  })
);

app.use(history());

app.use(express.static(path.join(__dirname, "..", "dist")));

app.get("/", (_req, res) => {
  res.render(path.join(__dirname, "..", "dist/index.html"));
});

const port = process.env.PORT || 8080;

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }
  console.error(`${error}`);
  process.exit(1);
}

const server = http.createServer(app);

function onListening() {
  const addr = server.address();
  debug(`Listening on ${addr}`);
}

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

module.exports = app;
