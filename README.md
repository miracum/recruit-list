# list

> The FHIR-based Screening List Module

## Development Setup

```sh
npm install
# starts a FHIR-server preloaded with sample studies @ http://localhost:8082/
docker-compose -f deploy/docker-compose.dev.yml up
```

### Compiles and hot-reloads for development

```sh
npm run serve
```

### Compiles and minifies for production

```sh
npm run build
```

### Run your unit tests

```sh
npm run test:unit
```

### Run your end-to-end tests

```sh
npm run test:e2e
```

### Lints and fixes files

```sh
npm run lint
```

### Run the server component

```sh
# Build the static assets first. These are served by the server.
npm run build

# Run the actual server
npm run server:start

# Optional: The app uses pino for structured logging.
#           To prettify the output when debugging, run the following:
npm install -g pino-pretty
npm run server:start | pino-pretty
```

### Disable Keycloak

For testing and development, it might be easier to disable Keycloak entirely. When running with `npm run serve`, you'll need to modify [config-dev.json](public/config-dev.json) and set `isKeycloakDisabled` to `true`.
When running the server, you'll need to set the env var `KEYCLOAK_DISABLED=true`.

### Export Keycloak realm config

```sh
standalone.sh -Dkeycloak.migration.action=export -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/aio-export.json
```

### Configure Table Columns

Editing the shown tablecolumns is possible. When running with `npm run serve`, you'll need to modify [config-dev.json](public/config-dev.json) and set `hideDemographics`, `hideLastVisit` and/or `hideEhrButton` to `true`.
When running the server, you'll need to set the env vars `HIDE_DEMOGRAPHICS=true`, `HIDE_LAST_VISIT=true`, `HIDE_EHR_BUTTON=true`.
