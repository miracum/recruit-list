const { NodeTracerProvider } = require("@opentelemetry/node");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const { BatchSpanProcessor } = require("@opentelemetry/tracing");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { ExpressInstrumentation } = require("@opentelemetry/instrumentation-express");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");

exports.setupTracing = (tracingConfig) => {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: tracingConfig.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.VERSION || "0.0.0",
    }),
  });
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      // Express instrumentation expects HTTP layer to be instrumented
      new HttpInstrumentation({
        ignoreIncomingPaths: [/^\/(api\/health\/.*|css|js|img|metrics|favicon|site\.webmanifest)/],
      }),
      new ExpressInstrumentation(),
    ],
  });

  const exporter = new JaegerExporter();

  provider.addSpanProcessor(new BatchSpanProcessor(exporter));

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register();
};
