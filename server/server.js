const path = require("path");
const bearerToken = require("express-bearer-token");
const promBundle = require("express-prom-bundle");
const history = require("connect-history-api-fallback");
const helmet = require("helmet");
const pino = require("pino-http")();
const modifyResponse = require("node-http-proxy-json");
const probe = require("kube-probe");
const logger = require("pino")({ level: process.env.LOG_LEVEL || "info" });
const yaml = require("js-yaml");
const fs = require("fs");
const cors = require("cors");

const { createProxyMiddleware } = require("http-proxy-middleware");

const { createJwtCheck } = require("./auth");
const { createAccessFilter } = require("./fhirAccessFilter");
const { setupTracing } = require("./tracing");

const { config } = require("./config");

if (!config.auth.disabled && (!config.auth.url || !config.auth.clientId || !config.auth.realm)) {
  logger.error("Keycloak is not configured correctly: URL, client id, and realm are required.");
  process.exit(1);
}

const checkJwt = createJwtCheck(config);

// by default, do not any filtering, simply returing the resource to be filtered.
// eslint-disable-next-line no-unused-vars
let filterAcessibleResources = (resource, _user) => resource;

try {
  logger.child({ path: config.rulesFilePath }).debug("Trying to load trials config");
  const configString = fs.readFileSync(config.rulesFilePath, "utf8");
  const rulesConfig = yaml.load(configString);
  if (!rulesConfig.notify?.rules?.trials) {
    throw new Error("Invalid configuration file structure. Should be: notify.rules.trials.");
  }

  filterAcessibleResources = createAccessFilter(rulesConfig.notify.rules.trials, config.auth);
} catch (error) {
  logger
    .child({ error })
    .error("Failed to load the trial rules config. Defaulting to no filtering.");
}

if (config.tracing.enabled) {
  logger.child({ serviceName: config.tracing.serviceName }).info("Tracing is enabled.");
  setupTracing(config.tracing);
} else {
  logger.info("Tracing is disabled");
}

// express is required to be imported after the OTEL SDK is setup so the plugins work correctly
// eslint-disable-next-line import/order
const express = require("express");

// eslint-disable-next-line import/order
const http = require("http");

const dePseudonymizer = require("./dePseudonymizer");

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
app.use(cors());
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
  onProxyRes(proxyRes, req, res) {
    // eslint-disable-next-line no-param-reassign
    proxyRes.headers["Cache-Control"] = "no-store";
    return modifyResponse(res, proxyRes, async (body) => {
      if (!body) {
        return body;
      }

      let modifiedBody = body;

      if (!config.auth.disabled) {
        filterAcessibleResources(body, req.user);
      }

      if (config.pseudonymization.enabled) {
        logger.debug("De-pseudonymization is enabled. Modifying the response.");
        if (body.resourceType !== "Patient" && body.resourceType !== "Encounter") {
          modifiedBody = body;
        } else {
          try {
            modifiedBody = await dePseudonymizer.dePseudonymize(config.pseudonymization, body);
          } catch (error) {
            logger
              .child({ error })
              .error("De-pseudonymization failed. Returning original resource.");
          }
        }
      }
      return modifiedBody;
    });
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

app.use("^/fhir", checkJwt, proxy);

app.get("/config", (_req, res) =>
  res.json({
    hideDemographics: config.ui.hideDemographics,
    hideLastVisit: config.ui.hideLastVisit,
    hideEhrButton: config.ui.hideEhrButton,
    isKeycloakDisabled: config.auth.disabled,
    authClientId: config.auth.clientId,
    authUrl: config.auth.url,
    authRealm: config.auth.realm,
    realm: config.auth.realm,
    url: config.auth.url,
    clientId: config.auth.clientId,
    checkLoginIframeDisabled: config.auth.checkLoginIframeDisabled,
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
  logger.child({ error }).error(error);
  process.exit(1);
}

const server = http.createServer(app);

function onListening() {
  const addr = server.address();
  logger.info(`Listening on '${addr.address}:${addr.port}'`);
}

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

module.exports = app;
