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

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

### Export Keycloak realm config

```sh
standalone.sh -Dkeycloak.migration.action=export -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/aio-export.json
```
