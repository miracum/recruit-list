FROM node:14.4 as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-optional
COPY . .
ARG VERSION=0.0.0
ENV VUE_APP_VERSION=${VERSION} \
    NODE_ENV=production
RUN npm run build && \
    npm prune --production

FROM node:14.4-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
COPY --from=build /app/server server
COPY --from=build /app/dist dist
COPY --from=build /app/node_modules node_modules

USER node
EXPOSE 8080
HEALTHCHECK CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1
ENTRYPOINT [ "npm", "run", "server:start"]

ARG VERSION="0.0.0"
ARG GIT_REF=""
ARG BUILD_TIME=""
LABEL org.opencontainers.image.created=${BUILD_TIME} \
    org.opencontainers.image.authors="miracum.org" \
    org.opencontainers.image.source="https://gitlab.miracum.org/miracum/uc1/recruit/list" \
    org.opencontainers.image.version=${VERSION} \
    org.opencontainers.image.revision=${GIT_REF} \
    org.opencontainers.image.vendor="miracum.org" \
    org.opencontainers.image.title="uc1-recruit-list" \
    org.opencontainers.image.description="Web-based screening list for the MIRACUM patient recruitment system."
