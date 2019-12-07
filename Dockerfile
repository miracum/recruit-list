FROM node:13.3.0-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./

ARG VERSION=0.0.0
ENV VUE_APP_VERSION=${VERSION}
RUN npm run build

FROM node:13.3.0-alpine as deploy
WORKDIR /app
COPY --from=build /app/dist dist
COPY --from=build /app/server server
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/package.json .

EXPOSE 3000
ENTRYPOINT [ "npm", "run", "server:start" ]
