# list - The Web-based Screening List

Implemented using VueJS.


## Project setup

### Install dependencies
```
npm install
```

### Start development FHIR server

This automatically seeds the server with the sample data from deploy/data/fhir-sample.json)
```
docker-compose -f deploy/docker-compose.dev.yml up
```

### Compiles and hot-reloads for development
```
npm run serve
```
You can now access the app @ [http://localhost:8080/](http://localhost:8080/)


## Contributing

Commit Messages follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.4/) specification.
Running `npm install` automatically installs git hooks which check whether a commit follows the specification before commiting.
