FROM node:16.15 AS build
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --no-optional
COPY . .
ARG VERSION=0.0.0
ENV VUE_APP_VERSION=${VERSION} \
    NODE_ENV=production
RUN npm run build

FROM build AS test
RUN npm run test:unit

FROM build AS release
RUN npm prune --production

FROM node:16.15-slim
WORKDIR /app
ENV NODE_ENV=production \
    NO_UPDATE_NOTIFIER=true
COPY package.json ./
COPY package-lock.json ./
COPY --from=release /app/node_modules node_modules
COPY --from=release /app/server server
COPY --from=release /app/dist dist

USER 65534
EXPOSE 8080
CMD [ "node", "server/server.js" ]

ARG VERSION="0.0.0"
ARG GIT_REF=""
ARG BUILD_TIME=""
LABEL maintaner="miracum.org" \
    org.opencontainers.image.created=${BUILD_TIME} \
    org.opencontainers.image.authors="miracum.org" \
    org.opencontainers.image.source="https://gitlab.miracum.org/miracum/uc1/recruit/list" \
    org.opencontainers.image.version=${VERSION} \
    org.opencontainers.image.revision=${GIT_REF} \
    org.opencontainers.image.vendor="miracum.org" \
    org.opencontainers.image.title="uc1-recruit-list" \
    org.opencontainers.image.description="Web-based screening list for the MIRACUM patient recruitment system."
